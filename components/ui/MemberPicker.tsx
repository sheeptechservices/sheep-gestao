'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatar } from './MemberAvatar'

interface Props {
  value?: string          // member_id
  onChange: (id: string | undefined) => void
  placeholder?: string
}

export function MemberPicker({ value, onChange, placeholder = '— Selecionar —' }: Props) {
  const { members } = useTeamStore()

  const [mounted, setMounted] = useState(false)
  const [open,    setOpen]    = useState(false)
  const [hov,     setHov]     = useState(false)
  const [query,   setQuery]   = useState('')
  const [rect,    setRect]    = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

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

  // Foca o input de busca quando abre
  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30)
    else setQuery('')
  }, [open])

  const active   = members.find(m => m.id === value)
  const filtered = members
    .filter(m => m.status === 'active')
    .filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.cargo?.toLowerCase().includes(query.toLowerCase()))

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    if (triggerRef.current) {
      const r          = triggerRef.current.getBoundingClientRect()
      const estHeight  = Math.min((filtered.length + 1) * 36 + 52, 300)
      const spaceBelow = window.innerHeight - r.bottom - 8
      const spaceAbove = r.top - 8
      if (spaceBelow >= estHeight || spaceBelow >= spaceAbove) {
        setRect({ top: r.bottom + 4, left: r.left, width: r.width, maxHeight: Math.min(spaceBelow, 320) })
      } else {
        setRect({ bottom: window.innerHeight - r.top + 4, left: r.left, width: r.width, maxHeight: Math.min(spaceAbove, 320) })
      }
    }
    setOpen(true)
  }

  function handleSelect(id: string | undefined) {
    onChange(id)
    setOpen(false)
  }

  // ── Dropdown via portal ────────────────────────────────────────────────────
  const dropdown = mounted && open && rect ? createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position:  'fixed',
        top:       rect.top,
        bottom:    rect.bottom,
        left:      rect.left,
        minWidth:  Math.max(rect.width, 220),
        maxHeight: rect.maxHeight,
        zIndex:    4000,
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
      {/* Search */}
      <div style={{ padding: '8px 8px 4px', borderBottom: '1px solid var(--gray3)' }}>
        <input
          ref={searchRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar membro..."
          style={{
            width: '100%',
            border: '1px solid var(--gray3)',
            borderRadius: 7,
            padding: '5px 9px',
            fontSize: 12,
            background: 'var(--bg)',
            color: 'var(--black)',
            outline: 'none',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Options */}
      <div style={{ overflowY: 'auto', flex: 1, padding: 4 }}>
        {/* Limpar seleção */}
        {value && (
          <div
            onClick={() => handleSelect(undefined)}
            style={optionStyle(false)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round"/>
              </svg>
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray2)', fontWeight: 500 }}>Sem responsável</span>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--gray2)', textAlign: 'center' }}>
            Nenhum membro encontrado
          </div>
        )}

        {filtered.map(m => {
          const isSel = m.id === value
          return (
            <div
              key={m.id}
              onClick={() => handleSelect(m.id)}
              style={optionStyle(isSel)}
              onMouseEnter={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (!isSel) (e.currentTarget as HTMLElement).style.background = isSel ? 'var(--bg)' : 'transparent' }}
            >
              <MemberAvatar member={m} size={24} />
              <span style={{ fontSize: 12, fontWeight: isSel ? 700 : 500, color: 'var(--black)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name}
              </span>
              {m.cargo && (
                <span style={{ fontSize: 10, color: 'var(--gray2)', flexShrink: 0 }}>
                  {m.cargo}
                </span>
              )}
              {isSel && (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 5l2.5 2.5L8 3" stroke="var(--primary-text)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: '100%',
          padding: '8px 11px',
          borderRadius: 8,
          border: `1px solid ${open ? 'var(--primary)' : hov ? 'var(--gray2)' : 'var(--gray3)'}`,
          boxShadow: open ? '0 0 0 3px var(--primary-dim)' : 'none',
          background: 'var(--bg)',
          fontSize: 13,
          color: active ? 'var(--black)' : 'var(--gray2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
          userSelect: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
          {active
            ? <>
                <MemberAvatar member={active} size={20} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                  {active.name}
                </span>
              </>
            : <span style={{ fontWeight: 400 }}>{placeholder}</span>
          }
        </span>
        <svg width={10} height={10} viewBox="0 0 8 8" fill="none"
          style={{ opacity: 0.45, flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      {dropdown}
    </>
  )
}

function optionStyle(selected: boolean): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 7,
    cursor: 'pointer',
    background: selected ? 'var(--bg)' : 'transparent',
    transition: 'background 0.12s',
  }
}
