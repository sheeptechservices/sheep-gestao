'use client'
import { useEffect, useRef, useState } from 'react'
import { useToastStore, type ToastItem, type ToastType } from '@/stores/toastStore'

// ── Accent colors por tipo ─────────────────────────────────────────────────────
const ACCENT: Record<ToastType, string> = {
  success: '#16A34A',
  error:   '#DC2626',
  info:    '#2563EB',
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
    <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <path d="M3 8.5l3.5 3.5 6.5-7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function IconError({ color }: { color: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <path d="M4 4l8 8M12 4L4 12" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  )
}
function IconInfo({ color }: { color: string }) {
  return (
    <svg width={15} height={15} viewBox="0 0 16 16" fill="none">
      <path d="M8 7v5M8 5.5v.01" stroke={color} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  )
}

// ── Single Toast ───────────────────────────────────────────────────────────────
function Toast({ item }: { item: ToastItem }) {
  const dismiss   = useToastStore(s => s.dismiss)
  const [exiting, setExiting] = useState(false)
  const [hovered, setHovered] = useState(false)
  const timerRef  = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isDark    = useIsDark()
  const accent    = ACCENT[item.type]
  const duration  = item.duration ?? 4000

  const leave = () => {
    setExiting(true)
    setTimeout(() => dismiss(item.id), 320)
  }

  useEffect(() => {
    if (duration === 0) return
    if (hovered) { if (timerRef.current) clearTimeout(timerRef.current); return }
    timerRef.current = setTimeout(leave, duration)
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [hovered, duration]) // eslint-disable-line react-hooks/exhaustive-deps

  // Fundo tintado com a cor do tipo — claro ou escuro
  const bgAlpha    = isDark ? '55' : '22'   // hex opacity
  const bdAlpha    = isDark ? '55' : '35'
  const bg         = accent + bgAlpha
  const borderCol  = accent + bdAlpha
  const shadow     = isDark
    ? `0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25), 0 0 0 1px ${borderCol}`
    : `0 8px 32px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06), 0 0 0 1px ${borderCol}`
  const shadowHov  = isDark
    ? `0 12px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.30), 0 0 0 1px ${borderCol}`
    : `0 12px 40px rgba(0,0,0,0.15), 0 4px 12px rgba(0,0,0,0.08), 0 0 0 1px ${borderCol}`
  const subColor   = isDark ? '#94A3B8' : '#64748B'
  const closeBg    = accent + '22'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        width: 320,
        background: bg,
        borderRadius: 14,
        border: `1px solid ${borderCol}`,
        borderLeft: `3.5px solid ${accent}`,
        boxShadow: hovered ? shadowHov : shadow,
        padding: '12px 12px 12px 13px',
        cursor: 'default',
        position: 'relative',
        backdropFilter:         'blur(16px)',
        WebkitBackdropFilter:   'blur(16px)',
        animation: exiting
          ? 'toastOut 0.32s cubic-bezier(0.4,0,1,1) both'
          : 'toastIn 0.38s cubic-bezier(0.34,1.1,0.64,1) both',
        transition: 'box-shadow 0.2s ease',
      }}
    >
      {/* Ícone */}
      <div style={{
        flexShrink: 0, marginTop: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {item.type === 'success' && <IconSuccess color={accent} />}
        {item.type === 'error'   && <IconError   color={accent} />}
        {item.type === 'info'    && <IconInfo     color={accent} />}
      </div>

      {/* Conteúdo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: accent, lineHeight: 1.3 }}>
          {item.title}
        </div>
        {item.message && (
          <div style={{ fontSize: 11.5, color: subColor, marginTop: 2, lineHeight: 1.45 }}>
            {item.message}
          </div>
        )}
      </div>

      {/* Fechar */}
      <button
        onClick={leave}
        style={{
          flexShrink: 0, width: 20, height: 20, borderRadius: 5,
          border: 'none', background: 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: isDark ? '#94A3B8' : '#9CA3AF',
          opacity: 0.7, transition: 'background 0.15s, opacity 0.15s',
          marginTop: 1,
        }}
        onMouseEnter={e => { e.currentTarget.style.background = closeBg; e.currentTarget.style.opacity = '1' }}
        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7' }}
      >
        <svg width={8} height={8} viewBox="0 0 9 9" fill="none">
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
      zIndex: 100000,
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
