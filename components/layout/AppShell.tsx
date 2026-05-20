'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/stores/sidebarStore'
import { useQuickSearch } from '@/stores/quickSearchStore'
import { useSettings, matchesHotkey } from '@/stores/settingsStore'
import { useAgentsStore } from '@/stores/agentsStore'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ThemeProvider } from './ThemeProvider'
import { FloatingAgents } from './FloatingAgents'
import { ChatPanels } from '@/components/chat/ChatPanel'
import { ToastContainer } from '@/components/ui/ToastContainer'
import { QuickSearch } from '@/components/ui/QuickSearch'

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { open, pinned, setOpen } = useSidebar()
  const { toggle } = useQuickSearch()
  const { quickSearchHotkey } = useSettings()
  const { isMobile, isTablet } = useBreakpoint()
  const fetchAgents = useAgentsStore(s => s.fetchAgents)

  // Carrega especialistas do banco uma única vez ao montar o shell
  useEffect(() => { fetchAgents() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sidebar occupies a grid column on desktop when pinned (open state only controls width via CSS)
  const inGrid = !isMobile && !isTablet && pinned

  // Auto-close sidebar when resizing to mobile
  useEffect(() => {
    if (isMobile && open && pinned) setOpen(false)
  }, [isMobile]) // eslint-disable-line react-hooks/exhaustive-deps

  // Global quick search hotkey
  useEffect(() => {
    if (pathname === '/login') return
    function handler(e: KeyboardEvent) {
      if (matchesHotkey(e, quickSearchHotkey)) {
        e.preventDefault()
        toggle()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [toggle, quickSearchHotkey, pathname])

  // Rotas públicas
  if (pathname === '/login') {
    return <>{children}</>
  }

  const mainPadding = isMobile ? '20px 16px' : isTablet ? '24px 24px' : '32px 36px'
  const mainPaddingBottom = isMobile ? '96px' : isTablet ? '24px' : '32px'

  return (
    <>
      <ThemeProvider />

      {isMobile ? (
        /* ── Mobile: flex column, sidebar always overlay ── */
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <Topbar />

          {open && (
            <div
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 290,
                background: 'rgba(18,19,22,0.35)',
                animation: 'fadeIn .2s ease both',
              }}
            />
          )}

          <Sidebar />

          <main style={{
            flex: 1,
            width: '100%',
            padding: mainPadding,
            paddingBottom: mainPaddingBottom,
            overflowY: 'auto',
            background: 'var(--bg)',
          }}>
            {children}
          </main>
        </div>
      ) : (
        /* ── Tablet / Desktop: CSS Grid — column width animates 0↔220px ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: inGrid ? (open ? '220px 1fr' : '0px 1fr') : '1fr',
          gridTemplateRows: '60px 1fr',
          height: '100vh',
          overflow: 'hidden',
          transition: 'grid-template-columns 0.28s cubic-bezier(0.4,0,0.2,1)',
        }}>
          <Topbar />

          {/* Overlay backdrop for non-pinned overlay sidebar */}
          {open && !pinned && (
            <div
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0, zIndex: 290,
                background: 'rgba(18,19,22,0.35)',
                animation: 'fadeIn .2s ease both',
              }}
            />
          )}

          <Sidebar />

          <main style={{
            padding: mainPadding,
            paddingBottom: mainPaddingBottom,
            overflowY: 'auto',
            background: 'var(--bg)',
            minHeight: 0,
          }}>
            {children}
          </main>
        </div>
      )}

      {isMobile && <BottomNav />}
      <FloatingAgents />
      <ChatPanels />
      <ToastContainer />
      <QuickSearch />
    </>
  )
}
