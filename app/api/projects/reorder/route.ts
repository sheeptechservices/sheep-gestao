import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const { ids } = await req.json() as { ids: string[] }
    const db = await initDb()

    if (ids.length === 0) {
      await db.execute({ sql: 'UPDATE projects SET display_order = 0', args: [] })
    } else {
      await db.batch(
        ids.map((id, idx) => ({
          sql: 'UPDATE projects SET display_order = ? WHERE id = ?',
          args: [idx + 1, id],
        })),
        'write'
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
