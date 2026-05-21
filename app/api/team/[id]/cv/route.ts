import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

const MAX_SIZE   = 5 * 1024 * 1024  // 5 MB
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_EXTS = ['.pdf', '.doc', '.docx']

// ── GET /api/team/[id]/cv — serve o currículo ────────────────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  `SELECT curriculo_data, curriculo_mime, curriculo_filename FROM team_members WHERE id = ?`,
      args: [params.id],
    })
    const row = res.rows[0] as unknown as {
      curriculo_data: string | null
      curriculo_mime: string | null
      curriculo_filename: string | null
    } | undefined

    if (!row?.curriculo_data) return new NextResponse(null, { status: 404 })

    const buffer   = Buffer.from(row.curriculo_data, 'base64')
    const mime     = row.curriculo_mime ?? 'application/octet-stream'
    const filename = row.curriculo_filename ?? 'curriculo'
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': mime,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST /api/team/[id]/cv — upload do currículo ─────────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })

    const ext = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!ALLOWED_TYPES.includes(file.type) && !ALLOWED_EXTS.includes(ext)) {
      return NextResponse.json({ error: 'Somente PDF, DOC ou DOCX' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Arquivo muito grande (máx 5 MB)' }, { status: 413 })
    }

    const bytes  = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const db = await initDb()
    // Ensure columns exist (first-time guard)
    for (const sql of [
      `ALTER TABLE team_members ADD COLUMN curriculo_mime     TEXT`,
      `ALTER TABLE team_members ADD COLUMN curriculo_filename TEXT`,
    ]) {
      try { await db.execute(sql) } catch { /* already exists */ }
    }

    await db.execute({
      sql:  `UPDATE team_members SET curriculo_data = ?, curriculo_mime = ?, curriculo_filename = ? WHERE id = ?`,
      args: [base64, file.type || 'application/octet-stream', file.name, params.id],
    })

    return NextResponse.json({ curriculo_url: `/api/team/${params.id}/cv` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── DELETE /api/team/[id]/cv — remove o currículo ────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    await db.execute({
      sql:  `UPDATE team_members SET curriculo_data = NULL, curriculo_mime = NULL, curriculo_filename = NULL WHERE id = ?`,
      args: [params.id],
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
