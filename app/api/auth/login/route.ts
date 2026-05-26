import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { initDb } from '@/lib/db'
import { signUserJwt } from '@/lib/auth'
import type { AppUser } from '@/lib/types'

// -- rate limiting (in-memory, resets on cold start) --
const WINDOW_MS = 15 * 60 * 1000
const MAX_TRIES = 10
const attempts  = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string): boolean {
  const now   = Date.now()
  const entry = attempts.get(ip)
  if (!entry || now > entry.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  entry.count++
  return entry.count <= MAX_TRIES
}

function rowToUser(r: Record<string, unknown>): AppUser {
  return {
    id:            r.id as string,
    name:          r.name as string,
    email:         r.email as string,
    role:          (r.role as string) as 'master' | 'user',
    allowed_pages: JSON.parse((r.allowed_pages as string) || '[]') as string[],
    active:        Boolean(r.active),
    created_at:    r.created_at as string,
    last_login:    (r.last_login as string | null) ?? undefined,
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429 }
      )
    }

    const body = await req.json() as { email?: string; password?: string }
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'E-mail e senha são obrigatórios.' }, { status: 400 })
    }

    const db = await initDb()

    const res = await db.execute({
      sql:  `SELECT id, name, email, password_hash, role, allowed_pages, active, created_at, last_login
             FROM users WHERE email = ? LIMIT 1`,
      args: [email.toLowerCase().trim()],
    })

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    const row  = res.rows[0] as unknown as Record<string, unknown>
    const user = rowToUser(row)

    if (!user.active) {
      return NextResponse.json({ error: 'Sua conta está desativada. Contate o administrador.' }, { status: 403 })
    }

    const passwordOk = await bcrypt.compare(password, row.password_hash as string)
    if (!passwordOk) {
      return NextResponse.json({ error: 'E-mail ou senha incorretos.' }, { status: 401 })
    }

    // Update last_login
    await db.execute({
      sql:  `UPDATE users SET last_login = ? WHERE id = ?`,
      args: [new Date().toISOString(), user.id],
    })

    const token = await signUserJwt(user)

    const response = NextResponse.json({ user })
    response.cookies.set('sheep_auth', token, {
      httpOnly: true,
      sameSite: 'lax',
      path:     '/',
      maxAge:   60 * 60 * 24 * 30,
    })
    return response
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
