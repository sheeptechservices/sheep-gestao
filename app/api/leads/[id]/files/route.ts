import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import { randomUUID } from 'crypto'

/** GET /api/leads/[id]/files — lista arquivos do lead */
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    const res = await db.execute({
      sql: `SELECT id, lead_id, filename, mime_type, size, text_content, created_at
            FROM lead_files
            WHERE lead_id = ?
            ORDER BY created_at DESC`,
      args: [params.id],
    })
    return NextResponse.json(res.rows)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

/** POST /api/leads/[id]/files — salva ata/arquivo na base de conhecimento do lead */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as {
      filename: string
      mime_type: string
      size: number
      text_content: string
    }
    const db  = await initDb()
    const id  = randomUUID()
    const now = new Date().toISOString()
    await db.execute({
      sql: `INSERT INTO lead_files (id, lead_id, filename, mime_type, size, text_content, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [id, params.id, body.filename, body.mime_type ?? '', body.size ?? 0, body.text_content ?? '', now],
    })
    return NextResponse.json({
      id, lead_id: params.id,
      filename: body.filename, mime_type: body.mime_type,
      size: body.size, created_at: now,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
