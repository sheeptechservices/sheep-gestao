'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import type { Week } from '@/lib/types'

export function WeekPickerSelect({ value, onChange, weeks, color = '#84CC16', disabled }: {
  value: string | null
  onChange: (weekId: string | null) => void
  weeks: Week[]
  color?: string
  disabled?: boolean
}) {
  const [open, setOpen]   = useState(false)
  const ref               = useRef<HTMLDivElement>(null)
  const todayStr          = (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })()
  const todayMonth        = todayStr.slice(0, 7)
  const selectedWeek      = weeks.find(w => w.id === value)
  const [month, setMonth] = useState(selectedWeek?.start_date.slice(0, 7) ?? todayMonth)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const months     = useMemo(() => Array.from(new Set(weeks.map(w => w.start_date.slice(0, 7)))).sort(), [weeks])
  const monthIdx   = months.indexOf(month)
  const monthWeeks = weeks.filter(w => w.start_date.slice(0, 7) === month)
  const monthLabel = new Date(month + '-15').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  const selLabel = selectedWeek
    ? `Sem ${selectedWeek.week_number} · ${selectedWeek.start_date.slice(5).replace('-', '/')}–${selectedWeek.end_date.slice(5).replace('-', '/')}`
    : 'Backlog'

  return (
    <div ref={ref} style={{ position: 'relative', width: '100%' }}>
      <button
        onClick={() => !disabled && setOpen(o => !o)}
        disabled={disabled}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 12px', borderRadius: 8,
          border: `1px solid ${open ? color + '60' : 'var(--gray3)'}`,
          background: 'var(--white)', cursor: disabled ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit', fontSize: 12, fontWeight: 500,
          color: disabled ? 'var(--gray2)' : value ? 'var(--black)' : 'var(--gray2)',
          boxShadow: open ? `0 0 0 3px ${color}18` : 'none',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.15s',
        }}
      >
        <span>{selLabel}</span>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none"
          style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.5 }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 9999,
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.14)',
          overflow: 'hidden', animation: 'fadeIn 0.12s ease both',
        }}>
          {/* Backlog */}
          <div
            onClick={() => { onChange(null); setOpen(false) }}
            style={{
              padding: '9px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              color: !value ? color : 'var(--gray2)', borderBottom: '1px solid var(--gray3)',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            Backlog
            {!value && (
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <path d="M2 6l3 3 5-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>

          {/* Month nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px', borderBottom: '1px solid var(--gray3)' }}>
            <button
              onClick={() => monthIdx > 0 && setMonth(months[monthIdx - 1])}
              disabled={monthIdx === 0}
              style={{
                width: 24, height: 24, borderRadius: 6, border: '1px solid var(--gray3)',
                background: 'transparent', cursor: monthIdx > 0 ? 'pointer' : 'default',
                opacity: monthIdx === 0 ? 0.3 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <path d="M6.5 2l-3 3 3 3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <span style={{ flex: 1, textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--black)', textTransform: 'capitalize' }}>
              {monthLabel}
            </span>
            <button
              onClick={() => monthIdx < months.length - 1 && setMonth(months[monthIdx + 1])}
              disabled={monthIdx === months.length - 1}
              style={{
                width: 24, height: 24, borderRadius: 6, border: '1px solid var(--gray3)',
                background: 'transparent', cursor: monthIdx < months.length - 1 ? 'pointer' : 'default',
                opacity: monthIdx === months.length - 1 ? 0.3 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}
            >
              <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                <path d="M3.5 2l3 3-3 3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>

          {/* Weeks in month */}
          {monthWeeks.map(w => {
            const isSelected = value === w.id
            const isCurrent  = todayStr >= w.start_date && todayStr <= w.end_date
            return (
              <div
                key={w.id}
                onClick={() => { onChange(w.id); setOpen(false) }}
                style={{
                  padding: '9px 14px', fontSize: 12, fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer', color: isSelected ? color : 'var(--black)',
                  background: isSelected ? color + '08' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg)' }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent' }}
              >
                <span style={{ flex: 1 }}>
                  Sem {w.week_number} · {w.start_date.slice(5).replace('-', '/')}–{w.end_date.slice(5).replace('-', '/')}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                  {isCurrent && (
                    <span style={{ fontSize: 9, fontWeight: 800, color: '#fff', background: color, padding: '1px 5px', borderRadius: 4 }}>
                      Atual
                    </span>
                  )}
                  {isSelected && (
                    <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
