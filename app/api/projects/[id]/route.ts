import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Project } from '@/lib/types'

const SQL_WITH_CLIENT = `
  SELECT
    p.*,
    c.id            AS c_id,
    c.name          AS c_name,
    c.logo_url      AS c_logo_url,
    c.contact_name  AS c_contact_name,
    c.contact_email AS c_contact_email,
    c.created_at    AS c_created_at,
    c.color_hex     AS c_color_hex
  FROM projects p
  LEFT JOIN clients c ON c.id = p.client_id
  WHERE p.id = ?
`

function rowToProject(row: Record<string, unknown>): Project {
  const client = row.c_id
    ? {
        id: row.c_id as string,
        name: row.c_name as string,
        logo_url: row.c_logo_url as string | undefined,
        contact_name: row.c_contact_name as string | undefined,
        contact_email: row.c_contact_email as string | undefined,
        created_at: row.c_created_at as string,
        color_hex: row.c_color_hex as string | undefined,
      }
    : undefined

  return {
    id: row.id as string,
    client_id: row.client_id as string,
    client,
    name: row.name as string,
    description: row.description as string | undefined,
    status: row.status as Project['status'],
    type: row.type as Project['type'],
    color_hex: row.color_hex as string,
    start_date: row.start_date as string,
    end_date: row.end_date as string | undefined,
    progress: row.progress as number,
    created_at: row.created_at as string,
    gestor: row.gestor as string | undefined,
    observacoes: row.observacoes as string | undefined,
    links: row.links as string | undefined,
    team_members: row.team_members ? JSON.parse(row.team_members as string) : undefined,
    display_order: row.display_order as number | undefined,
    github_repo: row.github_repo as string | undefined,
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json() as Partial<Project>
    const db = await initDb()
    await db.execute({
      sql: `
        UPDATE projects SET
          client_id = :client_id, name = :name, description = :description,
          status = :status, type = :type, color_hex = :color_hex,
          start_date = :start_date, end_date = :end_date, progress = :progress,
          gestor = :gestor, observacoes = :observacoes, links = :links,
          team_members = :team_members, display_order = :display_order,
          github_repo = :github_repo
        WHERE id = :id
      `,
      args: {
        description: null, end_date: null, gestor: null, observacoes: null, links: null, display_order: 0, github_repo: null,
        ...body,
        id: params.id,
        team_members: (body.team_members as string[] | undefined)?.length
          ? JSON.stringify(body.team_members)
          : null,
      },
    })
    const res = await db.execute({ sql: SQL_WITH_CLIENT, args: [params.id] })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToProject(row))
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
    await db.execute({ sql: 'DELETE FROM projects WHERE id = ?', args: [params.id] })
    return NextResponse.json({ ok: true })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
