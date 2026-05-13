'use client'
import { useState } from 'react'
import type { Project } from '@/lib/types'

const STATUS_CONFIG = {
  active:    { label: 'Em andamento', color: '#FFB400'         },
  completed: { label: 'Finalizado',   color: 'var(--green)'   },
  paused:    { label: 'Pausado',      color: '#8B5CF6'        },
  cancelled: { label: 'Cancelado',    color: 'var(--red)'     },
} as const

interface Slice {
  key: string
  label: string
  color: string
  count: number
  drawLen: number
  offset: number
  pct: string
}

export function ProjectDonut({ projects }: { projects: Project[] }) {
  const [hov, setHov] = useState<string | null>(null)

  const total = projects.length
  if (total === 0) return null

  const r = 38
  const circ = 2 * Math.PI * r
  const SW = 14
  const SW_HOV = 19
  const gapLen = 3

  const counts: Record<string, number> = { active: 0, completed: 0, paused: 0 }
  for (const p of projects) counts[p.status] = (counts[p.status] ?? 0) + 1

  const entries = (Object.keys(STATUS_CONFIG) as (keyof typeof STATUS_CONFIG)[])
    .filter(k => counts[k] > 0)
    .map(k => ({ key: k, label: STATUS_CONFIG[k].label, color: STATUS_CONFIG[k].color, count: counts[k] }))

  let cum = 0
  const slices: Slice[] = entries.map(e => {
    const len = (e.count / total) * circ
    const drawLen = entries.length > 1 ? Math.max(len - gapLen, 0.1) : len
    const offset = circ * 0.25 - cum
    cum += len
    return { ...e, drawLen, offset, pct: ((e.count / total) * 100).toFixed(0) }
  })

  const hovSlice = hov ? slices.find(s => s.key === hov) ?? null : null

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
      {/* Donut SVG */}
      <div style={{ position: 'relative', width: 130, height: 130, flexShrink: 0 }}>
        <svg width="130" height="130" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r={r} fill="none" stroke="var(--gray3)" strokeWidth={SW} />
          {slices.map(s => (
            <circle
              key={s.key}
              cx="50" cy="50" r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={hov === s.key ? SW_HOV : SW}
              strokeDasharray={`${s.drawLen} ${circ - s.drawLen}`}
              strokeDashoffset={s.offset}
              style={{
                transition: 'opacity 0.22s ease, stroke-width 0.2s ease',
                opacity: hov && hov !== s.key ? 0.22 : 1,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHov(s.key)}
              onMouseLeave={() => setHov(null)}
            />
          ))}
        </svg>

        {/* Center label */}
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          {hovSlice ? (
            <>
              <div style={{ fontSize: 22, fontWeight: 800, color: hovSlice.color, lineHeight: 1 }}>
                {hovSlice.count}
              </div>
              <div style={{ fontSize: 10, color: hovSlice.color, fontWeight: 700, opacity: 0.75 }}>
                {hovSlice.pct}%
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--black)', lineHeight: 1 }}>
                {total}
              </div>
              <div style={{ fontSize: 9, color: 'var(--gray2)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                projetos
              </div>
            </>
          )}
        </div>
      </div>

      {/* Legend */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {slices.map(s => (
          <div
            key={s.key}
            onMouseEnter={() => setHov(s.key)}
            onMouseLeave={() => setHov(null)}
            style={{
              display: 'flex', alignItems: 'center', gap: 9,
              opacity: hov && hov !== s.key ? 0.28 : 1,
              transition: 'opacity 0.2s',
              cursor: 'default',
            }}
          >
            <div style={{
              width: 9, height: 9, borderRadius: '50%',
              background: s.color,
              flexShrink: 0,
              transform: hov === s.key ? 'scale(1.5)' : 'scale(1)',
              transition: 'transform 0.15s ease',
            }} />
            <span style={{ fontSize: 12, color: 'var(--gray)', flex: 1, fontWeight: 500 }}>
              {s.label}
            </span>
            <span style={{ fontSize: 14, fontWeight: 800, color: s.color }}>
              {s.count}
            </span>
            <span style={{ fontSize: 11, color: 'var(--gray2)', minWidth: 32, textAlign: 'right', fontWeight: 600 }}>
              {s.pct}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
