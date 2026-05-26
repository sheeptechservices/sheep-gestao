import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

/** DELETE /api/leads/[id]/files/[fileId] */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    const db = await initDb()
    await db.execute({
      sql: `DELETE FROM lead_files WHERE id = ? AND lead_id = ?`,
      args: [params.fileId, params.id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** PATCH /api/leads/[id]/files/[fileId] — renomear */
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
      sql: `UPDATE lead_files SET filename = ? WHERE id = ? AND lead_id = ?`,
      args: [filename.trim(), params.fileId, params.id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
