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

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<TeamMember>
    const db   = await initDb()

    const allowed = ['name', 'cargo', 'email', 'joined_at', 'status', 'color_hex'] as const
    const updates = allowed.filter(k => k in body)
    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 })

    const payload: Record<string, unknown> = { id: params.id }
    for (const k of updates) payload[k] = (body as Record<string, unknown>)[k] ?? null

    const setClauses = updates.map(k => `${k} = :${k}`).join(', ')
    await db.execute({ sql: `UPDATE team_members SET ${setClauses} WHERE id = :id`, args: payload })

    const res = await db.execute({
      sql:  `SELECT id, name, cargo, email, joined_at, status, color_hex, created_at,
               CASE WHEN photo_data IS NOT NULL THEN 1 ELSE 0 END AS has_photo
             FROM team_members WHERE id = ?`,
      args: [params.id],
    })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToMember({ ...row, photo_data: row.has_photo ? '1' : null }))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const db = await initDb()
    // Disassociate tasks before deleting
    await db.execute({ sql: `UPDATE tasks SET member_id = NULL WHERE member_id = ?`, args: [params.id] })
    await db.execute({ sql: `DELETE FROM team_members WHERE id = ?`, args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
