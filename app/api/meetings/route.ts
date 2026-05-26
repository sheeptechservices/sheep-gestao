import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Meeting } from '@/lib/types'

function rowToMeeting(row: Record<string, unknown>): Meeting {
  return {
    id:                row.id           as string,
    fireflies_id:      row.fireflies_id as string,
    title:             row.title        as string,
    date:              row.date         as string | undefined,
    duration:          row.duration     as number | undefined,
    summary:           row.summary      as string | undefined,
    transcript:        row.transcript   as string | undefined,
    action_items:      row.action_items as string | undefined,
    participants:      row.participants      ? JSON.parse(row.participants      as string) : [],
    meeting_attendees: row.meeting_attendees ? JSON.parse(row.meeting_attendees as string) : [],
    project_id:        row.project_id   as string | undefined,
    lead_id:           row.lead_id      as string | undefined,
    auto_matched:      Boolean(row.auto_matched),
    created_at:        row.created_at   as string,
  }
}

export { rowToMeeting }

// GET /api/meetings?project_id=xxx        →  meetings do projeto
// GET /api/meetings?project_id=xxx&limit=3 →  últimas N reuniões
// GET /api/meetings                        →  todos os meetings
export async function GET(req: NextRequest) {
  try {
    const db        = await initDb()
    const projectId = req.nextUrl.searchParams.get('project_id')
    const leadId    = req.nextUrl.searchParams.get('lead_id')
    const limitParam = req.nextUrl.searchParams.get('limit')
    const limit      = limitParam ? parseInt(limitParam, 10) : null

    const orderBy = `ORDER BY COALESCE(date, created_at) DESC`
    const limitSql = limit ? ` LIMIT ${limit}` : ''

    const res = projectId
      ? await db.execute({
          sql:  `SELECT * FROM meetings WHERE project_id = ? ${orderBy}${limitSql}`,
          args: [projectId],
        })
      : leadId
      ? await db.execute({
          sql:  `SELECT * FROM meetings WHERE lead_id = ? ${orderBy}${limitSql}`,
          args: [leadId],
        })
      : await db.execute({
          sql:  `SELECT * FROM meetings ${orderBy}${limitSql}`,
          args: [],
        })

    return NextResponse.json(res.rows.map(r => rowToMeeting(r as unknown as Record<string, unknown>)))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PATCH /api/meetings  →  { read_all: true } para marcar todas notificações como lidas
// (rota compat — não usada diretamente, mantida por simetria)
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { meeting_id: string; project_id: string }
    if (!body.meeting_id || !body.project_id) {
      return NextResponse.json({ error: 'meeting_id e project_id obrigatórios' }, { status: 400 })
    }
    const db = await initDb()
    await db.execute({
      sql:  `UPDATE meetings SET project_id = ?, auto_matched = 0 WHERE id = ?`,
      args: [body.project_id, body.meeting_id],
    })
    // Remove notificação correspondente
    await db.execute({
      sql:  `UPDATE notifications SET read = 1 WHERE type = 'unlinked_meeting' AND json_extract(payload, '$.meeting_id') = ?`,
      args: [body.meeting_id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
