import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

// ── DELETE /api/attachments/[id] ─────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db = await initDb()
    await db.execute({ sql: 'DELETE FROM task_attachments WHERE id = ?', args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
