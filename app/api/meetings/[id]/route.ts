import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { rowToMeeting } from '@/app/api/meetings/route'

// PATCH /api/meetings/:id  →  { project_id: string | null }  (vincula/desvincula)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id }  = await params
    const body    = await req.json() as { project_id?: string | null }
    const db      = await initDb()

    await db.execute({
      sql:  `UPDATE meetings SET project_id = ?, auto_matched = 0 WHERE id = ?`,
      args: [body.project_id ?? null, id],
    })

    // Marca a notificação como lida ao vincular manualmente
    if (body.project_id) {
      await db.execute({
        sql:  `UPDATE notifications SET read = 1 WHERE type = 'unlinked_meeting' AND json_extract(payload, '$.meeting_id') = ?`,
        args: [id],
      })
    }

    const res = await db.execute({ sql: `SELECT * FROM meetings WHERE id = ?`, args: [id] })
    if (!res.rows.length) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    return NextResponse.json(rowToMeeting(res.rows[0] as unknown as Record<string, unknown>))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// DELETE /api/meetings/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const db     = await initDb()
    await db.execute({ sql: `DELETE FROM meetings WHERE id = ?`, args: [id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
