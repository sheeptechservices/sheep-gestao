'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

// Dom → Seg → Ter → Qua → Qui → Sex → Sáb
const DAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

// ── Types ─────────────────────────────────────────────────────────────────────

export interface AppDatePickerProps {
  value:        string               // YYYY-MM-DD ou ''
  onChange:     (value: string) => void
  placeholder?: string
  disabled?:    boolean
  clearable?:   boolean              // exibe botão × para limpar (default true)
  width?:       string | number
}

type Cell = { d: number; m: number; y: number; cur: boolean }
type DropPos = { top?: number; bottom?: number; left: number; width: number }

// ── Component ─────────────────────────────────────────────────────────────────

export function AppDatePicker({
  value,
  onChange,
  placeholder = 'DD/MM/AAAA',
  disabled = false,
  clearable = true,
  width,
}: AppDatePickerProps) {
  const today  = new Date()
  const todayY = today.getFullYear()
  const todayM = today.getMonth()
  const todayD = today.getDate()

  const [mounted,   setMounted]   = useState(false)
  const [open,      setOpen]      = useState(false)
  const [hov,       setHov]       = useState(false)
  const [dropPos,   setDropPos]   = useState<DropPos>({ top: 0, left: 0, width: 256 })
  const [viewYear,  setViewYear]  = useState(todayY)
  const [viewMonth, setViewMonth] = useState(todayM)

  const triggerRef = useRef<HTMLDivElement>(null)
  const dropRef    = useRef<HTMLDivElement>(null)

  // SSR safety
  useEffect(() => { setMounted(true) }, [])

  // Fecha ao clicar fora
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        dropRef.current   && !dropRef.current.contains(e.target as Node)
      ) setOpen(false)
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

  function toggle() {
    if (disabled) return
    if (!open) {
      // Sincroniza view com o valor atual
      if (value) {
        setViewYear(parseInt(value.slice(0, 4)))
        setViewMonth(parseInt(value.slice(5, 7)) - 1)
      } else {
        setViewYear(todayY)
        setViewMonth(todayM)
      }
      const rect = triggerRef.current?.getBoundingClientRect()
      if (rect) {
        const spaceBelow = window.innerHeight - rect.bottom
        if (spaceBelow < 320) {
          setDropPos({ bottom: window.innerHeight - rect.top + 4, left: rect.left, width: rect.width })
        } else {
          setDropPos({ top: rect.bottom + 4, left: rect.left, width: rect.width })
        }
      }
    }
    setOpen(o => !o)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange('')
  }

  function handleDay(y: number, m: number, d: number) {
    const mm = String(m + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    onChange(`${y}-${mm}-${dd}`)
    setOpen(false)
  }

  function prevMonth(e: React.MouseEvent) {
    e.stopPropagation()
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11 }
      return m - 1
    })
  }

  function nextMonth(e: React.MouseEvent) {
    e.stopPropagation()
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0 }
      return m + 1
    })
  }

  // ── Derived values ───────────────────────────────────────────────────────────

  const selY = value ? parseInt(value.slice(0, 4)) : null
  const selM = value ? parseInt(value.slice(5, 7)) - 1 : null
  const selD = value ? parseInt(value.slice(8, 10)) : null

  const display = value
    ? `${value.slice(8, 10)}/${value.slice(5, 7)}/${value.slice(0, 4)}`
    : ''

  const firstDow      = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth   = new Date(viewYear, viewMonth + 1, 0).getDate()
  const prevDIM       = new Date(viewYear, viewMonth, 0).getDate()
  const prevM         = viewMonth === 0 ? 11 : viewMonth - 1
  const prevY         = viewMonth === 0 ? viewYear - 1 : viewYear
  const nextM         = viewMonth === 11 ? 0 : viewMonth + 1
  const nextY         = viewMonth === 11 ? viewYear + 1 : viewYear

  const cells: Cell[] = []
  for (let i = 0; i < firstDow; i++)
    cells.push({ d: prevDIM - firstDow + 1 + i, m: prevM, y: prevY, cur: false })
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ d: i, m: viewMonth, y: viewYear, cur: true })
  const trailing = 42 - cells.length
  for (let i = 1; i <= trailing; i++)
    cells.push({ d: i, m: nextM, y: nextY, cur: false })

  const isSelected = (c: Cell) => c.y === selY && c.m === selM && c.d === selD
  const isToday    = (c: Cell) => c.cur && c.y === todayY && c.m === todayM && c.d === todayD

  // ── Trigger styles ───────────────────────────────────────────────────────────

  const borderColor = open
    ? 'var(--primary)'
    : hov ? 'var(--gray2)' : 'var(--gray3)'

  const boxShadow = open
    ? '0 0 0 3px var(--primary-dim)'
    : 'none'

  // ── Calendar dropdown (portal) ───────────────────────────────────────────────

  const dropdown = mounted && open && createPortal(
    <div
      ref={dropRef}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position:     'fixed',
        top:          dropPos.top,
        bottom:       dropPos.bottom,
        left:         dropPos.left,
        zIndex:       9200,
        background:   'var(--white)',
        border:       '1px solid var(--gray3)',
        borderRadius: 10,
        boxShadow:    '0 8px 24px rgba(0,0,0,0.12)',
        padding:      '12px 10px 10px',
        width:        Math.max(dropPos.width, 256),
        userSelect:   'none',
        fontFamily:   'inherit',
        animation:    'panelUp 0.18s ease both',
      }}
    >
      {/* Mês/Ano nav */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
        <NavBtn onClick={prevMonth}>&#8249;</NavBtn>
        <span style={{ flex: 1, textAlign: 'center', fontWeight: 700, fontSize: 13, color: 'var(--black)' }}>
          {MONTHS_PT[viewMonth]} {viewYear}
        </span>
        <NavBtn onClick={nextMonth}>&#8250;</NavBtn>
      </div>

      {/* Cabeçalho dos dias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {DAY_LABELS.map((l, i) => (
          <div key={i} style={{
            textAlign: 'center', fontSize: 10, fontWeight: 700,
            color: 'var(--gray2)', padding: '2px 0', letterSpacing: 0.4,
          }}>
            {l}
          </div>
        ))}
      </div>

      {/* Grid de dias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 1 }}>
        {cells.map((cell, i) => (
          <DayBtn
            key={i}
            cell={cell}
            sel={isSelected(cell)}
            tod={isToday(cell)}
            onClick={() => handleDay(cell.y, cell.m, cell.d)}
          />
        ))}
      </div>

      {/* Botão Hoje */}
      <div style={{ borderTop: '1px solid var(--gray3)', marginTop: 8, paddingTop: 8 }}>
        <button
          onClick={() => handleDay(todayY, todayM, todayD)}
          style={{
            width: '100%', border: 'none', borderRadius: 7, padding: '6px 0',
            fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
            background: 'var(--primary)', color: 'var(--primary-text)',
            cursor: 'pointer', letterSpacing: 0.2, transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.82' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          Hoje
        </button>
      </div>
    </div>,
    document.body
  )

  // ── Trigger ──────────────────────────────────────────────────────────────────

  return (
    <div ref={triggerRef} style={{ position: 'relative', width: width ?? '100%', boxSizing: 'border-box' }}>
      <div
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={toggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle() }
          if (e.key === 'Escape') setOpen(false)
        }}
        style={{
          display:       'flex',
          alignItems:    'center',
          gap:           8,
          width:         '100%',
          boxSizing:     'border-box',
          padding:       '8px 11px',
          borderRadius:  8,
          border:        `1px solid ${borderColor}`,
          boxShadow,
          background:    disabled ? 'var(--gray3)' : 'var(--bg)',
          fontSize:      13,
          fontFamily:    'inherit',
          fontWeight:    500,
          color:         'var(--black)',
          cursor:        disabled ? 'not-allowed' : 'pointer',
          opacity:       disabled ? 0.6 : 1,
          userSelect:    'none',
          transition:    'border-color 0.15s, box-shadow 0.15s',
          outline:       'none',
        }}
      >
        <CalendarIcon />
        <span style={{
          flex: 1,
          color:      display ? 'var(--black)' : 'var(--gray2)',
          fontWeight: display ? 500 : 400,
          fontSize:   13,
          overflow:   'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {display || placeholder}
        </span>
        {value && clearable && !disabled && (
          <span
            onClick={handleClear}
            style={{
              color: 'var(--gray2)', fontSize: 16, lineHeight: 1,
              cursor: 'pointer', padding: '0 2px', marginRight: -4,
              flexShrink: 0,
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

// ── Sub-components ────────────────────────────────────────────────────────────

function NavBtn({ onClick, children }: { onClick: (e: React.MouseEvent) => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer',
        width: 28, height: 28, borderRadius: 6,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, color: 'var(--black)', lineHeight: 1,
        fontFamily: 'inherit', flexShrink: 0,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
    >
      {children}
    </button>
  )
}

function DayBtn({ cell, sel, tod, onClick }: { cell: Cell; sel: boolean; tod: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        border:       tod && !sel ? '2px solid var(--primary)' : '2px solid transparent',
        borderRadius: 6,
        height:       30,
        width:        '100%',
        cursor:       'pointer',
        fontSize:     12,
        fontWeight:   sel ? 700 : 500,
        background:   sel ? 'var(--primary)' : 'transparent',
        color:        sel
                        ? 'var(--primary-text)'
                        : cell.cur ? 'var(--black)' : 'var(--gray2)',
        fontFamily:   'inherit',
        transition:   'background 0.12s',
      }}
      onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
      onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
    >
      {cell.d}
    </button>
  )
}

function CalendarIcon() {
  return (
    <svg width={13} height={13} viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, color: 'var(--gray2)' }}>
      <rect x="1" y="2" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M1 6h14" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 1v2M11 1v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}
