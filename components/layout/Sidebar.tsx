'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/stores/sidebarStore'

const navItems = [
  {
    section: 'Principal',
    items: [
      {
        href: '/',
        label: 'Dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="2" width="5" height="5" rx="1"/><rect x="9" y="2" width="5" height="5" rx="1"/><rect x="2" y="9" width="5" height="5" rx="1"/><rect x="9" y="9" width="5" height="5" rx="1"/></svg>,
      },
      {
        href: '/tasks',
        label: 'Gestão',
        icon: (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <rect x="1" y="3" width="2.2" height="10" rx="1"/>
            <rect x="4.7" y="3" width="2.2" height="10" rx="1"/>
            <rect x="8.4" y="3" width="2.2" height="10" rx="1"/>
            <rect x="12.1" y="3" width="2.2" height="10" rx="1"/>
          </svg>
        ),
      },
      {
        href: '/documentos',
        label: 'Gerador',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 2H4a1.5 1.5 0 0 0-1.5 1.5v9A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5V6.5L9 2Z"/><path d="M9 2v4.5H13.5"/><path d="M5.5 9.5h5M5.5 11.5h3"/></svg>,
      },
    ],
  },
  {
    section: 'Cadastros',
    items: [
      {
        href: '/projects',
        label: 'Projetos',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="12" height="10" rx="1.5"/><path d="M5 3V2M11 3V2"/><line x1="2" y1="6.5" x2="14" y2="6.5"/></svg>,
      },
      {
        href: '/clients',
        label: 'Clientes',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="6" cy="5" r="2.5"/><path d="M1 13c0-2.8 2.2-5 5-5s5 2.2 5 5"/><circle cx="12" cy="5.5" r="2"/><path d="M15 13c0-2.2-1.3-4-3-4.5"/></svg>,
      },
      {
        href: '/specialists',
        label: 'Especialistas',
        icon: <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h12M2 12l1.8-6 3.2 3 2.2-4.5L11.4 9l3.2-3L13 12"/><circle cx="8" cy="4.2" r="0.9" fill="currentColor" stroke="none"/><circle cx="3.3" cy="7" r="0.75" fill="currentColor" stroke="none"/><circle cx="12.7" cy="7" r="0.75" fill="currentColor" stroke="none"/></svg>,
      },
    ],
  },
  {
    section: 'Sistema',
    items: [
      {
        href: '/settings',
        label: 'Configurações',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>,
      },
    ],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { open, pinned, setOpen } = useSidebar()

  return (
    <aside style={{
      background: 'var(--white)',
      borderRight: '1px solid var(--gray3)',
      padding: '20px 0',
      display: 'flex',
      flexDirection: 'column',
      overflowX: 'hidden',
      overflowY: pinned && !open ? 'hidden' : 'auto',
      width: 220,
      visibility: pinned && !open ? 'hidden' : 'visible',
      ...(pinned ? {} : {
        position: 'fixed',
        left: 0,
        top: 60,
        height: 'calc(100vh - 60px)',
        zIndex: 300,
        boxShadow: '4px 0 20px rgba(0,0,0,0.12)',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
      }),
    }}>
      {navItems.map((group) => (
        <div key={group.section}>
          <div style={{
            fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
            letterSpacing: '0.12em', color: 'var(--gray2)',
            padding: '0 20px', margin: '16px 0 6px',
          }}>
            {group.section}
          </div>
          {group.items.map(item => {
            const active = item.href === '/'
              ? pathname === '/'
              : pathname === item.href || pathname.startsWith(item.href + '/')

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => { if (!pinned) setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 20px', fontSize: 13, fontWeight: 600,
                  color: active ? 'var(--black)' : 'var(--gray)',
                  textDecoration: 'none', cursor: 'pointer',
                  borderLeft: `2px solid ${active ? 'var(--primary)' : 'transparent'}`,
                  background: active ? 'var(--primary-dim)' : 'transparent',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--black)'
                    e.currentTarget.style.background = 'var(--bg)'
                  }
                }}
                onMouseLeave={e => {
                  if (!active) {
                    e.currentTarget.style.color = 'var(--gray)'
                    e.currentTarget.style.background = 'transparent'
                  }
                }}
              >
                <span style={{ flexShrink: 0, color: active ? 'var(--black)' : 'var(--gray)' }}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            )
          })}
        </div>
      ))}

    </aside>
  )
}
