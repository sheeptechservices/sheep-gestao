import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql: `
        SELECT DISTINCT p.id, p.name, p.color_hex, p.status, p.type
        FROM tasks t
        JOIN projects p ON p.id = t.project_id
        WHERE t.member_id = ?
        ORDER BY p.name ASC
      `,
      args: [params.id],
    })
    return NextResponse.json(res.rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
