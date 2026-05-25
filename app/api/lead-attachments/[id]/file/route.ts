import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

/** GET /api/lead-attachments/[id]/file — serve the file (inline preview or download) */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  'SELECT filename, mime_type, data FROM lead_attachments WHERE id = ?',
      args: [params.id],
    })
    const row = res.rows[0] as { filename: string; mime_type: string; data: string } | undefined
    if (!row) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })

    const bytes     = Buffer.from(row.data, 'base64')
    const isPreview = req.nextUrl.searchParams.has('preview')

    return new NextResponse(bytes, {
      headers: {
        'Content-Type':        row.mime_type,
        'Content-Disposition': isPreview
          ? `inline; filename="${row.filename}"`
          : `attachment; filename="${row.filename}"`,
        'Cache-Control':       'private, max-age=300',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
