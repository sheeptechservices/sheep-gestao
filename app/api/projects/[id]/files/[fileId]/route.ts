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

/** PATCH /api/projects/[id]/files/[fileId] — rename */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const { filename } = await req.json() as { filename: string }
    if (!filename?.trim()) {
      return NextResponse.json({ error: 'filename obrigatório' }, { status: 400 })
    }
    const db = await initDb()
    await db.execute({
      sql: `UPDATE project_files SET filename = ? WHERE id = ? AND project_id = ?`,
      args: [filename.trim(), params.fileId, params.id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
