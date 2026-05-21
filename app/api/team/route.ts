import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { TeamMember } from '@/lib/types'

function rowToMember(row: Record<string, unknown>): TeamMember {
  return {
    id:        row.id        as string,
    name:      row.name      as string,
    cargo:     (row.cargo    as string) ?? '',
    email:     row.email     as string | undefined,
    photo_url: row.photo_data ? `/api/team/${row.id}/photo` : undefined,
    joined_at: row.joined_at as string | undefined,
    status:    (row.status   as TeamMember['status']) ?? 'active',
    color_hex: (row.color_hex as string) ?? '#84CC16',
    created_at: row.created_at as string,
  }
}

export async function GET() {
  try {
    const db  = await initDb()
    const res = await db.execute({
      sql:  `SELECT id, name, cargo, email, joined_at, status, color_hex, created_at,
               CASE WHEN photo_data IS NOT NULL THEN 1 ELSE 0 END AS has_photo
             FROM team_members ORDER BY name ASC`,
      args: [],
    })
    // map has_photo flag so rowToMember can build photo_url
    const members = res.rows.map(r => {
      const row = r as unknown as Record<string, unknown>
      return rowToMember({ ...row, photo_data: row.has_photo ? '1' : null })
    })
    return NextResponse.json(members)
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Partial<TeamMember>
    if (!body.name) return NextResponse.json({ error: 'name obrigatório' }, { status: 400 })

    const id  = `mbr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const now = new Date().toISOString()
    const db  = await initDb()

    await db.execute({
      sql:  `INSERT INTO team_members (id, name, cargo, email, joined_at, status, color_hex, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [id, body.name, body.cargo ?? '', body.email ?? null, body.joined_at ?? null,
             body.status ?? 'active', body.color_hex ?? '#84CC16', now],
    })

    const res = await db.execute({
      sql:  `SELECT id, name, cargo, email, joined_at, status, color_hex, created_at FROM team_members WHERE id = ?`,
      args: [id],
    })
    const member = rowToMember({ ...(res.rows[0] as unknown as Record<string, unknown>), photo_data: null })
    return NextResponse.json(member, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
