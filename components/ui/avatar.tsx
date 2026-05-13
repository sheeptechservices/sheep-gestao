/* eslint-disable @next/next/no-img-element */
import { initials } from '@/lib/utils'

interface AvatarProps {
  name?: string
  src?: string | null
  size?: number
}

export function Avatar({ name, src, size = 34 }: AvatarProps) {
  if (src) {
    return (
      <img src={src} alt={name ?? ''} style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover' }} />
    )
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'var(--primary)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.35, fontWeight: 800,
      color: 'var(--primary-contrast)',
      flexShrink: 0, userSelect: 'none',
    }}>
      {name ? initials(name) : '?'}
    </div>
  )
}
