import { NextRequest, NextResponse } from 'next/server'

// -- rate limiting (in-memory, resets on cold start) --
const WINDOW_MS = 15 * 60 * 1000  // 15 minutos
const MAX_TRIES = 5
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

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown'
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Muitas tentativas. Tente novamente em 15 minutos.' },
        { status: 429 }
      )
    }

    const { user, pass } = JSON.parse(await req.text())

    const validUser = process.env.AUTH_USER
    const validPass = process.env.AUTH_PASS
    const secret    = process.env.AUTH_SECRET
    if (!validUser || !validPass || !secret) {
      return NextResponse.json(
        { error: 'Configuração de autenticação incompleta.' },
        { status: 500 }
      )
    }

    if (user !== validUser || pass !== validPass) {
      return NextResponse.json({ error: 'Usuário ou senha incorretos.' }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })
    res.cookies.set('sheep_auth', secret, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
