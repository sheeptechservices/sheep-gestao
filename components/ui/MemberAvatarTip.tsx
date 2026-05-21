'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { TeamMember } from '@/lib/types'
import { MemberAvatar } from './MemberAvatar'

interface Props {
  member: TeamMember
  size?: number
}

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(w => w[0].toUpperCase()).join('')
}

const SENIOR_LABEL: Record<string, string> = {
  junior:   'Júnior',
  pleno:    'Pleno',
  senior:   'Sênior',
  lead:     'Lead',
  director: 'Diretor',
}

export function MemberAvatarTip({ member, size = 26 }: Props) {
  const [hov,     setHov]     = useState(false)
  const [mounted, setMounted] = useState(false)
  const [pos,     setPos]     = useState<{ top: number; left: number } | null>(null)
  const ref     = useRef<HTMLDivElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  function show() {
    if (timerRef.current) clearTimeout(timerRef.current)
    if (ref.current) {
      const r = ref.current.getBoundingClientRect()
      // prefer showing above, fallback below
      setPos({ top: r.top - 8, left: r.left + r.width / 2 })
    }
    setHov(true)
  }

  function hide() {
    timerRef.current = setTimeout(() => setHov(false), 80)
  }

  const tooltip = mounted && hov && pos ? createPortal(
    <div
      onMouseEnter={() => { if (timerRef.current) clearTimeout(timerRef.current) }}
      onMouseLeave={hide}
      style={{
        position: 'fixed',
        // place the tip above the avatar, centred horizontally
        top: pos.top,
        left: pos.left,
        transform: 'translate(-50%, -100%)',
        zIndex: 99999,
        background: 'var(--white)',
        border: '1px solid var(--gray3)',
        borderRadius: 12,
        boxShadow: '0 8px 28px rgba(0,0,0,0.13)',
        padding: '10px 14px 10px 10px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        pointerEvents: 'auto',
        animation: 'panelUp 0.16s ease both',
        whiteSpace: 'nowrap',
        minWidth: 160,
      }}
    >
      {/* Caret */}
      <div style={{
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 10,
        height: 6,
        overflow: 'hidden',
      }}>
        <div style={{
          width: 10,
          height: 10,
          background: 'var(--white)',
          border: '1px solid var(--gray3)',
          transform: 'rotate(45deg) translateY(-6px)',
          transformOrigin: 'center',
          boxShadow: '1px 1px 3px rgba(0,0,0,0.07)',
        }} />
      </div>

      {/* Avatar grande */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: member.color_hex,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
        boxShadow: `0 0 0 2px ${member.color_hex}40`,
      }}>
        {member.photo_url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={member.photo_url} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials(member.name)
        }
      </div>

      {/* Info */}
      <div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', lineHeight: 1.3 }}>
          {member.name}
        </div>
        {(member.cargo || member.papel_principal) && (
          <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, marginTop: 2 }}>
            {member.papel_principal || member.cargo}
          </div>
        )}
        {member.senioridade && (
          <div style={{
            display: 'inline-block', marginTop: 4,
            fontSize: 10, fontWeight: 700,
            color: member.color_hex,
            background: member.color_hex + '18',
            padding: '1px 7px', borderRadius: 100,
          }}>
            {SENIOR_LABEL[member.senioridade] ?? member.senioridade}
          </div>
        )}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <>
      <div
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          display: 'flex',
          alignItems: 'center',
          borderRadius: '50%',
          transition: 'box-shadow 0.15s, transform 0.15s',
          boxShadow: hov ? `0 0 0 3px ${member.color_hex}55, 0 2px 8px rgba(0,0,0,0.15)` : 'none',
          transform: hov ? 'scale(1.15)' : 'scale(1)',
          cursor: 'default',
          zIndex: hov ? 10 : 'auto',
          position: 'relative',
        }}
      >
        <MemberAvatar member={member} size={size} />
      </div>
      {tooltip}
    </>
  )
}
