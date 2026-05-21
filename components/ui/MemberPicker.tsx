'use client'
import { useState, useRef, useEffect } from 'react'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatar } from './MemberAvatar'
import type { TeamMember } from '@/lib/types'

interface Props {
  value?: string          // member_id
  onChange: (id: string | undefined) => void
  placeholder?: string
  size?: number
}

export function MemberPicker({ value, onChange, placeholder = 'Responsável', size = 26 }: Props) {
  const { members } = useTeamStore()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const active = members.find(m => m.id === value)
  const filtered = members
    .filter(m => m.status === 'active')
    .filter(m => m.name.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(o => !o); setQuery('') }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 8px',
          borderRadius: 8,
          border: '1px solid var(--border)',
          background: 'var(--bg-card)',
          cursor: 'pointer',
          fontSize: 13,
          color: active ? 'var(--text)' : 'var(--text-muted)',
          minWidth: 120,
          maxWidth: 200,
        }}
      >
        {active
          ? <>
              <MemberAvatar member={active} size={size} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {active.name.split(' ')[0]}
              </span>
            </>
          : <span style={{ paddingLeft: 2 }}>{placeholder}</span>
        }
        <svg
          width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5"
          style={{ marginLeft: 'auto', flexShrink: 0, opacity: 0.5 }}
        >
          <path d="M2 3.5 5 6.5 8 3.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 4px)',
          left: 0,
          zIndex: 9999,
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
          minWidth: 200,
          maxHeight: 280,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Search */}
          <div style={{ padding: '8px 8px 4px' }}>
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar membro..."
              style={{
                width: '100%',
                border: '1px solid var(--border)',
                borderRadius: 7,
                padding: '5px 8px',
                fontSize: 12,
                background: 'var(--bg)',
                color: 'var(--text)',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', maxHeight: 220 }}>
            {/* Clear option */}
            {value && (
              <button
                type="button"
                onClick={() => { onChange(undefined); setOpen(false) }}
                style={rowStyle}
              >
                <span style={{ width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: 0.4 }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round"/>
                  </svg>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>Sem responsável</span>
              </button>
            )}

            {filtered.length === 0 && (
              <div style={{ padding: '12px 12px', fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
                Nenhum membro encontrado
              </div>
            )}

            {filtered.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => { onChange(m.id); setOpen(false) }}
                style={{
                  ...rowStyle,
                  background: m.id === value ? 'var(--accent-bg, rgba(132,204,22,0.1))' : undefined,
                }}
              >
                <MemberAvatar member={m} size={size} />
                <span style={{ fontSize: 13 }}>{m.name}</span>
                {m.cargo && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto' }}>
                    {m.cargo}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

const rowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  padding: '7px 10px',
  border: 'none',
  background: 'transparent',
  cursor: 'pointer',
  textAlign: 'left',
  color: 'var(--text)',
  transition: 'background 0.12s',
}
