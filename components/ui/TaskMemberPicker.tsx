'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatarTip } from './MemberAvatarTip'
import { MemberAvatar } from './MemberAvatar'

interface Props {
  memberIds: string[]
  onChange: (ids: string[]) => void
  size?: number  // avatar size (default 16)
}

export function TaskMemberPicker({ memberIds, onChange, size = 16 }: Props) {
  const { members, fetchMembers } = useTeamStore()
  const [open,    setOpen]    = useState(false)
  const [pos,     setPos]     = useState<{ top?: number; bottom?: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (members.length === 0) fetchMembers() }, []) // eslint-disable-line

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const assignedMembers = memberIds
    .map(id => members.find(m => m.id === id))
    .filter(Boolean) as typeof members
  const active = members.filter(m => m.status === 'active')

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && ref.current) {
      const r     = ref.current.getBoundingClientRect()
      const dropH = Math.min(active.length * 34 + (memberIds.length > 0 ? 34 : 0) + 12, 260)
      const below = window.innerHeight - r.bottom - 8
      const above = r.top - 8
      if (below >= dropH || below >= above) {
        setPos({ top: r.bottom + 4, left: r.left })
      } else {
        setPos({ bottom: window.innerHeight - r.top + 4, left: r.left })
      }
    }
    setOpen(o => !o)
  }

  function toggle(id: string) {
    if (memberIds.includes(id)) {
      onChange(memberIds.filter(m => m !== id))
    } else {
      onChange([...memberIds, id])
    }
  }

  const dropdown = mounted && open && pos ? createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left,
        zIndex: 10000, background: 'var(--white)', border: '1px solid var(--gray3)',
        borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        minWidth: 190, overflow: 'hidden', animation: 'panelUp 0.15s ease both',
      }}
    >
      {memberIds.length > 0 && (
        <div
          onClick={() => { onChange([]); setOpen(false) }}
          style={{ padding: '7px 10px', fontSize: 11, color: 'var(--gray2)', cursor: 'pointer', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
          Limpar seleção
        </div>
      )}
      {active.map(m => {
        const selected = memberIds.includes(m.id)
        return (
          <div
            key={m.id}
            onClick={() => toggle(m.id)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', background: selected ? 'var(--primary-dim)' : 'transparent' }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--primary-dim)'}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = selected ? 'var(--primary-dim)' : 'transparent'}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 3, flexShrink: 0,
              border: selected ? '2px solid var(--primary-text)' : '1.5px solid var(--gray2)',
              background: selected ? 'var(--primary-text)' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.12s',
            }}>
              {selected && (
                <svg width={8} height={8} viewBox="0 0 9 9" fill="none">
                  <path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <MemberAvatar member={m} size={20} />
            <span style={{ fontSize: 12, fontWeight: selected ? 700 : 500, color: 'var(--black)', flex: 1 }}>
              {m.name}
            </span>
          </div>
        )
      })}
    </div>,
    document.body
  ) : null

  return (
    <div
      ref={ref}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
      onClick={e => e.stopPropagation()}
    >
      {/* Stacked avatars */}
      {assignedMembers.map((m, i) => (
        <span key={m.id} style={{ marginLeft: i > 0 ? -5 : 0, display: 'inline-flex' }}>
          <MemberAvatarTip member={m} size={size} />
        </span>
      ))}
      {/* "+" circle */}
      <div
        onClick={handleClick}
        title="Atribuir responsáveis"
        style={{
          width: size, height: size, borderRadius: '50%',
          marginLeft: assignedMembers.length > 0 ? -3 : 0,
          border: '1.5px dashed var(--gray3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'var(--gray3)', transition: 'all 0.15s',
          background: 'var(--white)', flexShrink: 0,
        }}
        onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--gray)'; el.style.color = 'var(--gray)' }}
        onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--gray3)'; el.style.color = 'var(--gray3)' }}
      >
        <svg width={7} height={7} viewBox="0 0 7 7" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round">
          <path d="M3.5 1v5M1 3.5h5"/>
        </svg>
      </div>
      {dropdown}
    </div>
  )
}
