import React from 'react'

interface FormSectionProps {
  title: string
  description?: string
  action?: React.ReactNode
  children?: React.ReactNode
  style?: React.CSSProperties
}

export function FormSection({ title, description, action, children, style }: FormSectionProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...style }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--gray3)', paddingBottom: 6,
      }}>
        <div>
          <div style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
            textTransform: 'uppercase', color: 'var(--gray2)',
          }}>
            {title}
          </div>
          {description && (
            <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 2, fontWeight: 500, opacity: 0.8, textTransform: 'none', letterSpacing: 0 }}>
              {description}
            </div>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>
      {children}
    </div>
  )
}
