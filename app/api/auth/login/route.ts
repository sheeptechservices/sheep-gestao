import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.text()
    console.log('[login] body recebido:', body)

    const { user, pass } = JSON.parse(body)

    const validUser = process.env.AUTH_USER ?? 'sheep'
    const validPass = process.env.AUTH_PASS ?? 'sheep2026'
    const secret    = process.env.AUTH_SECRET ?? 'sheep-gestao-secret'

    console.log('[login] tentativa:', user, '| válido:', user === validUser && pass === validPass)

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
  } catch (err) {
    console.error('[login] erro interno:', err)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
