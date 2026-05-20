import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

// ── GET /api/attachments/[id]/file — faz o download do arquivo ───────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const preview = req.nextUrl.searchParams.get('preview') === '1'

    const db  = await initDb()
    const res = await db.execute({
      sql:  'SELECT filename, mime_type, data FROM task_attachments WHERE id = ?',
      args: [params.id],
    })

    const row = res.rows[0] as unknown as { filename: string; mime_type: string; data: string } | undefined
    if (!row || !row.data) {
      return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 })
    }

    const buffer = Buffer.from(row.data, 'base64')
    const disposition = preview
      ? `inline; filename="${encodeURIComponent(row.filename)}"`
      : `attachment; filename="${encodeURIComponent(row.filename)}"`

    return new Response(buffer, {
      headers: {
        'Content-Type':        row.mime_type || 'application/octet-stream',
        'Content-Disposition': disposition,
        'Content-Length':      String(buffer.length),
        'Cache-Control':       'private, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
