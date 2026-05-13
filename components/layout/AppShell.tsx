'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/stores/sidebarStore'
import { useQuickSearch } from '@/stores/quickSearchStore'
import { useSettings, matchesHotkey } from '@/stores/settingsStore'
import { Topbar } from './Topbar'
import { Sidebar } from './Sidebar'
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
  const inGrid = open && pinned

  // Global quick search hotkey (configurable in Settings)
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

  // Rotas públicas — renderiza só o children, sem shell
  if (pathname === '/login') {
    return <>{children}</>
  }

  return (
    <>
      <ThemeProvider />
      <div style={{
        display: 'grid',
        gridTemplateColumns: inGrid ? '220px 1fr' : '0px 1fr',
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
              background: 'rgba(18,19,22,0.25)',
              animation: 'fadeIn .2s ease both',
            }}
          />
        )}

        <Sidebar />

        <main style={{
          padding: '32px 36px',
          overflowY: 'auto',
          background: 'var(--bg)',
          minHeight: 0,
        }}>
          {children}
        </main>
      </div>

      <FloatingAgents />
      <ChatPanels />
      <ToastContainer />
      <QuickSearch />
    </>
  )
}
