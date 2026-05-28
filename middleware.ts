import { NextRequest, NextResponse } from 'next/server'
import { verifyUserJwt, PAGE_SLUGS } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/webhooks/', '/api/integrations/linkedin/webhook']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some(p => pathname.startsWith(p)) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/logos')
  ) {
    return NextResponse.next()
  }

  const token = req.cookies.get('sheep_auth')?.value
  if (!token) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const payload = await verifyUserJwt(token)
  if (!payload || !payload.active) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    const res = NextResponse.redirect(loginUrl)
    res.cookies.set('sheep_auth', '', { maxAge: 0, path: '/' })
    return res
  }

  // Page-level access control for 'user' role
  if (payload.role === 'user') {
    // Find the base route slug (e.g. /projects/new → 'projects')
    const base = '/' + (pathname.split('/')[1] ?? '')
    const slug = PAGE_SLUGS[base] ?? PAGE_SLUGS[pathname]
    // /settings is always accessible — users can edit their own profile
    if (slug && slug !== 'settings' && !(slug in payload.pages)) {
      // API routes → 403 JSON
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
      }
      // UI routes → redirect to dashboard
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  // Pass user info to API routes via headers
  const res = NextResponse.next()
  res.headers.set('x-user-id',   payload.sub)
  res.headers.set('x-user-role', payload.role)
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
