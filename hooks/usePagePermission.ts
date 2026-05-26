'use client'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/stores/authStore'
import { PAGE_SLUGS } from '@/lib/auth'
import type { PagePermission } from '@/lib/types'

/**
 * Returns the current user's permission level for the active page.
 *
 * - `'master'`  → usuário master (acesso total)
 * - `'editor'`  → user com permissão de edição
 * - `'viewer'`  → user somente leitura
 * - `null`      → sem acesso (não deveria acontecer se middleware estiver ativo)
 */
export function usePagePermission(): 'master' | PagePermission | null {
  const pathname = usePathname()
  const authUser = useAuth(s => s.user)

  if (!authUser) return null
  if (authUser.role === 'master') return 'master'

  const base = '/' + (pathname.split('/')[1] ?? '')
  const slug = PAGE_SLUGS[base] ?? PAGE_SLUGS[pathname]
  if (!slug) return 'editor'   // rota sem slug mapeado — assume editor

  return authUser.allowed_pages[slug] ?? null
}
