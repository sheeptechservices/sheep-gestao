import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'

const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

// ── GET /api/team/[id]/photo — serve a foto como imagem ──────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  `SELECT photo_data FROM team_members WHERE id = ?`,
      args: [params.id],
    })
    const row = res.rows[0] as unknown as { photo_data: string | null } | undefined
    if (!row?.photo_data) return new NextResponse(null, { status: 404 })

    const buffer = Buffer.from(row.photo_data, 'base64')
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── POST /api/team/[id]/photo — faz upload da foto ───────────────────────────
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData()
    const file     = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Arquivo não enviado' }, { status: 400 })
    if (!file.type.startsWith('image/')) return NextResponse.json({ error: 'Somente imagens' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'Arquivo muito grande (máx 2 MB)' }, { status: 413 })

    const bytes  = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    const db = await initDb()
    await db.execute({
      sql:  `UPDATE team_members SET photo_data = ? WHERE id = ?`,
      args: [base64, params.id],
    })

    return NextResponse.json({ photo_url: `/api/team/${params.id}/photo` })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

// ── DELETE /api/team/[id]/photo — remove a foto ───────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    await db.execute({ sql: `UPDATE team_members SET photo_data = NULL WHERE id = ?`, args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
