'use client'
import { useState, useMemo } from 'react'
import type { Client } from '@/lib/types'

// Paleta de cores para segmentos (cicla se houver mais de 9)
const PALETTE = [
  '#6366F1', // Indigo
  '#F59E0B', // Amber
  '#10B981', // Emerald
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#0EA5E9', // Sky
  '#84CC16', // Lime
]

interface Slice {
  key: string
  label: string
  color: string
  count: number
  drawLen: number
  offset: number
  pct: string
}

export function SegmentDonut({ clients }: { clients: Client[] }) {
  const [hov, setHov] = useState<string | null>(null)

  const slices = useMemo<Slice[]>(() => {
    const map = new Map<string, number>()
    for (const c of clients) {
      const seg = c.segmento?.trim() || 'Sem segmento'
      map.set(seg, (map.get(seg) ?? 0) + 1)
    }

    const entries = Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])  // maiores primeiro

    const total = clients.length
    const r     = 38
    const circ  = 2 * Math.PI * r
    const gap   = 3

    let cum = 0
    return entries.map(([label, count], i) => {
      const len     = (count / total) * circ
      const drawLen = entries.length > 1 ? Math.max(len - gap, 0.1) : len
      const offset  = circ * 0.25 - cum
      cum += len
      return {
        key:     label,
        label,
        color:   PALETTE[i % PALETTE.length],
        count,
        drawLen,
        offset,
        pct: ((count / total) * 100).toFixed(0),
      }
    })
  }, [clients])

  const total    = clients.length
  const hovSlice = hov ? slices.find(s => s.key === hov) ?? null : null

  const r    = 38
  const circ = 2 * Math.PI * r
  const SW   = 14
  const SWH  = 19

  return (
    <div style={{
      background: 'var(--white)', border: '1px solid var(--gray3)',
      borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow)',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4,
      }}>
        Segmentos de clientes
      </div>
      <div style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500, marginBottom: 20 }}>
        {total} cliente{total !== 1 ? 's' : ''} · {slices.filter(s => s.key !== 'Sem segmento').length} segmento{slices.filter(s => s.key !== 'Sem segmento').length !== 1 ? 's' : ''}
      </div>

      {total === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'var(--bg)', borderRadius: 8, padding: '32px 0',
        }}>
          <div style={{ fontSize: 28 }}>🏷️</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray2)' }}>Nenhum cliente cadastrado</div>
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
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
                  strokeWidth={hov === s.key ? SWH : SW}
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

            {/* Centro */}
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
                  <div style={{ fontSize: 10, color: hovSlice.color, fontWeight: 700, opacity: 0.8 }}>
                    {hovSlice.pct}%
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--black)', lineHeight: 1 }}>
                    {total}
                  </div>
                  <div style={{ fontSize: 9, color: 'var(--gray2)', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    clientes
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Legenda */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 9, overflow: 'hidden' }}>
            {slices.map(s => (
              <div
                key={s.key}
                onMouseEnter={() => setHov(s.key)}
                onMouseLeave={() => setHov(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  opacity: hov && hov !== s.key ? 0.28 : 1,
                  transition: 'opacity 0.2s',
                  cursor: 'default',
                }}
              >
                <div style={{
                  width: 9, height: 9, borderRadius: '50%',
                  background: s.color, flexShrink: 0,
                  transform: hov === s.key ? 'scale(1.5)' : 'scale(1)',
                  transition: 'transform 0.15s ease',
                }} />
                <span style={{
                  fontSize: 12, color: 'var(--gray)', flex: 1, fontWeight: 500,
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {s.label}
                </span>
                <span style={{ fontSize: 13, fontWeight: 800, color: s.color, flexShrink: 0 }}>
                  {s.count}
                </span>
                <span style={{ fontSize: 11, color: 'var(--gray2)', minWidth: 30, textAlign: 'right', fontWeight: 600, flexShrink: 0 }}>
                  {s.pct}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
