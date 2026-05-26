import { SignJWT, jwtVerify } from 'jose'
import type { AppUser, PagePermission } from './types'
export type { PagePermission }

/** E-mail do master protegido — nunca pode ter role ou active alterados */
export const PROTECTED_MASTER_EMAIL = 'gestao.master@sheeptechnology.com.br'

export interface JwtPayload {
  sub: string          // user id
  name: string
  email: string
  role: 'master' | 'user'
  pages: Record<string, PagePermission>   // { slug: 'viewer' | 'editor' }
  active: boolean
  iat?: number
  exp?: number
}

function getSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret) throw new Error('AUTH_SECRET is not set')
  return new TextEncoder().encode(secret)
}

export async function signUserJwt(user: AppUser): Promise<string> {
  const payload: Omit<JwtPayload, 'iat' | 'exp'> = {
    sub:    user.id,
    name:   user.name,
    email:  user.email,
    role:   user.role,
    pages:  user.allowed_pages,
    active: user.active,
  }
  return new SignJWT(payload as Parameters<typeof SignJWT>[0])
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(getSecret())
}

export async function verifyUserJwt(token: string): Promise<JwtPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload as unknown as JwtPayload
  } catch {
    return null
  }
}

/** Slug map used by middleware and UI */
export const PAGE_SLUGS: Record<string, string> = {
  '/':              'dashboard',
  '/projects':      'projects',
  '/tasks':         'tasks',
  '/clients':       'clients',
  '/team':          'team',
  '/specialists':   'specialists',
  '/integrations':  'integrations',
  '/documentos':    'documentos',
  '/settings':      'settings',
}

export const ALL_PAGES = [
  { slug: 'dashboard',     label: 'Dashboard',      href: '/' },
  { slug: 'tasks',         label: 'Gestão',          href: '/tasks' },
  { slug: 'projects',      label: 'Projetos',        href: '/projects' },
  { slug: 'clients',       label: 'Clientes',        href: '/clients' },
  { slug: 'team',          label: 'Equipe',          href: '/team' },
  { slug: 'specialists',   label: 'Especialistas',   href: '/specialists' },
  { slug: 'documentos',    label: 'Gerador de Docs', href: '/documentos' },
  { slug: 'integrations',  label: 'Integrações',     href: '/integrations' },
  { slug: 'settings',      label: 'Configurações',   href: '/settings' },
]
