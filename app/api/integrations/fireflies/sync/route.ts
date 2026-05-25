import { NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { listFirefliesTranscripts, buildTranscriptText } from '@/lib/fireflies'
import { rowToProject } from '@/app/api/projects/route'
import type { Project } from '@/lib/types'

// ── Auto-match (igual ao webhook) ─────────────────────────────────────────────

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
      const score = scoreMatch(c, title) * 2 + scoreMatch(c, context)
      if (score > best.score && score >= 1.0) best = { id: p.id, score }
    }
  }
  return best.id || null
}

// ── POST /api/integrations/fireflies/sync ─────────────────────────────────────

export async function POST() {
  try {
    const db = await initDb()

    // Resolve API key: banco → env
    const keyRow = await db.execute({
      sql:  `SELECT api_key FROM integrations WHERE id = 'fireflies' AND api_key != '' LIMIT 1`,
      args: [],
    })
    const apiKey: string | undefined =
      (keyRow.rows[0]?.api_key as string | undefined) ?? process.env.FIREFLIES_API_KEY

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Fireflies API key não configurada.' },
        { status: 500 },
      )
    }

    // Carrega IDs já no banco
    const existingRes = await db.execute(`SELECT fireflies_id FROM meetings`)
    const existingIds = new Set(existingRes.rows.map(r => r.fireflies_id as string))

    // Carrega projetos ativos para matching
    const projRes = await db.execute({
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

    // Busca todas as transcrições do Fireflies (paginado, máx 50 por página)
    let skip       = 0
    const limit    = 50
    let total      = 0
    let imported   = 0
    let skipped    = 0

    while (true) {
      const batch = await listFirefliesTranscripts(apiKey, skip, limit)
      if (batch.length === 0) break
      total += batch.length

      for (const t of batch) {
        if (existingIds.has(t.id)) { skipped++; continue }

        const summary     = t.summary?.overview    ?? ''
        const actionItems = t.summary?.action_items ?? ''
        const fullText    = t.sentences?.length ? buildTranscriptText(t.sentences) : ''
        const date        = t.date ? new Date(t.date).toISOString() : null
        const duration    = t.duration ? Math.round(t.duration / 60) : null

        // Sugestão de projeto (sem vincular automaticamente)
        const context       = `${summary} ${fullText.slice(0, 1000)}`
        const suggestedId   = autoMatch(t.title, context, projects)
        const suggestedProj = suggestedId ? projects.find(p => p.id === suggestedId) : null

        const id  = `mtg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        const now = new Date().toISOString()

        await db.execute({
          sql: `
            INSERT OR IGNORE INTO meetings
              (id, fireflies_id, title, date, duration, summary, transcript,
               action_items, participants, meeting_attendees, project_id, auto_matched, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
          args: [
            id, t.id, t.title, date, duration,
            summary, fullText, actionItems,
            JSON.stringify(t.participants ?? []),
            JSON.stringify(t.meeting_attendees ?? []),
            null, 0, now,
          ],
        })

        const notifId = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        await db.execute({
          sql: `INSERT INTO notifications (id, type, payload, read, created_at) VALUES (?, ?, ?, 0, ?)`,
          args: [
            notifId,
            'unlinked_meeting',
            JSON.stringify({
              meeting_id: id,
              title: t.title,
              date,
              suggested_project_id:   suggestedProj?.id   ?? null,
              suggested_project_name: suggestedProj?.name ?? null,
            }),
            now,
          ],
        })

        existingIds.add(t.id)  // evita duplicata se aparecer em outra página
        imported++
      }

      if (batch.length < limit) break  // última página
      skip += limit
    }

    return NextResponse.json({ ok: true, total, imported, skipped })
  } catch (err) {
    console.error('[fireflies sync]', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
