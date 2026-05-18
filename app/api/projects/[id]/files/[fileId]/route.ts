import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

/** DELETE /api/projects/[id]/files/[fileId] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const db = await initDb()
    await db.execute({
      sql: `DELETE FROM project_files WHERE id = ? AND project_id = ?`,
      args: [params.fileId, params.id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
