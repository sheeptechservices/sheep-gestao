'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
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

// gap between avatar top-edge and tooltip bottom-edge
const GAP = 6

export function MemberAvatarTip({ member, size = 26 }: Props) {
  const [hov,     setHov]     = useState(false)
  const [mounted, setMounted] = useState(false)
  // anchorX = horizontal center of the avatar (viewport px)
  // anchorY = top of the avatar (viewport px)
  const [anchor,  setAnchor]  = useState<{ x: number; y: number } | null>(null)
  const avatarRef  = useRef<HTMLDivElement>(null)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const clearHide = () => { if (hideTimer.current) clearTimeout(hideTimer.current) }

  const show = useCallback(() => {
    clearHide()
    if (avatarRef.current) {
      const r = avatarRef.current.getBoundingClientRect()
      setAnchor({ x: r.left + r.width / 2, y: r.top })
    }
    setHov(true)
  }, [])

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => setHov(false), 80)
  }, [])

  // ── Tooltip ────────────────────────────────────────────────────────────────
  const tooltip = mounted && hov && anchor ? createPortal(
    <div
      onMouseEnter={clearHide}
      onMouseLeave={hide}
      style={{
        position:   'fixed',
        // Place the tooltip so its bottom sits GAP px above the avatar top.
        // We don't know height at render time, so we set top=anchorY and
        // shift up 100% + GAP using calc.
        top:        anchor.y,
        left:       anchor.x,
        transform:  `translate(-50%, calc(-100% - ${GAP}px))`,
        zIndex:     99999,
        background: 'var(--white)',
        border:     '1px solid var(--gray3)',
        borderRadius: 12,
        boxShadow:  '0 6px 24px rgba(0,0,0,0.13)',
        padding:    '10px 14px 10px 10px',
        display:    'flex',
        alignItems: 'center',
        gap:        10,
        pointerEvents: 'auto',
        animation:  'panelUp 0.16s ease both',
        whiteSpace: 'nowrap',
        minWidth:   140,
      }}
    >
      {/* Down-pointing caret — centred on anchor.x */}
      {/* Two triangles: outer (border color) + inner (white) */}
      <div style={{
        position: 'absolute',
        bottom: -7,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft:  '7px solid transparent',
        borderRight: '7px solid transparent',
        borderTop:   '7px solid var(--gray3)',
      }} />
      <div style={{
        position: 'absolute',
        bottom: -6,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0, height: 0,
        borderLeft:  '6px solid transparent',
        borderRight: '6px solid transparent',
        borderTop:   '6px solid var(--white)',
      }} />

      {/* Avatar grande */}
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: member.color_hex,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 14, fontWeight: 700, color: '#fff',
        boxShadow: `0 0 0 2px ${member.color_hex}45`,
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

  // ── Avatar + ring ──────────────────────────────────────────────────────────
  return (
    <>
      <div
        ref={avatarRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          justifyContent: 'center',
          width:        size,
          height:       size,
          borderRadius: '50%',
          flexShrink:   0,
          transition:   'box-shadow 0.15s, transform 0.15s',
          boxShadow:    hov ? `0 0 0 3px ${member.color_hex}55, 0 2px 8px rgba(0,0,0,0.15)` : 'none',
          transform:    hov ? 'scale(1.15)' : 'scale(1)',
          cursor:       'default',
          position:     'relative',
          zIndex:       hov ? 10 : undefined,
        }}
      >
        <MemberAvatar member={member} size={size} />
      </div>
      {tooltip}
    </>
  )
}
