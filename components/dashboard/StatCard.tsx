'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

function useCountUp(target: number, duration = 750, delay = 0): number {
  const [val, setVal] = useState(0)
  useEffect(() => {
    setVal(0)
    if (!target) return
    if (typeof document !== 'undefined' && document.hidden) {
      const t = setTimeout(() => setVal(target), delay)
      return () => clearTimeout(t)
    }
    let raf: number
    const t = setTimeout(() => {
      let startTs = 0
      const tick = (ts: number) => {
        if (!startTs) startTs = ts
        const p = Math.min((ts - startTs) / duration, 1)
        setVal(Math.round((1 - Math.pow(1 - p, 3)) * target))
        if (p < 1) raf = requestAnimationFrame(tick)
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => { clearTimeout(t); cancelAnimationFrame(raf) }
  }, [target])
  return val
}

interface TooltipRow {
  label: string
  color?: string
  active?: boolean
}

interface StatCardProps {
  label: string
  value: number | string
  format?: (n: number) => string
  accent?: string
  sub?: string
  tooltip?: { title?: string; rows: TooltipRow[] }
  delay?: number
  index?: number
}

export function StatCard({
  label, value, format, accent = 'var(--primary)', sub, tooltip, delay = 0, index = 0,
}: StatCardProps) {
  const [hov, setHov] = useState(false)
  const [tipPos, setTipPos] = useState<{ top: number; left: number } | null>(null)
  const cardRef = useRef<HTMLDivElement>(null)
  const iconRef = useRef<HTMLSpanElement>(null)

  const isNumber = typeof value === 'number'
  const counted = useCountUp(isNumber ? value : 0, 750, index * 60 + delay)
  const display = isNumber
    ? (format ? format(counted) : String(counted))
    : String(value)

  function handleMouseEnter() {
    setHov(true)
    if (tooltip && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect()
      setTipPos({ top: rect.bottom + 8, left: rect.left + rect.width / 2 })
    }
  }

  function handleMouseLeave() {
    setHov(false)
    setTipPos(null)
  }

  return (
    <div className="animate-slide-up" style={{ animationDelay: `${index * 0.06}s`, height: '100%' }}>
      <div
        ref={cardRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          height: '100%',
          background: 'var(--white)',
          border: '1px solid var(--gray3)',
          borderLeft: `4px solid ${accent}`,
          borderRadius: 12,
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'default',
          boxSizing: 'border-box',
          transition: 'transform 0.22s ease, box-shadow 0.22s ease',
          transform: hov ? 'translateY(-4px) scale(1.01)' : 'translateY(0) scale(1)',
          boxShadow: hov
            ? `0 10px 28px rgba(0,0,0,0.10), inset 0 0 0 1px ${accent}30`
            : 'var(--shadow)',
        }}
      >
        <div style={{
          fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
          letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {label}
          {tooltip && (
            <span ref={iconRef} style={{
              width: 14, height: 14, borderRadius: '50%',
              background: 'var(--gray3)', color: 'var(--gray)',
              fontSize: 9, fontWeight: 800,
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>?</span>
          )}
        </div>

        <div style={{
          fontSize: display.length > 14 ? 20 : display.length > 10 ? 23 : 26,
          fontWeight: 800,
          color: accent,
          lineHeight: 1,
          letterSpacing: '-0.02em',
          transition: 'font-size 0.2s ease',
          wordBreak: 'break-all',
        }}>
          {display}
        </div>

        {sub && (
          <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 5, fontWeight: 500 }}>
            {sub}
          </div>
        )}
      </div>

      {/* Portal tooltip */}
      {tooltip && tipPos && typeof document !== 'undefined' && createPortal(
        <div style={{
          position: 'fixed',
          top: tipPos.top,
          left: tipPos.left,
          transform: 'translateX(-50%)',
          background: 'var(--black)',
          color: '#fff',
          borderRadius: 10,
          padding: '12px 14px',
          minWidth: 210,
          zIndex: 9999,
          boxShadow: '0 8px 28px rgba(0,0,0,0.28)',
          pointerEvents: 'none',
          animation: 'fadeIn 0.14s ease both',
        }}>
          {/* arrow */}
          <div style={{
            position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderBottom: '6px solid var(--black)',
          }} />

          {tooltip.title && (
            <div style={{
              fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.45)',
              letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8,
            }}>
              {tooltip.title}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {tooltip.rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {row.color && (
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%',
                    background: row.color, flexShrink: 0,
                  }} />
                )}
                <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,255,255,0.9)' }}>
                  {row.label}
                </span>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
