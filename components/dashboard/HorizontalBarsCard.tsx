'use client'
import { useState } from 'react'

const PALETTE = [
  '#7C3AED', // roxo
  '#2563EB', // azul
  '#0891B2', // ciano
  '#059669', // verde esmeralda
  '#D97706', // âmbar
  '#DC2626', // vermelho
  '#DB2777', // rosa
  '#4F46E5', // índigo
  '#0284C7', // azul claro
  '#B45309', // laranja escuro
  '#16A34A', // verde
  '#9333EA', // violeta
]

interface Item { label: string; count: number; sub?: string; color?: string }
interface Props { title: string; items: Item[] }

export function HorizontalBarsCard({ title, items }: Props) {
  const [hov, setHov] = useState<string | null>(null)
  const max = items[0]?.count ?? 1

  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
        {title}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {items.map((item, i) => {
          const isH = hov === item.label
          const barW = (item.count / max) * 100
          const color = item.color ?? PALETTE[i % PALETTE.length]

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHov(item.label)}
              onMouseLeave={() => setHov(null)}
              style={{ opacity: hov && !isH ? 0.3 : 1, transition: 'opacity 0.2s', cursor: 'default' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <div style={{
                    width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                    transform: isH ? 'scale(1.4)' : 'scale(1)',
                    transition: 'transform 0.15s ease',
                  }} />
                  <span style={{ fontSize: 12, fontWeight: isH ? 700 : 500, color: isH ? 'var(--black)' : 'var(--gray)', transition: 'color .15s' }}>
                    {item.label}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isH && item.sub && (
                    <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, animation: 'fadeIn 0.15s ease both' }}>
                      {item.sub}
                    </span>
                  )}
                  <span style={{ fontSize: 13, fontWeight: 800, color }}>{item.count}</span>
                </div>
              </div>
              <div style={{
                height: isH ? 10 : 6, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden',
                transition: 'height 0.22s cubic-bezier(0.34,1.56,0.64,1)',
              }}>
                <div style={{
                  height: '100%', borderRadius: 100,
                  background: color,
                  width: `${barW}%`,
                  boxShadow: isH ? `0 0 12px ${color}88` : 'none',
                  transition: `width 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms, box-shadow 0.22s`,
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
