'use client'
import { useEffect, useRef, useState } from 'react'
import { useToastStore, type ToastItem, type ToastType } from '@/stores/toastStore'

// ── Temas por tipo × modo ──────────────────────────────────────────────────────

type ThemeEntry = {
  accent: string
  bg: string
  border: string
  shadow: string
  shadowHov: string
  iconBg: string
  textColor: string
  subColor: string
  closeBg: string
}

const LIGHT: Record<ToastType, ThemeEntry> = {
  success: {
    accent:    '#1A7A36',
    bg:        'rgba(30,138,62,0.10)',
    border:    'rgba(30,138,62,0.25)',
    shadow:    '0 8px 32px rgba(30,138,62,0.14), 0 2px 8px rgba(30,138,62,0.10)',
    shadowHov: '0 12px 40px rgba(30,138,62,0.24), 0 4px 12px rgba(30,138,62,0.16)',
    iconBg:    'rgba(30,138,62,0.14)',
    textColor: '#0F2E18',
    subColor:  '#2D6B42',
    closeBg:   'rgba(30,138,62,0.12)',
  },
  error: {
    accent:    '#B91C1C',
    bg:        'rgba(217,48,37,0.10)',
    border:    'rgba(217,48,37,0.25)',
    shadow:    '0 8px 32px rgba(217,48,37,0.14), 0 2px 8px rgba(217,48,37,0.10)',
    shadowHov: '0 12px 40px rgba(217,48,37,0.24), 0 4px 12px rgba(217,48,37,0.16)',
    iconBg:    'rgba(217,48,37,0.12)',
    textColor: '#2D0A08',
    subColor:  '#8B2A24',
    closeBg:   'rgba(217,48,37,0.12)',
  },
  info: {
    accent:    '#1D4ED8',
    bg:        'rgba(59,130,246,0.10)',
    border:    'rgba(59,130,246,0.25)',
    shadow:    '0 8px 32px rgba(59,130,246,0.14), 0 2px 8px rgba(59,130,246,0.10)',
    shadowHov: '0 12px 40px rgba(59,130,246,0.24), 0 4px 12px rgba(59,130,246,0.16)',
    iconBg:    'rgba(59,130,246,0.12)',
    textColor: '#0C1A40',
    subColor:  '#2E5AA8',
    closeBg:   'rgba(59,130,246,0.12)',
  },
}

const DARK: Record<ToastType, ThemeEntry> = {
  success: {
    accent:    '#4ADE80',
    bg:        'rgba(74,222,128,0.12)',
    border:    'rgba(74,222,128,0.22)',
    shadow:    '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(74,222,128,0.10)',
    shadowHov: '0 12px 40px rgba(0,0,0,0.50), 0 4px 12px rgba(74,222,128,0.18)',
    iconBg:    'rgba(74,222,128,0.15)',
    textColor: '#D1FAE5',
    subColor:  '#6EE7B7',
    closeBg:   'rgba(74,222,128,0.15)',
  },
  error: {
    accent:    '#F87171',
    bg:        'rgba(248,113,113,0.12)',
    border:    'rgba(248,113,113,0.22)',
    shadow:    '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(248,113,113,0.10)',
    shadowHov: '0 12px 40px rgba(0,0,0,0.50), 0 4px 12px rgba(248,113,113,0.18)',
    iconBg:    'rgba(248,113,113,0.15)',
    textColor: '#FEE2E2',
    subColor:  '#FCA5A5',
    closeBg:   'rgba(248,113,113,0.15)',
  },
  info: {
    accent:    '#60A5FA',
    bg:        'rgba(96,165,250,0.12)',
    border:    'rgba(96,165,250,0.22)',
    shadow:    '0 8px 32px rgba(0,0,0,0.40), 0 2px 8px rgba(96,165,250,0.10)',
    shadowHov: '0 12px 40px rgba(0,0,0,0.50), 0 4px 12px rgba(96,165,250,0.18)',
    iconBg:    'rgba(96,165,250,0.15)',
    textColor: '#DBEAFE',
    subColor:  '#93C5FD',
    closeBg:   'rgba(96,165,250,0.15)',
  },
}

// ── Detect dark mode ───────────────────────────────────────────────────────────

function useIsDark() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const check = () => setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    check()
    const obs = new MutationObserver(check)
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    return () => obs.disconnect()
  }, [])
  return dark
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function IconSuccess({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3.5 3.5 6.5-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function IconError({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4L4 12" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  )
}

function IconInfo({ color }: { color: string }) {
  return (
    <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <path d="M8 7v5M8 5.5v.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  )
}

// ── Single Toast ───────────────────────────────────────────────────────────────

function Toast({ item }: { item: ToastItem }) {
  const dismiss = useToastStore(s => s.dismiss)
  const [exiting, setExiting] = useState(false)
  const [hovered, setHovered] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDark = useIsDark()
  const t = (isDark ? DARK : LIGHT)[item.type]
  const duration = item.duration ?? 4000

  // fundo sólido da sidebar no dark para garantir contraste
  const solidBg = isDark ? '#1C1F28' : '#FFFFFF'

  const leave = () => {
    setExiting(true)
    setTimeout(() => dismiss(item.id), 320)
  }

  useEffect(() => {
    if (duration === 0) return
    if (hovered) {
      if (timerRef.current) clearTimeout(timerRef.current)
      return
    }
    timerRef.current = setTimeout(leave, duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [hovered, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 11,
        width: 320,
        background: isDark
          ? `linear-gradient(135deg, ${solidBg}, ${solidBg})`
          : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderRadius: 14,
        border: `1px solid ${t.border}`,
        boxShadow: hovered ? t.shadowHov : t.shadow,
        padding: '12px 12px 12px 14px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
        animation: exiting
          ? 'toastOut 0.32s cubic-bezier(0.4,0,1,1) both'
          : 'toastIn 0.38s cubic-bezier(0.34,1.1,0.64,1) both',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Barra colorida lateral */}
      <div style={{
        position: 'absolute',
        left: 0, top: 0, bottom: 0,
        width: 3,
        background: t.accent,
        borderRadius: '14px 0 0 14px',
      }} />

      {/* Ícone */}
      <div style={{
        flexShrink: 0,
        width: 28, height: 28,
        borderRadius: 8,
        background: t.iconBg,
        border: `1px solid ${t.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.type === 'success' && <IconSuccess color={t.accent} />}
        {item.type === 'error'   && <IconError   color={t.accent} />}
        {item.type === 'info'    && <IconInfo     color={t.accent} />}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: t.textColor, lineHeight: 1.3 }}>
          {item.title}
        </div>
        {item.message && (
          <div style={{ fontSize: 11.5, color: t.subColor, marginTop: 2, lineHeight: 1.45 }}>
            {item.message}
          </div>
        )}
      </div>

      {/* Fechar */}
      <button
        onClick={leave}
        style={{
          flexShrink: 0,
          width: 22, height: 22,
          borderRadius: 6,
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: t.accent,
          opacity: 0.55,
          transition: 'background 0.15s, opacity 0.15s',
          marginTop: 1,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = t.closeBg
          e.currentTarget.style.opacity = '1'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'transparent'
          e.currentTarget.style.opacity = '0.55'
        }}
      >
        <svg width={9} height={9} viewBox="0 0 9 9" fill="none">
          <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
        </svg>
      </button>

    </div>
  )
}

// ── Container ──────────────────────────────────────────────────────────────────

export function ToastContainer() {
  const toasts = useToastStore(s => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      right: 24,
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
      alignItems: 'flex-end',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div key={t.id} style={{ pointerEvents: 'auto' }}>
          <Toast item={t} />
        </div>
      ))}
    </div>
  )
}
