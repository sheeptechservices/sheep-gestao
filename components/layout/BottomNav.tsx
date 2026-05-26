'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useQuickSearch } from '@/stores/quickSearchStore'
import { useAuth } from '@/stores/authStore'
import { PAGE_SLUGS } from '@/lib/auth'

const NAV = [
  {
    href: '/',
    label: 'Dashboard',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="2" width="5" height="5" rx="1"/>
        <rect x="9" y="2" width="5" height="5" rx="1"/>
        <rect x="2" y="9" width="5" height="5" rx="1"/>
        <rect x="9" y="9" width="5" height="5" rx="1"/>
      </svg>
    ),
  },
  {
    href: '/tasks',
    label: 'Gestão',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/>
        <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/>
        <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/>
        <path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/>
        <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/>
        <path d="M3.477 10.896a4 4 0 0 1 .585-.396"/>
        <path d="M19.938 10.5a4 4 0 0 1 .585.396"/>
        <path d="M6 18a4 4 0 0 1-1.967-.516"/>
        <path d="M19.967 17.484A4 4 0 0 1 18 18"/>
      </svg>
    ),
  },
  {
    href: '/projects',
    label: 'Projetos',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="2" y="3" width="12" height="10" rx="1.5"/>
        <path d="M5 3V2M11 3V2"/><line x1="2" y1="6.5" x2="14" y2="6.5"/>
      </svg>
    ),
  },
  {
    href: '/clients',
    label: 'Clientes',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="6" cy="5" r="2.5"/>
        <path d="M1 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
        <circle cx="12" cy="5.5" r="2"/><path d="M15 13c0-2.2-1.3-4-3-4.5"/>
      </svg>
    ),
  },
  {
    href: null, // search action
    label: 'Buscar',
    icon: (
      <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
        <circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M9.5 9.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
]

export function BottomNav() {
  const pathname   = usePathname()
  const { open: openSearch } = useQuickSearch()
  const authUser    = useAuth(s => s.user)
  const authLoading = useAuth(s => s.loading)

  if (pathname === '/login') return null

  // Filtra itens por permissão (mantém sempre o botão de busca que não tem href)
  // Enquanto authLoading=true renderiza só o botão de busca para evitar flash
  const visibleNav = NAV.filter(item => {
    if (!item.href) return true                        // busca — sempre visível
    if (authLoading) return false                      // aguarda identidade ser resolvida
    if (authUser?.role === 'master') return true
    const slug = PAGE_SLUGS[item.href]
    return slug ? (authUser?.allowed_pages ?? []).includes(slug) : true
  })

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      height: 64,
      background: 'var(--white)',
      borderTop: '1px solid var(--gray3)',
      display: 'flex',
      alignItems: 'stretch',
      zIndex: 400,
      paddingBottom: 'env(safe-area-inset-bottom)',
      boxShadow: '0 -2px 12px rgba(0,0,0,0.07)',
    }}>
      {visibleNav.map(item => {
        const active = item.href
          ? (item.href === '/' ? pathname === '/' : pathname === item.href || pathname.startsWith(item.href + '/'))
          : false

        if (!item.href) {
          return (
            <button
              key="search"
              onClick={openSearch}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--gray2)', padding: '6px 0',
              }}
            >
              <span style={{ color: 'var(--gray2)' }}>{item.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--gray2)' }}>{item.label}</span>
            </button>
          )
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              textDecoration: 'none', padding: '6px 0',
              color: active ? 'var(--primary-text)' : 'var(--gray2)',
              position: 'relative',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 24, height: 2.5, borderRadius: 2,
                background: 'var(--primary)',
              }} />
            )}
            <span style={{ color: active ? 'var(--primary-text)' : 'var(--gray2)' }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: 9, fontWeight: active ? 700 : 600,
              color: active ? 'var(--primary-text)' : 'var(--gray2)',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
