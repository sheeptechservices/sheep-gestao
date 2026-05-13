import React, { useRef } from 'react'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  hint?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({ label, hint, error, id, options, style, onFocus, onBlur, onMouseEnter, onMouseLeave, ...props }: SelectProps) {
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
      <div style={{ position: 'relative' }}>
        <select
          id={inputId}
          style={{
            height: 38, borderRadius: 8,
            border: `1px solid ${error ? 'var(--red)' : 'var(--gray3)'}`,
            background: 'var(--bg)',
            padding: '0 32px 0 10px',
            fontSize: 13, fontFamily: 'inherit', fontWeight: 500,
            color: 'var(--black)', outline: 'none', width: '100%',
            appearance: 'none',
            WebkitAppearance: 'none',
            MozAppearance: 'none',
            transition: 'border-color 0.15s, box-shadow 0.15s',
            cursor: 'pointer',
            ...style,
          } as React.CSSProperties}
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
        >
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {/* Custom chevron */}
        <svg
          width="14" height="14" viewBox="0 0 14 14" fill="none"
          style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--gray2)' }}
        >
          <path d="M3 5l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      {error && <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 500 }}>{error}</span>}
    </div>
  )
}
