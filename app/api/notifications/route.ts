import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Notification } from '@/lib/types'

function rowToNotification(row: Record<string, unknown>): Notification {
  return {
    id:         row.id         as string,
    type:       row.type       as Notification['type'],
    payload:    JSON.parse(row.payload as string),
    read:       Boolean(row.read),
    created_at: row.created_at as string,
  }
}

// GET /api/notifications
export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  `SELECT * FROM notifications ORDER BY created_at DESC LIMIT 50`,
      args: [],
    })
    return NextResponse.json(res.rows.map(r => rowToNotification(r as unknown as Record<string, unknown>)))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// PATCH /api/notifications  →  { read_all: true }
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json() as { read_all?: boolean }
    if (body.read_all) {
      const db = await initDb()
      await db.execute({ sql: `UPDATE notifications SET read = 1`, args: [] })
      return NextResponse.json({ ok: true })
    }
    return NextResponse.json({ error: 'payload inválido' }, { status: 400 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
