import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb } from '@/lib/db'
import { PROTECTED_MASTER_EMAIL } from '@/lib/auth'
import type { PagePermission } from '@/lib/types'

function isMaster(req: NextRequest) {
  return req.headers.get('x-user-role') === 'master'
}

/** PUT /api/users/[id] — update user (master only) */
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isMaster(req)) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const body = await req.json() as {
    name?: string; role?: string
    allowed_pages?: Record<string, PagePermission>; active?: boolean
    new_password?: string
  }

  const db = await initDb()

  // Verifica se o usuário alvo é o master protegido
  const targetRes = await db.execute({ sql: `SELECT email FROM users WHERE id = ?`, args: [params.id] })
  const targetEmail = (targetRes.rows[0] as unknown as { email: string } | undefined)?.email
  const isProtected = targetEmail === PROTECTED_MASTER_EMAIL

  if (isProtected) {
    if (body.role !== undefined && body.role !== 'master') {
      return NextResponse.json({ error: 'Este usuário não pode ter o nível de acesso alterado.' }, { status: 403 })
    }
    if (body.active !== undefined && !body.active) {
      return NextResponse.json({ error: 'Este usuário não pode ser desativado.' }, { status: 403 })
    }
  }

  const clauses: string[] = []
  const args:    unknown[] = []

  if (body.name !== undefined) {
    clauses.push('name = ?'); args.push(body.name.trim())
  }
  if (body.role !== undefined && !isProtected) {
    clauses.push('role = ?'); args.push(body.role === 'master' ? 'master' : 'user')
  }
  if (body.allowed_pages !== undefined) {
    clauses.push('allowed_pages = ?'); args.push(JSON.stringify(body.allowed_pages))
  }
  if (body.active !== undefined && !isProtected) {
    clauses.push('active = ?'); args.push(body.active ? 1 : 0)
  }
  if (body.new_password) {
    const hash = await bcrypt.hash(body.new_password, 10)
    clauses.push('password_hash = ?'); args.push(hash)
  }

  if (clauses.length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  args.push(params.id)
  await db.execute({
    sql:  `UPDATE users SET ${clauses.join(', ')} WHERE id = ?`,
    args: args as (string | number | boolean | null)[],
  })

  const updated = await db.execute({
    sql:  `SELECT id, name, email, role, allowed_pages, active, created_at, last_login FROM users WHERE id = ?`,
    args: [params.id],
  })
  if (updated.rows.length === 0) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  const r = updated.rows[0] as unknown as Record<string, unknown>
  const rawPages = JSON.parse((r.allowed_pages as string) || '{}')
  return NextResponse.json({
    id:            r.id,
    name:          r.name,
    email:         r.email,
    role:          r.role,
    allowed_pages: Array.isArray(rawPages)
      ? Object.fromEntries(rawPages.map((s: string) => [s, 'editor']))
      : rawPages,
    active:        Boolean(r.active),
    created_at:    r.created_at,
    last_login:    r.last_login ?? undefined,
  })
}

/** DELETE /api/users/[id] — remove user (master only, cannot delete self) */
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  if (!isMaster(req)) return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })

  const selfId = req.headers.get('x-user-id')
  if (params.id === selfId) {
    return NextResponse.json({ error: 'Você não pode remover sua própria conta.' }, { status: 400 })
  }

  const db = await initDb()

  // Impede remoção do master protegido
  const chkRes = await db.execute({ sql: `SELECT email FROM users WHERE id = ?`, args: [params.id] })
  const chkEmail = (chkRes.rows[0] as unknown as { email: string } | undefined)?.email
  if (chkEmail === PROTECTED_MASTER_EMAIL) {
    return NextResponse.json({ error: 'Este usuário não pode ser removido.' }, { status: 403 })
  }

  await db.execute({ sql: `DELETE FROM users WHERE id = ?`, args: [params.id] })
  return NextResponse.json({ ok: true })
}
