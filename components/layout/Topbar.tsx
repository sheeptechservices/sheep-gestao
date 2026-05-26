'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import { initials } from '@/lib/utils'
import { useSidebar } from '@/stores/sidebarStore'
import { useSettings, hotkeyLabel } from '@/stores/settingsStore'
import type { ColorMode } from '@/stores/settingsStore'
import { useQuickSearch } from '@/stores/quickSearchStore'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { NotificationBell } from '@/components/ui/NotificationBell'
import { useAuth } from '@/stores/authStore'

export function Topbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [themeAnim, setThemeAnim] = useState<'idle' | 'out' | 'in'>('idle')
  const { toggle } = useSidebar()
  const authUser = useAuth(s => s.user)
  const userName = authUser?.name ?? 'Carregando…'
  const router = useRouter()
  const { title, description, quickSearchHotkey, colorMode, toggleColorMode } = useSettings()
  const { open: openSearch } = useQuickSearch()
  const { isMobile } = useBreakpoint()

  useEffect(() => { setMounted(true) }, [])

  return (
    <header style={{
      gridColumn: '1 / -1',
      background: 'var(--white)',
      borderBottom: '1px solid var(--gray3)',
      padding: isMobile ? '0 16px' : '0 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky',
      top: 0,
      zIndex: 300,
      height: 60,
    }}>
      {/* Left — Sidebar toggle + Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={toggle}
          title="Alternar sidebar"
          style={{
            width: 30, height: 30, borderRadius: 8, border: 'none', cursor: 'pointer',
            background: 'transparent', color: 'var(--gray2)', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'background .15s, color .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
        >
          <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
            <line x1="2" y1="4" x2="14" y2="4"/>
            <line x1="2" y1="8" x2="14" y2="8"/>
            <line x1="2" y1="12" x2="14" y2="12"/>
          </svg>
        </button>

        <div style={{
          width: 28, height: 28, background: 'var(--primary)', borderRadius: 6,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, color: 'var(--primary-contrast)',
          flexShrink: 0,
        }}>
          {title.charAt(0).toUpperCase()}
        </div>

        {/* Brand text — hidden on mobile */}
        {!isMobile && (
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--black)' }}>{title}</div>
            <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, lineHeight: 1 }}>{description}</div>
          </div>
        )}
      </div>

      {/* Center — Quick search bar (desktop/tablet only) */}
      {!isMobile && (
        <button
          onClick={openSearch}
          style={{
            position: 'absolute', left: '50%', transform: 'translateX(-50%)',
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '7px 14px', borderRadius: 10,
            border: '1px solid var(--gray3)', background: 'var(--bg)',
            cursor: 'pointer', transition: 'all 0.15s',
            minWidth: 220,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.background = 'var(--primary-dim)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.background = 'var(--bg)' }}
        >
          <svg width={13} height={13} viewBox="0 0 13 13" fill="none" style={{ color: 'var(--gray2)', flexShrink: 0 }}>
            <circle cx="5.5" cy="5.5" r="3.8" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M8.2 8.2l2.6 2.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <span style={{ flex: 1, fontSize: 12, color: 'var(--gray2)', fontWeight: 500, textAlign: 'left' }}>
            Pesquisa rápida
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
            {hotkeyLabel(quickSearchHotkey).split('+').map((part, i, arr) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
                <kbd style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 4, padding: '1px 5px', fontFamily: 'inherit' }}>
                  {part}
                </kbd>
                {i < arr.length - 1 && <span style={{ fontSize: 9, color: 'var(--gray2)' }}>+</span>}
              </span>
            ))}
          </span>
        </button>
      )}

      {/* Right — Search icon (mobile) + Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 6 : 12 }}>
        {/* Search icon — mobile only */}
        {isMobile && (
          <button
            onClick={openSearch}
            title="Buscar"
            style={{
              width: 34, height: 34, borderRadius: 8, border: 'none',
              background: 'transparent', color: 'var(--gray2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', flexShrink: 0,
            }}
          >
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="4.2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9.5 9.5l3.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        )}

        {/* Notification bell */}
        <NotificationBell />

        {/* Light / Dark toggle */}
        <button
          onClick={() => {
            if (themeAnim !== 'idle') return
            setThemeAnim('out')
            setTimeout(() => {
              toggleColorMode()
              setThemeAnim('in')
              setTimeout(() => setThemeAnim('idle'), 220)
            }, 160)
          }}
          title={colorMode === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
          style={{
            width: 34, height: 34, borderRadius: 8, border: 'none',
            background: 'transparent', color: 'var(--gray2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
            transition: 'background .15s, color .15s',
            overflow: 'hidden',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
        >
          <span style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: themeAnim === 'out'
              ? 'themeIconOut 0.16s ease forwards'
              : themeAnim === 'in'
              ? 'themeIconIn  0.22s cubic-bezier(0.34,1.4,0.64,1) forwards'
              : undefined,
          }}>
            {colorMode === 'light' ? (
              /* Moon */
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
              </svg>
            ) : (
              /* Sun */
              <svg width={17} height={17} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5"/>
                <line x1="12" y1="1"  x2="12" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="23"/>
                <line x1="4.22" y1="4.22"  x2="5.64" y2="5.64"/>
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                <line x1="1"  y1="12" x2="3"  y2="12"/>
                <line x1="21" y1="12" x2="23" y2="12"/>
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
                <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
              </svg>
            )}
          </span>
        </button>

        {/* Avatar + dropdown */}
        <div>
          <div
            onClick={() => setMenuOpen(!menuOpen)}
            title={userName}
            style={{
              width: 34, height: 34, borderRadius: 100, background: 'var(--primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, fontWeight: 800, color: 'var(--primary-contrast)', cursor: 'pointer',
              userSelect: 'none',
            }}
          >
            {initials(userName)}
          </div>

          {mounted && menuOpen && createPortal(
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 9998 }}
                onClick={() => setMenuOpen(false)}
              />
              <div style={{
                position: 'fixed', top: 56, right: 16,
                background: 'var(--white)', border: '1px solid var(--gray3)',
                borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                zIndex: 9999, minWidth: 180, overflow: 'hidden',
                animation: 'panelUp .18s ease both',
              }}>
                <div style={{
                  padding: '12px 14px',
                  borderBottom: '1px solid var(--gray3)',
                  background: 'var(--bg)',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)' }}>{userName}</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray2)', marginTop: 1 }}>
                    {authUser?.email ?? 'Sheep Tech'}
                  </div>
                  {authUser?.role === 'master' && (
                    <span style={{
                      display: 'inline-block', marginTop: 4,
                      fontSize: 9, fontWeight: 800, padding: '2px 6px', borderRadius: 100,
                      background: 'rgba(124,58,237,0.12)', color: '#7C3AED',
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>Master</span>
                  )}
                </div>
                <button
                  onClick={async () => {
                    await fetch('/api/auth/logout', { method: 'POST' })
                    router.push('/login')
                    router.refresh()
                  }}
                  style={{
                    width: '100%', padding: '9px 14px', fontSize: 13, fontWeight: 600,
                    color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer',
                    textAlign: 'left', transition: 'background .2s',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(217,48,37,0.06)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                >
                  Sair
                </button>
              </div>
            </>,
            document.body
          )}
        </div>
      </div>
    </header>
  )
}
