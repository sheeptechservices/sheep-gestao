import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Week } from '@/lib/types'

export async function GET() {
  try {
    const db = await initDb()
    const res = await db.execute({ sql: 'SELECT * FROM weeks ORDER BY start_date', args: [] })
    return NextResponse.json(res.rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Week
    if (!body.id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }
    const db = await initDb()
    await db.execute({
      sql: `
        INSERT INTO weeks (id, week_number, start_date, end_date, goals, notes, created_at)
        VALUES (:id, :week_number, :start_date, :end_date, :goals, :notes, :created_at)
      `,
      args: { goals: null, notes: null, ...body },
    })
    return NextResponse.json(body, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
