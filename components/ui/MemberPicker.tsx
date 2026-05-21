'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatar } from './MemberAvatar'

interface Props {
  value: string[]                      // array de member_ids
  onChange: (ids: string[]) => void
  placeholder?: string
  compact?: boolean   // matches FilterPill height/style (for filter bars)
}

export function MemberPicker({ value, onChange, placeholder = '— Selecionar —', compact = false }: Props) {
  const { members, fetchMembers } = useTeamStore()

  // Garante que os membros estejam carregados independentemente da página visitada
  useEffect(() => { if (members.length === 0) fetchMembers() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const [mounted, setMounted] = useState(false)
  const [open,    setOpen]    = useState(false)
  const [hov,     setHov]     = useState(false)
  const [query,   setQuery]   = useState('')
  const [rect,    setRect]    = useState<{ top?: number; bottom?: number; left: number; width: number; maxHeight: number } | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)
  const searchRef  = useRef<HTMLInputElement>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!triggerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 30)
    else setQuery('')
  }, [open])

  const selected = members.filter(m => value.includes(m.id))
  const filtered = members
    .filter(m => m.status === 'active')
    .filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.cargo?.toLowerCase().includes(query.toLowerCase()))

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    if (triggerRef.current) {
      const r          = triggerRef.current.getBoundingClientRect()
      const estHeight  = Math.min((filtered.length + 1) * 36 + 60, 300)
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

  function toggleMember(id: string) {
    if (value.includes(id)) {
      onChange(value.filter(v => v !== id))
    } else {
      onChange([...value, id])
    }
    // keep dropdown open for multi-select
  }

  // ── Dropdown via portal ────────────────────────────────────────────────────
  const dropdown = mounted && open && rect ? createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position:     'fixed',
        top:          rect.top,
        bottom:       rect.bottom,
        left:         rect.left,
        minWidth:     Math.max(rect.width, 220),
        maxHeight:    rect.maxHeight,
        zIndex:       10000,
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
        {/* Limpar tudo */}
        {value.length > 0 && (
          <div
            onClick={() => onChange([])}
            style={optionStyle(false)}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
          >
            <span style={{ width: 24, height: 24, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: 0.35, flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
                <path d="M2 2l8 8M10 2l-8 8" strokeLinecap="round"/>
              </svg>
            </span>
            <span style={{ fontSize: 12, color: 'var(--gray2)', fontWeight: 500 }}>Limpar seleção</span>
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ padding: '12px 10px', fontSize: 12, color: 'var(--gray2)', textAlign: 'center' }}>
            Nenhum membro encontrado
          </div>
        )}

        {filtered.map(m => {
          const isSel = value.includes(m.id)
          return (
            <div
              key={m.id}
              onClick={() => toggleMember(m.id)}
              style={{ ...optionStyle(isSel), background: isSel ? 'var(--bg)' : 'transparent' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = isSel ? 'var(--bg)' : 'transparent' }}
            >
              {/* Checkbox visual */}
              <div style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: isSel ? '2px solid var(--primary-text)' : '1.5px solid var(--gray2)',
                background: isSel ? 'var(--primary-text)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s',
              }}>
                {isSel && (
                  <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                    <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </div>

              <MemberAvatar member={m} size={22} />

              <span style={{ fontSize: 12, fontWeight: isSel ? 700 : 500, color: 'var(--black)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {m.name}
              </span>
              {m.cargo && (
                <span style={{ fontSize: 10, color: 'var(--gray2)', flexShrink: 0 }}>
                  {m.cargo}
                </span>
              )}
            </div>
          )
        })}
      </div>
    </div>,
    document.body
  ) : null

  // ── Trigger ────────────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={triggerRef}
        onClick={handleToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          width: compact ? 'auto' : '100%',
          minHeight: compact ? 'unset' : 38,
          padding: compact
            ? '5px 10px'
            : selected.length > 1 ? '5px 11px' : '8px 11px',
          borderRadius: 8,
          border: `1px solid ${open ? 'var(--primary)' : hov ? 'var(--gray2)' : 'var(--gray3)'}`,
          boxShadow: open ? '0 0 0 3px var(--primary-dim)' : 'none',
          background: compact
            ? (selected.length > 0 ? 'var(--primary-dim)' : 'var(--white)')
            : 'var(--bg)',
          fontSize: compact ? 11 : 13,
          fontWeight: compact ? 700 : 400,
          color: selected.length
            ? (compact ? 'var(--primary)' : 'var(--black)')
            : 'var(--gray)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: compact ? 4 : 8,
          userSelect: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s, background 0.15s',
          boxSizing: 'border-box',
          fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1, flexWrap: 'wrap' }}>
          {selected.length === 0 && (
            <span style={{ fontWeight: 400 }}>{placeholder}</span>
          )}
          {selected.length === 1 && (
            <>
              <MemberAvatar member={selected[0]} size={compact ? 16 : 20} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: compact ? 700 : 500 }}>
                {compact ? selected[0].name.split(' ')[0] : selected[0].name}
              </span>
            </>
          )}
          {selected.length > 1 && selected.map(m => (
            <span
              key={m.id}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                padding: '2px 7px 2px 3px', borderRadius: 100,
                background: m.color_hex + '22',
                border: `1px solid ${m.color_hex}44`,
                fontSize: 11, fontWeight: 600, color: 'var(--black)',
                whiteSpace: 'nowrap',
              }}
            >
              <MemberAvatar member={m} size={16} />
              {m.name.split(' ')[0]}
            </span>
          ))}
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
