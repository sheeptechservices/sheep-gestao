import { NextRequest, NextResponse } from 'next/server'
import { initDb } from '@/lib/db'
import type { Project, Client } from '@/lib/types'

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
  ORDER BY CASE WHEN p.display_order > 0 THEN p.display_order ELSE 999999 END ASC, p.created_at DESC
`

const SQL_SINGLE_PROJECT = `
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
  const client: Client | undefined = row.c_id
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

export { rowToProject }

export async function GET() {
  try {
    const db = await initDb()
    const res = await db.execute({ sql: SQL_WITH_CLIENT, args: [] })
    return NextResponse.json(res.rows.map(r => rowToProject(r as unknown as Record<string, unknown>)))
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Omit<Project, 'client'>
    if (!body.id || !body.name || !body.client_id) {
      return NextResponse.json({ error: 'id, name and client_id are required' }, { status: 400 })
    }
    const db = await initDb()
    await db.execute({
      sql: `
        INSERT INTO projects
          (id, client_id, name, description, status, type, color_hex,
           start_date, end_date, progress, created_at, gestor, observacoes, links, team_members, github_repo)
        VALUES
          (:id, :client_id, :name, :description, :status, :type, :color_hex,
           :start_date, :end_date, :progress, :created_at, :gestor, :observacoes, :links, :team_members, :github_repo)
      `,
      args: {
        description: null, end_date: null, gestor: null, observacoes: null, links: null, github_repo: null,
        ...body,
        progress: body.progress ?? 0,
        team_members: body.team_members?.length ? JSON.stringify(body.team_members) : null,
      },
    })
    const res = await db.execute({ sql: SQL_SINGLE_PROJECT, args: [body.id] })
    const row = res.rows[0] as unknown as Record<string, unknown>
    return NextResponse.json(rowToProject(row), { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
