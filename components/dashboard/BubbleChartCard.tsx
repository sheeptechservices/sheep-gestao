'use client'
import { useState } from 'react'

interface Item { label: string; count: number }
interface Props { title: string; items: Item[] }

const COLOR     = 'var(--primary)'
const MAX_R     = 54
const MIN_R     = 22
const GAP       = 16
const SVG_H     = MAX_R * 2 + 36

function shortLabel(label: string) {
  const parts = label.split(' ')
  if (parts.length === 1) return label
  // "Guilherme Zaidan" → "G. Zaidan", "Ana P." → "Ana P."
  if (parts[1]?.endsWith('.')) return label          // already short
  return `${parts[0][0]}. ${parts[1]}`
}

export function BubbleChartCard({ title, items }: Props) {
  const [hov, setHov] = useState<string | null>(null)

  const maxCount = Math.max(...items.map(i => i.count))

  const bubbles = items.map(item => ({
    ...item,
    r: MIN_R + (MAX_R - MIN_R) * Math.sqrt(item.count / maxCount),
  }))

  // total SVG width: sum of diameters + gaps
  const totalW = bubbles.reduce((s, b) => s + b.r * 2, 0) + GAP * (bubbles.length - 1)

  // x centers
  let cx = 0
  const positioned = bubbles.map(b => {
    const x = cx + b.r
    cx += b.r * 2 + GAP
    return { ...b, cx: x }
  })

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{
        fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
        letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 18,
      }}>
        {title}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <svg
          width={totalW}
          height={SVG_H}
          viewBox={`0 0 ${totalW} ${SVG_H}`}
          style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}
        >
          {positioned.map((b, i) => {
            const isH  = hov === b.label
            const r    = isH ? b.r + 4 : b.r
            const fill = isH ? `${COLOR}28` : `${COLOR}14`
            const stroke = isH ? COLOR : `${COLOR}99`
            const sw   = isH ? 2 : 1.5

            return (
              <g
                key={b.label}
                style={{ cursor: 'default', transition: 'opacity 0.2s' }}
                opacity={hov && !isH ? 0.3 : 1}
                onMouseEnter={() => setHov(b.label)}
                onMouseLeave={() => setHov(null)}
              >
                <circle
                  cx={b.cx} cy={MAX_R} r={r}
                  fill={fill} stroke={stroke} strokeWidth={sw}
                  style={{ transition: 'r 0.22s cubic-bezier(0.34,1.56,0.64,1), fill 0.18s, stroke 0.18s' }}
                />
                {/* count */}
                <text
                  x={b.cx} y={MAX_R}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize={b.r > 38 ? 16 : 13} fontWeight={800}
                  fill={COLOR}
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  {b.count}
                </text>
                {/* label */}
                <text
                  x={b.cx} y={MAX_R + r + 13}
                  textAnchor="middle"
                  fontSize={10} fontWeight={isH ? 700 : 500}
                  fill={isH ? 'var(--black)' : 'var(--gray)'}
                  style={{ pointerEvents: 'none', userSelect: 'none', transition: 'font-weight 0.15s' }}
                >
                  {shortLabel(b.label)}
                </text>
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}
