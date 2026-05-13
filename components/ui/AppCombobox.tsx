'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppComboboxProps {
  value:         string
  onChange:      (value: string) => void
  options:       string[]
  onAddOption?:  (newOption: string) => void
  placeholder?:  string
  disabled?:     boolean
  clearable?:    boolean
  width?:        string | number
}

type DropPos = { top?: number; bottom?: number; left: number; width: number }

// ── Component ─────────────────────────────────────────────────────────────────

export function AppCombobox({
  value,
  onChange,
  options,
  onAddOption,
  placeholder = '— Selecionar —',
  disabled = false,
  clearable = true,
  width,
}: AppComboboxProps) {
  const [mounted,  setMounted]  = useState(false)
  const [open,     setOpen]     = useState(false)
  const [hov,      setHov]      = useState(false)
  const [query,    setQuery]    = useState('')
  const [dropPos,  setDropPos]  = useState<DropPos>({ top: 0, left: 0, width: 200 })

  const triggerRef = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  // SSR safety
  useEffect(() => { setMounted(true) }, [])

  // Foca o input de busca quando abre
  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => searchRef.current?.focus(), 30)
    }
  }, [open])

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

  // ── Handlers ────────────────────────────────────────────────────────────────

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (disabled) return
    if (open) { setOpen(false); return }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const estHeight = Math.min(options.length * 34 + 60, 280)
      const spaceBelow = window.innerHeight - rect.bottom
      if (spaceBelow < estHeight + 16) {
        setDropPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width })
      } else {
        setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
      }
    }
    setOpen(true)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  function handleSelect(opt: string) {
    onChange(opt)
    setOpen(false)
  }

  function handleAdd() {
    const trimmed = query.trim()
    if (!trimmed) return
    onChange(trimmed)
    onAddOption?.(trimmed)
    setOpen(false)
  }

  // ── Filtered options ─────────────────────────────────────────────────────────

  const filtered = query.trim()
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  const exactMatch = options.some(o => o.toLowerCase() === query.trim().toLowerCase())
  const showAdd    = query.trim().length > 0 && !exactMatch

  // ── Trigger styles ───────────────────────────────────────────────────────────

  const borderColor = open
    ? 'var(--primary)'
    : hov ? 'var(--gray2)' : 'var(--gray3)'

  const boxShadow = open ? '0 0 0 3px var(--primary-dim)' : 'none'

  // ── Dropdown ─────────────────────────────────────────────────────────────────

  const dropdown = mounted && open && createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position:     'fixed',
        top:          dropPos.top,
        bottom:       dropPos.bottom,
        left:         dropPos.left,
        width:        Math.max(dropPos.width, 180),
        zIndex:       4000,
        background:   'var(--white)',
        border:       '1px solid var(--gray3)',
        borderRadius: 10,
        boxShadow:    '0 8px 24px rgba(0,0,0,0.12)',
        display:      'flex',
        flexDirection:'column',
        overflow:     'hidden',
        animation:    'panelUp 0.18s ease both',
      }}
    >
      {/* Search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 7,
        padding: '8px 10px',
        borderBottom: '1px solid var(--gray3)',
        background: 'var(--bg)',
      }}>
        <svg width={12} height={12} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--gray2)' }}>
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              if (filtered.length === 1) handleSelect(filtered[0])
              else if (showAdd) handleAdd()
            }
          }}
          placeholder="Buscar..."
          style={{
            flex: 1, border: 'none', outline: 'none',
            fontSize: 12, fontWeight: 500, fontFamily: 'inherit',
            color: 'var(--black)', background: 'transparent',
          }}
        />
        {query && (
          <span
            onClick={() => setQuery('')}
            style={{ color: 'var(--gray2)', fontSize: 14, cursor: 'pointer', lineHeight: 1 }}
          >×</span>
        )}
      </div>

      {/* Options list */}
      <div style={{ overflowY: 'auto', maxHeight: 220, padding: 4 }}>
        {filtered.length === 0 && !showAdd && (
          <div style={{
            padding: '10px 12px', fontSize: 12, color: 'var(--gray2)',
            fontStyle: 'italic', textAlign: 'center',
          }}>
            Nenhum resultado
          </div>
        )}

        {filtered.map(opt => {
          const isSel = opt === value
          return (
            <div
              key={opt}
              onClick={() => handleSelect(opt)}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
                background: isSel ? 'var(--bg)' : 'transparent',
                transition: 'background 0.12s',
              }}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{
                fontSize: 12, fontWeight: isSel ? 700 : 500,
                color: isSel ? 'var(--black)' : 'var(--gray)',
              }}>
                {opt}
              </span>
              {isSel && (
                <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 5l2.5 2.5L8 3" stroke="var(--primary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          )
        })}

        {/* Adicionar novo */}
        {showAdd && (
          <div
            onClick={handleAdd}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 10px', borderRadius: 7, cursor: 'pointer',
              borderTop: filtered.length > 0 ? '1px solid var(--gray3)' : 'none',
              marginTop: filtered.length > 0 ? 4 : 0,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--primary-dim)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
              <path d="M6 1v10M1 6h10" stroke="var(--primary)" strokeWidth={1.6} strokeLinecap="round"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary-text)' }}>
              Adicionar &ldquo;{query.trim()}&rdquo;
            </span>
          </div>
        )}
      </div>
    </div>,
    document.body
  )

  // ── Trigger ──────────────────────────────────────────────────────────────────

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: width ?? '100%', boxSizing: 'border-box' }}>
      <div
        onClick={handleToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display:      'flex',
          alignItems:   'center',
          gap:          8,
          width:        '100%',
          boxSizing:    'border-box',
          padding:      '8px 11px',
          borderRadius: 8,
          border:       `1px solid ${borderColor}`,
          boxShadow,
          background:   disabled ? 'var(--gray3)' : 'var(--bg)',
          fontSize:     13,
          fontFamily:   'inherit',
          color:        'var(--black)',
          cursor:       disabled ? 'not-allowed' : 'pointer',
          opacity:      disabled ? 0.6 : 1,
          userSelect:   'none',
          transition:   'border-color 0.15s, box-shadow 0.15s',
        }}
      >
        <span style={{
          flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          color:      value ? 'var(--black)' : 'var(--gray2)',
          fontWeight: value ? 500 : 400,
        }}>
          {value || placeholder}
        </span>

        {value && clearable && !disabled && (
          <span
            onClick={handleClear}
            style={{
              color: 'var(--gray2)', fontSize: 16, lineHeight: 1,
              cursor: 'pointer', flexShrink: 0, padding: '0 2px',
            }}
          >
            ×
          </span>
        )}

        <svg width={10} height={10} viewBox="0 0 8 8" fill="none"
          style={{ opacity: 0.45, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {dropdown}
    </div>
  )
}
