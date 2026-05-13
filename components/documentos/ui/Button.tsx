import React from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger'
}

export function Button({ variant = 'primary', children, style, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...props }: ButtonProps) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 18px', borderRadius: 100, fontSize: 13, fontWeight: 700,
    cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
    letterSpacing: '0.01em', transition: 'all 0.15s',
    border: 'none',
  }
  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: 'var(--primary)', color: 'var(--black)',
      border: 'none',
    },
    ghost: {
      background: 'transparent', color: 'var(--gray2)',
      border: '1px solid var(--gray3)',
    },
    danger: {
      background: 'var(--red)', color: '#fff',
      border: 'none',
    },
  }
  return (
    <button
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={e => {
        if (variant === 'primary') { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }
        if (variant === 'ghost') { e.currentTarget.style.color = 'var(--black)'; e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.background = 'var(--bg)' }
        if (variant === 'danger') { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)' }
        onMouseEnter?.(e)
      }}
      onMouseLeave={e => {
        if (variant === 'primary') { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }
        if (variant === 'ghost') { e.currentTarget.style.color = 'var(--gray2)'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.background = 'transparent' }
        if (variant === 'danger') { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none' }
        onMouseLeave?.(e)
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'scale(0.97)'
        onMouseDown?.(e)
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = variant === 'ghost' ? 'none' : 'translateY(-1px)'
        onMouseUp?.(e)
      }}
      {...props}
    >
      {children}
    </button>
  )
}
