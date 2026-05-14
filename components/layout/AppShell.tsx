'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/stores/sidebarStore'
import { useQuickSearch } from '@/stores/quickSearchStore'
import { useSettings, matchesHotkey } from '@/stores/settingsStore'
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

  // On mobile/tablet: sidebar is always overlay (never in grid)
  const inGrid = !isMobile && !isTablet && open && pinned

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
        /* ── Tablet / Desktop: CSS Grid with optional sidebar column ── */
        <div style={{
          display: 'grid',
          gridTemplateColumns: inGrid ? '220px 1fr' : '1fr',
          gridTemplateRows: '60px 1fr',
          minHeight: '100vh',
          transition: 'grid-template-columns 0.25s ease',
        }}>
          <Topbar />

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
