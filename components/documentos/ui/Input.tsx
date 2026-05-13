import React, { useRef } from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  hint?: string
  error?: string
}

export function Input({ label, hint, error, id, className, style, onFocus, onBlur, onMouseEnter, onMouseLeave, ...props }: InputProps) {
  const focused = useRef(false)
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label
          htmlFor={inputId}
          style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--gray2)', display: 'block',
          }}
        >
          {label}
          {hint && <span style={{ marginLeft: 6, fontWeight: 500, letterSpacing: 0, textTransform: 'none', fontSize: 10, color: 'var(--gray2)', opacity: 0.7 }}>{hint}</span>}
        </label>
      )}
      <input
        id={inputId}
        className={`docs-input${className ? ` ${className}` : ''}`}
        style={{
          height: 38, borderRadius: 8,
          border: `1px solid ${error ? 'var(--red)' : 'var(--gray3)'}`,
          background: 'var(--bg)', padding: '0 10px',
          fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
          color: 'var(--black)', outline: 'none', width: '100%',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          boxSizing: 'border-box',
          ...style,
        }}
        onFocus={e => {
          focused.current = true
          e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--primary)'
          e.currentTarget.style.boxShadow = error ? '0 0 0 3px rgba(239,68,68,0.12)' : '0 0 0 3px var(--primary-dim)'
          onFocus?.(e)
        }}
        onBlur={e => {
          focused.current = false
          e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--gray3)'
          e.currentTarget.style.boxShadow = 'none'
          onBlur?.(e)
        }}
        onMouseEnter={e => {
          if (!focused.current) e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--gray2)'
          onMouseEnter?.(e)
        }}
        onMouseLeave={e => {
          if (!focused.current) e.currentTarget.style.borderColor = error ? 'var(--red)' : 'var(--gray3)'
          onMouseLeave?.(e)
        }}
        {...props}
      />
      {error && <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>{error}</span>}
    </div>
  )
}
