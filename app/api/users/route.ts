import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb } from '@/lib/db'
import type { AppUser, PagePermission } from '@/lib/types'

function parsePages(raw: string): Record<string, PagePermission> {
  try {
    const parsed = JSON.parse(raw || '{}')
    // Backward-compat: old format was string[] — migrate to Record with 'editor'
    if (Array.isArray(parsed)) {
      return Object.fromEntries(parsed.map((s: string) => [s, 'editor' as PagePermission]))
    }
    return parsed as Record<string, PagePermission>
  } catch { return {} }
}

function rowToUser(r: Record<string, unknown>): AppUser {
  return {
    id:            r.id as string,
    name:          r.name as string,
    email:         r.email as string,
    role:          (r.role as string) as 'master' | 'user',
    allowed_pages: parsePages((r.allowed_pages as string) ?? ''),
    active:        Boolean(r.active),
    created_at:    r.created_at as string,
    last_login:    (r.last_login as string | null) ?? undefined,
  }
}

function isMaster(req: NextRequest) {
  return req.headers.get('x-user-role') === 'master'
}

/** GET /api/users — list all users (master only) */
export async function GET(req: NextRequest) {
  if (!isMaster(req)) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const db  = await initDb()
  const res = await db.execute({
    sql:  `SELECT id, name, email, role, allowed_pages, active, created_at, last_login
           FROM users ORDER BY created_at ASC`,
    args: [],
  })
  return NextResponse.json(res.rows.map(r => rowToUser(r as unknown as Record<string, unknown>)))
}

/** POST /api/users — create user (master only) */
export async function POST(req: NextRequest) {
  if (!isMaster(req)) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const body = await req.json() as {
    name?: string; email?: string; password?: string
    role?: string; allowed_pages?: Record<string, PagePermission>
  }

  if (!body.name || !body.email || !body.password) {
    return NextResponse.json({ error: 'Nome, e-mail e senha são obrigatórios.' }, { status: 400 })
  }

  const role  = body.role === 'master' ? 'master' : 'user'
  const pages = JSON.stringify(body.allowed_pages && !Array.isArray(body.allowed_pages) ? body.allowed_pages : {})
  const hash  = await bcrypt.hash(body.password, 10)
  const id    = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  const now   = new Date().toISOString()

  try {
    const db = await initDb()
    await db.execute({
      sql:  `INSERT INTO users (id, name, email, password_hash, role, allowed_pages, active, created_at)
             VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
      args: [id, body.name.trim(), body.email.toLowerCase().trim(), hash, role, pages, now],
    })
    const created = await db.execute({ sql: `SELECT id, name, email, role, allowed_pages, active, created_at, last_login FROM users WHERE id = ?`, args: [id] })
    return NextResponse.json(rowToUser(created.rows[0] as unknown as Record<string, unknown>), { status: 201 })
  } catch (err: unknown) {
    if (err instanceof Error && err.message?.includes('UNIQUE')) {
      return NextResponse.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Erro ao criar usuário.' }, { status: 500 })
  }
}
