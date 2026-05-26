import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { verifyUserJwt, signUserJwt } from '@/lib/auth'
import { initDb } from '@/lib/db'
import type { AppUser } from '@/lib/types'

export async function GET(req: NextRequest) {
  const token = req.cookies.get('sheep_auth')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = await verifyUserJwt(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  return NextResponse.json({
    id:            payload.sub,
    name:          payload.name,
    email:         payload.email,
    role:          payload.role,
    allowed_pages: payload.pages,
    active:        payload.active,
  })
}

/** PUT /api/auth/me — usuário atualiza seu próprio nome e/ou senha */
export async function PUT(req: NextRequest) {
  const token = req.cookies.get('sheep_auth')?.value
  if (!token) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const payload = await verifyUserJwt(token)
  if (!payload) return NextResponse.json({ error: 'Token inválido' }, { status: 401 })

  const body = await req.json() as { name?: string; new_password?: string }

  const clauses: string[] = []
  const args: unknown[]   = []

  if (body.name?.trim()) {
    clauses.push('name = ?'); args.push(body.name.trim())
  }
  if (body.new_password) {
    if (body.new_password.length < 6) {
      return NextResponse.json({ error: 'A senha deve ter pelo menos 6 caracteres.' }, { status: 400 })
    }
    const hash = await bcrypt.hash(body.new_password, 10)
    clauses.push('password_hash = ?'); args.push(hash)
  }

  if (clauses.length === 0) {
    return NextResponse.json({ error: 'Nada para atualizar.' }, { status: 400 })
  }

  const db = await initDb()
  args.push(payload.sub)
  await db.execute({
    sql:  `UPDATE users SET ${clauses.join(', ')} WHERE id = ?`,
    args: args as (string | number | null)[],
  })

  // Busca o registro atualizado para reeditar o JWT
  const row = await db.execute({
    sql:  `SELECT id, name, email, role, allowed_pages, active FROM users WHERE id = ?`,
    args: [payload.sub],
  })
  if (row.rows.length === 0) return NextResponse.json({ error: 'Usuário não encontrado.' }, { status: 404 })

  const r = row.rows[0] as unknown as Record<string, unknown>
  const updatedUser: AppUser = {
    id:            r.id as string,
    name:          r.name as string,
    email:         r.email as string,
    role:          r.role as 'master' | 'user',
    allowed_pages: JSON.parse((r.allowed_pages as string) || '[]'),
    active:        Boolean(r.active),
    created_at:    '',
  }

  // Re-emite o JWT com o nome atualizado e renova o cookie
  const newToken = await signUserJwt(updatedUser)
  const res = NextResponse.json(updatedUser)
  res.cookies.set('sheep_auth', newToken, {
    httpOnly: true, sameSite: 'lax', path: '/',
    maxAge: 60 * 60 * 24 * 30,
    secure: process.env.NODE_ENV === 'production',
  })
  return res
}
