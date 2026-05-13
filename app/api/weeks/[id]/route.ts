import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Week } from '@/lib/types'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<Week>
    const db = await initDb()
    await db.execute({
      sql: `
        UPDATE weeks
        SET goals = :goals, notes = :notes
        WHERE id = :id
      `,
      args: { goals: null, notes: null, ...body, id: params.id },
    })
    const res = await db.execute({ sql: 'SELECT * FROM weeks WHERE id = ?', args: [params.id] })
    const updated = res.rows[0] as unknown as Week
    return NextResponse.json(updated)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    await db.execute({ sql: 'DELETE FROM weeks WHERE id = ?', args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
