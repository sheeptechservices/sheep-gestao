'use client'
import type { TeamMember } from '@/lib/types'

interface Props {
  member: Pick<TeamMember, 'name' | 'photo_url' | 'color_hex'>
  size?: number
  className?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('')
}

export function MemberAvatar({ member, size = 28, className = '' }: Props) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: size * 0.36,
    fontWeight: 600,
    background: member.color_hex,
    color: '#fff',
    overflow: 'hidden',
    userSelect: 'none',
  }

  if (member.photo_url) {
    return (
      <span
        style={{ ...style, background: 'transparent' }}
        className={className}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={member.photo_url}
          alt={member.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </span>
    )
  }

  return (
    <span style={style} className={className} title={member.name}>
      {initials(member.name)}
    </span>
  )
}
