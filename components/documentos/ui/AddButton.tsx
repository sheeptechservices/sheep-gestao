import React from 'react'

interface AddButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

export function AddButton({ children, style, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...props }: AddButtonProps) {
  return (
    <button
      type="button"
      style={{
        height: 38, borderRadius: 8,
        border: '1.5px dashed var(--gray3)',
        background: 'transparent', cursor: 'pointer',
        color: 'var(--gray2)', fontSize: 12, fontWeight: 700,
        fontFamily: 'Manrope, sans-serif',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        width: '100%', transition: 'all 0.15s',
        letterSpacing: '0.01em',
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--primary)'
        e.currentTarget.style.color = 'var(--primary)'
        e.currentTarget.style.background = 'var(--primary-dim)'
        onMouseEnter?.(e)
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--gray3)'
        e.currentTarget.style.color = 'var(--gray2)'
        e.currentTarget.style.background = 'transparent'
        onMouseLeave?.(e)
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'scale(0.98)'
        onMouseDown?.(e)
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'none'
        onMouseUp?.(e)
      }}
      {...props}
    >
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {children}
    </button>
  )
}
