'use client'
import { useState, useRef, useLayoutEffect, useCallback, useEffect } from 'react'
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

const GAP = 8 // px gap between tooltip bottom and avatar top

export function MemberAvatarTip({ member, size = 26 }: Props) {
  const [hov,     setHov]     = useState(false)
  const [mounted, setMounted] = useState(false)
  // Raw anchor captured on mouseEnter (center-x and top-y of the avatar)
  const [anchor, setAnchor] = useState<{ x: number; y: number } | null>(null)
  // Final pixel position calculated after the tooltip renders and is measured
  const [pos,    setPos]    = useState<{ top: number; left: number } | null>(null)

  const avatarRef  = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const hideTimer  = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setMounted(true) }, [])

  const clearHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
  }, [])

  const show = useCallback(() => {
    clearHide()
    if (avatarRef.current) {
      const r = avatarRef.current.getBoundingClientRect()
      // Use the exact pixel center of the avatar
      setAnchor({ x: Math.round(r.left + r.width / 2), y: Math.round(r.top) })
    }
    setHov(true)
  }, [clearHide])

  const hide = useCallback(() => {
    hideTimer.current = setTimeout(() => { setHov(false); setPos(null) }, 80)
  }, [])

  // After the tooltip renders (invisible), measure its exact size and pin it.
  useLayoutEffect(() => {
    if (!hov || !anchor || !tooltipRef.current) { setPos(null); return }
    const tw = tooltipRef.current.offsetWidth
    const th = tooltipRef.current.offsetHeight
    const vw = window.innerWidth

    let left = anchor.x - Math.round(tw / 2)   // centered on avatar
    let top  = anchor.y - th - GAP              // above the avatar

    // clamp horizontally inside the viewport
    left = Math.max(8, Math.min(left, vw - tw - 8))
    // if no space above, flip below
    if (top < 8) top = anchor.y + size + GAP

    setPos({ top, left })
  }, [hov, anchor, size])

  // ── Tooltip ────────────────────────────────────────────────────────────────
  const tooltip = mounted && hov && anchor ? createPortal(
    <div
      ref={tooltipRef}
      onMouseEnter={clearHide}
      onMouseLeave={hide}
      style={{
        position:   'fixed',
        top:        pos?.top  ?? anchor.y,
        left:       pos?.left ?? anchor.x,
        opacity:    pos ? 1 : 0,           // invisible until measured & placed
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
        animation:  pos ? 'panelUp 0.16s ease both' : 'none',
        whiteSpace: 'nowrap',
        minWidth:   140,
        transition: 'opacity 0.08s',
      }}
    >
      {/* Caret: two triangles (outer = border, inner = white) */}
      {pos && (() => {
        const caretX = anchor.x - pos.left  // offset of avatar center within tooltip
        const isAbove = pos.top < anchor.y  // tooltip is above the avatar
        return isAbove ? (
          <>
            <div style={{ position: 'absolute', bottom: -7, left: caretX, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderTop: '7px solid var(--gray3)' }} />
            <div style={{ position: 'absolute', bottom: -6, left: caretX, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderTop: '6px solid var(--white)' }} />
          </>
        ) : (
          <>
            <div style={{ position: 'absolute', top: -7, left: caretX, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '7px solid transparent', borderRight: '7px solid transparent', borderBottom: '7px solid var(--gray3)' }} />
            <div style={{ position: 'absolute', top: -6, left: caretX, transform: 'translateX(-50%)', width: 0, height: 0, borderLeft: '6px solid transparent', borderRight: '6px solid transparent', borderBottom: '6px solid var(--white)' }} />
          </>
        )
      })()}

      {/* Avatar grande */}
      <div style={{
        width: 36, height: 36, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: member.color_hex,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, fontWeight: 700, color: '#fff',
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
          flexShrink:   0,
          borderRadius: '50%',
          transition:   'box-shadow 0.15s, transform 0.15s',
          boxShadow:    hov ? `0 0 0 3px ${member.color_hex}55, 0 2px 8px rgba(0,0,0,0.15)` : 'none',
          transform:    hov ? 'scale(1.12)' : 'scale(1)',
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
