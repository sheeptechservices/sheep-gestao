import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { fetchFirefliesTranscript, buildTranscriptText } from '@/lib/fireflies'
import { rowToProject } from '@/app/api/projects/route'
import type { Project } from '@/lib/types'

// ── Auto-match helpers ────────────────────────────────────────────────────────

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim()
}

function scoreMatch(candidate: string, haystack: string): number {
  const words = normalize(candidate).split(/\s+/).filter(w => w.length > 2)
  if (!words.length) return 0
  const norm    = normalize(haystack)
  const matched = words.filter(w => norm.includes(w)).length
  return matched / words.length
}

function autoMatch(title: string, context: string, projects: Project[]): string | null {
  let best = { id: '', score: 0 }

  for (const p of projects) {
    const candidates = [p.name, p.client?.name ?? ''].filter(Boolean)
    for (const c of candidates) {
      // título tem peso dobrado — match no título é mais confiável
      const score = scoreMatch(c, title) * 2 + scoreMatch(c, context)
      if (score > best.score && score >= 1.0) best = { id: p.id, score }
    }
  }

  return best.id || null
}

// ── Webhook handler ───────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { meetingId?: string; eventType?: string }

    const meetingId = body.meetingId
    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId obrigatório' }, { status: 400 })
    }

    const db = await initDb()

    // Resolve API key: banco tem prioridade, env é fallback
    const keyRow = await db.execute({
      sql:  `SELECT api_key FROM integrations WHERE id = 'fireflies' AND api_key != '' LIMIT 1`,
      args: [],
    })
    const apiKey: string | undefined =
      (keyRow.rows[0]?.api_key as string | undefined) ?? process.env.FIREFLIES_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Fireflies API key não configurada. Adicione em Integrações ou no .env.local.' },
        { status: 500 },
      )
    }

    // Evita processar o mesmo meeting duas vezes
    const existing = await db.execute({
      sql:  `SELECT id FROM meetings WHERE fireflies_id = ? LIMIT 1`,
      args: [meetingId],
    })
    if (existing.rows.length > 0) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Busca transcrição na API do Fireflies
    const transcript = await fetchFirefliesTranscript(meetingId, apiKey)
    if (!transcript) {
      return NextResponse.json({ error: 'Transcrição não encontrada' }, { status: 404 })
    }

    const summary     = transcript.summary?.overview   ?? ''
    const actionItems = transcript.summary?.action_items ?? ''
    const fullText    = transcript.sentences?.length
      ? buildTranscriptText(transcript.sentences)
      : ''
    const date        = transcript.date ? new Date(transcript.date).toISOString() : null
    const duration    = transcript.duration ? Math.round(transcript.duration / 60) : null

    // Carrega projetos ativos para matching
    const projRes  = await db.execute({
      sql: `
        SELECT p.*, c.id AS c_id, c.name AS c_name, c.color_hex AS c_color_hex,
               c.created_at AS c_created_at
        FROM   projects p
        LEFT JOIN clients c ON c.id = p.client_id
        WHERE  p.status != 'cancelled'
      `,
      args: [],
    })
    const projects = projRes.rows.map(r =>
      rowToProject(r as unknown as Record<string, unknown>),
    )

    // Contexto para matching — apenas sugestão, nunca vincula automaticamente
    const context         = `${summary} ${fullText.slice(0, 1000)}`
    const suggestedId     = autoMatch(transcript.title, context, projects)
    const suggestedProject = suggestedId ? projects.find(p => p.id === suggestedId) : null

    const id  = `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()

    // Salva sempre sem projeto — usuário decide depois
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO meetings
          (id, fireflies_id, title, date, duration, summary, transcript,
           action_items, participants, project_id, auto_matched, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id, meetingId, transcript.title, date, duration,
        summary, fullText, actionItems,
        JSON.stringify(transcript.participants ?? []),
        null, 0, now,
      ],
    })

    // Notificação sempre do tipo unlinked — com sugestão opcional no payload
    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    await db.execute({
      sql: `INSERT INTO notifications (id, type, payload, read, created_at) VALUES (?, ?, ?, 0, ?)`,
      args: [
        notifId,
        'unlinked_meeting',
        JSON.stringify({
          meeting_id: id,
          title: transcript.title,
          date,
          suggested_project_id:   suggestedProject?.id   ?? null,
          suggested_project_name: suggestedProject?.name ?? null,
        }),
        now,
      ],
    })

    return NextResponse.json({ ok: true, meeting_id: id, suggested_project_id: suggestedId ?? null })
  } catch (err) {
    console.error('[fireflies webhook]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
