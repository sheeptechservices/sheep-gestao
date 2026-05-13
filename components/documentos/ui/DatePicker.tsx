import React from 'react'
import { AppDatePicker } from '@/components/ui/AppDatePicker'

interface DatePickerProps {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
  clearable?: boolean
}

export function DatePicker({ label, hint, value, onChange, clearable }: DatePickerProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{
          fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
          textTransform: 'uppercase', color: 'var(--gray2)', display: 'block',
        }}>
          {label}
          {hint && (
            <span style={{ marginLeft: 6, fontWeight: 500, letterSpacing: 0, textTransform: 'none', fontSize: 10, opacity: 0.7 }}>
              {hint}
            </span>
          )}
        </label>
      )}
      <AppDatePicker
        value={value}
        onChange={onChange}
        clearable={clearable}
      />
    </div>
  )
}
