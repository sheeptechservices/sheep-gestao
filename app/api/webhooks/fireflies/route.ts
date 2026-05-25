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
    const body = await req.json() as Record<string, unknown>

    // Tenta camelCase e snake_case
    const meetingId = (body.meetingId ?? body.meeting_id ?? body.id) as string | undefined
    if (!meetingId) {
      return NextResponse.json({ error: 'meetingId obrigatório', received: body }, { status: 400 })
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
      // Transcrição ainda não disponível ou ID inválido (ex: Test Webhook do Fireflies)
      return NextResponse.json({ ok: true, skipped: true, reason: 'transcript_not_found' })
    }

    const summary     = transcript.summary?.overview   ?? ''
    const actionItems = transcript.summary?.action_items ?? ''
    const fullText    = transcript.sentences?.length
      ? buildTranscriptText(transcript.sentences)
      : ''
    const date        = transcript.date ? new Date(transcript.date).toISOString() : null
    const duration    = transcript.duration ? Math.round(transcript.duration) : null

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

    // Auto-match: se houver projeto identificado, vincula automaticamente
    const context        = `${summary} ${fullText.slice(0, 1000)}`
    const matchedId      = autoMatch(transcript.title, context, projects)
    const matchedProject = matchedId ? projects.find(p => p.id === matchedId) : null

    const id  = `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()

    // Salva a reunião — com projeto se encontrado, sem projeto caso contrário
    await db.execute({
      sql: `
        INSERT OR IGNORE INTO meetings
          (id, fireflies_id, title, date, duration, summary, transcript,
           action_items, participants, meeting_attendees, project_id, auto_matched, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      args: [
        id, meetingId, transcript.title, date, duration,
        summary, fullText, actionItems,
        JSON.stringify(transcript.participants ?? []),
        JSON.stringify(transcript.meeting_attendees ?? []),
        matchedId ?? null, matchedId ? 1 : 0, now,
      ],
    })

    const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

    if (matchedProject) {
      // Vinculação automática: notificação verde informando ao usuário
      await db.execute({
        sql: `INSERT INTO notifications (id, type, payload, read, created_at) VALUES (?, ?, ?, 0, ?)`,
        args: [
          notifId,
          'linked_meeting',
          JSON.stringify({
            meeting_id:   id,
            title:        transcript.title,
            date,
            project_id:   matchedProject.id,
            project_name: matchedProject.name,
          }),
          now,
        ],
      })
    } else {
      // Sem match: notificação para o usuário vincular manualmente
      await db.execute({
        sql: `INSERT INTO notifications (id, type, payload, read, created_at) VALUES (?, ?, ?, 0, ?)`,
        args: [
          notifId,
          'unlinked_meeting',
          JSON.stringify({
            meeting_id: id,
            title:      transcript.title,
            date,
            suggested_project_id:   null,
            suggested_project_name: null,
          }),
          now,
        ],
      })
    }

    return NextResponse.json({ ok: true, meeting_id: id, matched_project_id: matchedId ?? null })
  } catch (err) {
    console.error('[fireflies webhook]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
