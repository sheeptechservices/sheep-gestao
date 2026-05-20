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

  // Glassmorphism — light mais translúcido para efeito de vidro visível
  const bg         = isDark ? 'rgba(22, 25, 35, 0.82)' : 'rgba(255,255,255,0.48)'
  const border     = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.90)'
  const shadow     = isDark
    ? '0 8px 32px rgba(0,0,0,0.45), 0 2px 8px rgba(0,0,0,0.25)'
    : '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.08)'
  const shadowHov  = isDark
    ? '0 12px 40px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.30)'
    : '0 12px 40px rgba(0,0,0,0.18), 0 4px 12px rgba(0,0,0,0.10)'
  const textColor  = isDark ? '#E2E8F0' : '#121316'
  const subColor   = isDark ? '#94A3B8' : '#64748B'
  const closeBg    = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'flex-start', gap: 10,
        width: 320,
        background: bg,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: 14,
        border: `1px solid ${border}`,
        borderLeft: `3px solid ${accent}`,
        boxShadow: hovered ? shadowHov : shadow,
        padding: '12px 12px 12px 13px',
        cursor: 'default',
        position: 'relative',
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
        <div style={{ fontSize: 13, fontWeight: 700, color: textColor, lineHeight: 1.3 }}>
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
