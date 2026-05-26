import { NextRequest, NextResponse } from 'next/server'
import { verifyUserJwt } from '@/lib/auth'

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
