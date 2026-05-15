import { NextRequest, NextResponse } from 'next/server'
import { del } from '@vercel/blob'
import { initDb } from '@/lib/db'

// ── DELETE /api/attachments/[id] ─────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  'SELECT url FROM task_attachments WHERE id = ?',
      args: [params.id],
    })
    const row = res.rows[0] as unknown as { url: string } | undefined
    if (!row) return NextResponse.json({ error: 'Anexo não encontrado' }, { status: 404 })

    // Remove do Vercel Blob (ignora erro se o arquivo já foi deletado)
    await del(row.url).catch(() => {})

    await db.execute({ sql: 'DELETE FROM task_attachments WHERE id = ?', args: [params.id] })

    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
