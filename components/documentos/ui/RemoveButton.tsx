import React from 'react'

interface RemoveButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Extra top offset for alignment when inside a label+input group */
  offsetTop?: number
}

export function RemoveButton({ offsetTop = 0, style, onMouseEnter, onMouseLeave, onMouseDown, onMouseUp, ...props }: RemoveButtonProps) {
  return (
    <button
      type="button"
      title="Remover"
      style={{
        flexShrink: 0,
        marginTop: offsetTop,
        width: 34, height: 34,
        borderRadius: 8,
        border: '1px solid var(--gray3)',
        background: 'transparent',
        cursor: 'pointer',
        color: 'var(--gray2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s',
        padding: 0,
        ...style,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--red)'
        e.currentTarget.style.color = 'var(--red)'
        e.currentTarget.style.background = 'rgba(239,68,68,0.06)'
        onMouseEnter?.(e)
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--gray3)'
        e.currentTarget.style.color = 'var(--gray2)'
        e.currentTarget.style.background = 'transparent'
        onMouseLeave?.(e)
      }}
      onMouseDown={e => {
        e.currentTarget.style.transform = 'scale(0.92)'
        onMouseDown?.(e)
      }}
      onMouseUp={e => {
        e.currentTarget.style.transform = 'none'
        onMouseUp?.(e)
      }}
      {...props}
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    </button>
  )
}
