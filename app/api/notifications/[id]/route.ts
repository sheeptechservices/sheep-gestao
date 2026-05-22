import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

// PATCH /api/notifications/:id  →  { read: true }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const body   = await req.json() as { read?: boolean }
    const db     = await initDb()

    if (body.read !== undefined) {
      await db.execute({
        sql:  `UPDATE notifications SET read = ? WHERE id = ?`,
        args: [body.read ? 1 : 0, id],
      })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
