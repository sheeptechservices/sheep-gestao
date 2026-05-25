import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

const MAX_SIZE = 3 * 1024 * 1024 // 3 MB

/** GET /api/lead-attachments?lead_id=xxx */
export async function GET(req: NextRequest) {
  const leadId = req.nextUrl.searchParams.get('lead_id')
  if (!leadId) return NextResponse.json({ error: 'lead_id obrigatório' }, { status: 400 })

  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  'SELECT id, lead_id, filename, url, size, mime_type, created_at FROM lead_attachments WHERE lead_id = ? ORDER BY created_at ASC',
      args: [leadId],
    })
    return NextResponse.json(res.rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** POST /api/lead-attachments — upload file (multipart/form-data) */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    const leadId   = formData.get('lead_id') as string | null

    if (!file)   return NextResponse.json({ error: 'Arquivo não enviado'   }, { status: 400 })
    if (!leadId) return NextResponse.json({ error: 'lead_id não informado' }, { status: 400 })

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: `Arquivo muito grande. Limite: ${MAX_SIZE / 1024 / 1024} MB` },
        { status: 413 },
      )
    }

    const bytes  = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const id  = `latt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()
    const url = `/api/lead-attachments/${id}/file`

    const db = await initDb()
    await db.execute({
      sql:  `INSERT INTO lead_attachments (id, lead_id, filename, url, size, mime_type, data, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, leadId, file.name, url, file.size, file.type || 'application/octet-stream', base64, now],
    })

    return NextResponse.json({
      id, lead_id: leadId, filename: file.name, url,
      size: file.size, mime_type: file.type || 'application/octet-stream', created_at: now,
    }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
