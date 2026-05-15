'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppSelectOption {
  value: string
  label: string
  color?:    string  // cor do dot e texto do badge
  bg?:       string  // fundo do badge no item e no trigger
  border?:   string  // borda do badge
  sublabel?:      string  // etiqueta secundária (ex: nome do cliente)
  sublabelColor?: string  // cor da tag do sublabel (ex: color_hex do cliente)
}

export interface AppSelectProps {
  value:        string
  onChange:     (value: string) => void
  options:      AppSelectOption[]
  placeholder?: string
  mode?:        'field' | 'badge'   // default: 'field'
  disabled?:    boolean
  width?:       string | number
  onClick?:     (e: React.MouseEvent) => void
}

// ── Component ─────────────────────────────────────────────────────────────────

export function AppSelect({
  value,
  onChange,
  options,
  placeholder = '— Selecionar —',
  mode = 'field',
  disabled = false,
  width,
  onClick,
}: AppSelectProps) {
  const [mounted, setMounted] = useState(false)
  const [open,    setOpen]    = useState(false)
  const [hov,     setHov]     = useState(false)
  const [rect,    setRect]    = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null)
  const triggerRef            = useRef<HTMLDivElement>(null)

  // SSR safety — portal só monta no client
  useEffect(() => { setMounted(true) }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Fecha com Escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  const selected = options.find(o => o.value === value) ?? null

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    onClick?.(e)
    if (disabled) return
    if (open) { setOpen(false); return }
    if (triggerRef.current) {
      const r          = triggerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - r.bottom - 8
      const spaceAbove = r.top - 8
      const estHeight  = Math.min(options.length * 36 + 16, 280)
      if (spaceBelow >= estHeight || spaceBelow >= spaceAbove) {
        setRect({ top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.min(spaceBelow, 320) })
      } else {
        setRect({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, maxHeight: Math.min(spaceAbove, 320) })
      }
    }
    setOpen(true)
  }

  function handleSelect(val: string) {
    onChange(val)
    setOpen(false)
  }

  // ── Trigger: modo field ────────────────────────────────────────────────────
  const fieldTrigger = (
    <div
      ref={triggerRef}
      onClick={handleToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: width ?? '100%',
        padding: '8px 11px',
        borderRadius: 8,
        border: `1px solid ${open ? 'var(--primary)' : hov ? 'var(--gray2)' : 'var(--gray3)'}`,
        boxShadow: open ? '0 0 0 3px var(--primary-dim)' : 'none',
        background: disabled ? 'var(--gray3)' : 'var(--bg)',
        fontSize: 13,
        color: selected ? 'var(--black)' : 'var(--gray2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 8,
        userSelect: 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
        boxSizing: 'border-box',
        opacity: disabled ? 0.6 : 1,
        fontFamily: 'inherit',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
        {selected?.color && !selected?.bg && (
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: selected.color, flexShrink: 0 }} />
        )}
        {selected?.bg ? (
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '1px 8px', borderRadius: 100,
            color: selected.color ?? 'var(--gray)', background: selected.bg,
            border: `1px solid ${selected.border ?? (selected.color ? selected.color + '40' : 'var(--gray3)')}`,
          }}>
            {selected.label}
          </span>
        ) : (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: selected ? 500 : 400 }}>
            {selected ? selected.label : placeholder}
          </span>
        )}
        {selected?.sublabel && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: '1px 7px', borderRadius: 100, flexShrink: 0,
            color:       selected.sublabelColor ?? 'var(--gray2)',
            background:  selected.sublabelColor ? selected.sublabelColor + '18' : 'var(--gray3)',
            border:      `1px solid ${selected.sublabelColor ? selected.sublabelColor + '40' : 'transparent'}`,
            whiteSpace: 'nowrap',
          }}>{selected.sublabel}</span>
        )}
      </span>
      <svg width={10} height={10} viewBox="0 0 8 8" fill="none"
        style={{ opacity: 0.45, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
        <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )

  // ── Trigger: modo badge ────────────────────────────────────────────────────
  const badgeCfg = selected
  const badgeTrigger = (
    <div
      ref={triggerRef}
      onClick={handleToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: '3px 8px', borderRadius: 100,
        fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap',
        color:      badgeCfg ? (badgeCfg.color ?? 'var(--gray2)') : 'var(--gray2)',
        background: badgeCfg ? (badgeCfg.bg ?? 'transparent') : (open || hov ? 'var(--bg)' : 'transparent'),
        border: `1px solid ${
          hov || open
            ? (badgeCfg ? (badgeCfg.border ?? (badgeCfg.color ? badgeCfg.color + '55' : 'var(--gray3)')) : 'var(--gray3)')
            : 'transparent'
        }`,
        transition: 'all 0.15s',
        userSelect: 'none',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {badgeCfg ? badgeCfg.label : placeholder}
      <svg width={8} height={8} viewBox="0 0 8 8" fill="none"
        style={{ opacity: 0.55, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
        <path d="M1 3l3 3 3-3" stroke={badgeCfg?.color ?? 'currentColor'} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </div>
  )

  // ── Dropdown (portal, position:fixed) ────────────────────────────────────
  const dropdown = mounted && open && rect ? createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed',
        top:      rect.top,
        bottom:   rect.bottom,
        left:     rect.left,
        minWidth: Math.max(rect.width, mode === 'badge' ? 150 : 180),
        maxHeight: rect.maxHeight,
        overflowY: 'auto',
        zIndex:   4000,
        background:   'var(--white)',
        border:       '1px solid var(--gray3)',
        borderRadius: 10,
        boxShadow:    '0 8px 24px rgba(0,0,0,0.12)',
        padding:      4,
        display:      'flex', flexDirection: 'column', gap: 2,
        animation:    'panelUp 0.18s ease both',
      }}
    >
      {options.map(opt => {
        const isSel = opt.value === value
        return (
          <div
            key={opt.value}
            onClick={e => { e.stopPropagation(); handleSelect(opt.value) }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
              background: isSel && opt.bg ? opt.bg : isSel ? 'var(--bg)' : 'transparent',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
            onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            {/* Dot colorido — se tiver color mas não bg */}
            {opt.color && !opt.bg && (
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: opt.color, flexShrink: 0 }} />
            )}

            {/* Label + sublabel */}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
              {opt.bg ? (
                <span style={{
                  fontSize: 11, fontWeight: isSel ? 700 : 600,
                  padding: '1px 7px', borderRadius: 100,
                  color:       opt.color ?? 'var(--gray)',
                  background:  opt.bg,
                  border:      `1px solid ${opt.border ?? (opt.color ? opt.color + '40' : 'var(--gray3)')}`,
                }}>
                  {opt.label}
                </span>
              ) : (
                <span style={{
                  fontSize: 12, fontWeight: isSel ? 700 : 500,
                  color: isSel && opt.color ? opt.color : isSel ? 'var(--black)' : 'var(--gray)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {opt.label}
                </span>
              )}
              {opt.sublabel && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '1px 6px', borderRadius: 100, flexShrink: 0,
                  color:      opt.sublabelColor ?? 'var(--gray2)',
                  background: opt.sublabelColor ? opt.sublabelColor + '18' : 'var(--gray3)',
                  border:     `1px solid ${opt.sublabelColor ? opt.sublabelColor + '40' : 'transparent'}`,
                }}>{opt.sublabel}</span>
              )}
            </span>

            {/* Checkmark */}
            {isSel && (
              <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                <path d="M2 5l2.5 2.5L8 3"
                  stroke={opt.color ?? 'var(--primary-text)'}
                  strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                />
              </svg>
            )}
          </div>
        )
      })}
    </div>,
    document.body
  ) : null

  return (
    <>
      {mode === 'field' ? fieldTrigger : badgeTrigger}
      {dropdown}
    </>
  )
}
