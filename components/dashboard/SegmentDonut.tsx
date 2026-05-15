'use client'
import { useState, useMemo } from 'react'
import type { Client } from '@/lib/types'

const PALETTE = [
  '#6366F1', '#F59E0B', '#10B981', '#EC4899',
  '#14B8A6', '#8B5CF6', '#F97316', '#0EA5E9', '#84CC16',
]

export function SegmentDonut({ clients }: { clients: Client[] }) {
  const [hov, setHov] = useState<string | null>(null)

  const items = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of clients) {
      const seg = c.segmento?.trim() || 'Sem segmento'
      map.set(seg, (map.get(seg) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
  }, [clients])

  const total = clients.length
  const max   = items[0]?.count ?? 1

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
        {total} cliente{total !== 1 ? 's' : ''}
        {items.length > 0 && ` · ${items.filter(i => i.label !== 'Sem segmento').length} segmento${items.filter(i => i.label !== 'Sem segmento').length !== 1 ? 's' : ''}`}
      </div>

      {items.length === 0 ? (
        <div style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8,
          background: 'var(--bg)', borderRadius: 8, padding: '40px 0',
        }}>
          <div style={{ fontSize: 28 }}>🏷️</div>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--gray2)' }}>Nenhum cliente cadastrado</div>
          <div style={{ fontSize: 11, color: 'var(--gray2)' }}>Adicione o campo <strong>Segmento</strong> nos clientes</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {items.map((item, i) => {
            const isH   = hov === item.label
            const color = PALETTE[i % PALETTE.length]
            const barW  = (item.count / max) * 100
            const pct   = ((item.count / total) * 100).toFixed(0)

            return (
              <div
                key={item.label}
                onMouseEnter={() => setHov(item.label)}
                onMouseLeave={() => setHov(null)}
                style={{ opacity: hov && !isH ? 0.3 : 1, transition: 'opacity 0.2s', cursor: 'default' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0,
                      transform: isH ? 'scale(1.4)' : 'scale(1)', transition: 'transform 0.15s ease',
                    }} />
                    <span style={{
                      fontSize: 12, fontWeight: isH ? 700 : 500,
                      color: isH ? 'var(--black)' : 'var(--gray)',
                      transition: 'color .15s',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {item.label}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 8 }}>
                    {isH && (
                      <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600, animation: 'fadeIn .15s ease both' }}>
                        {pct}%
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
                    height: '100%', borderRadius: 100, background: color,
                    width: `${barW}%`,
                    boxShadow: isH ? `0 0 12px ${color}88` : 'none',
                    transition: `width 0.55s cubic-bezier(0.4,0,0.2,1) ${i * 60}ms, box-shadow 0.22s`,
                  }} />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
