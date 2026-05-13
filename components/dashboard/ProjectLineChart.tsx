'use client'
import { useState, useMemo } from 'react'
import type { Project } from '@/lib/types'
import { useSettings } from '@/stores/settingsStore'

const MONTHS_PT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function buildMonthlyData(projects: Project[], nMonths = 10) {
  const now = new Date()
  const months: { label: string; key: string; count: number }[] = []

  for (let i = nMonths - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    months.push({ label: MONTHS_PT[d.getMonth()], key, count: 0 })
  }

  for (const p of projects) {
    const key = p.created_at.slice(0, 7)
    const slot = months.find(m => m.key === key)
    if (slot) slot.count++
  }

  return months
}

// smooth bezier path through points
function smoothPath(pts: { x: number; y: number }[]): string {
  if (pts.length < 2) return ''
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1]
    const curr = pts[i]
    const cpx = (prev.x + curr.x) / 2
    d += ` C ${cpx} ${prev.y} ${cpx} ${curr.y} ${curr.x} ${curr.y}`
  }
  return d
}

interface ProjectLineChartProps {
  projects: Project[]
}

export function ProjectLineChart({ projects }: ProjectLineChartProps) {
  const [hovIdx, setHovIdx] = useState<number | null>(null)
  const primaryColor = useSettings(s => s.primaryColor)

  const data = useMemo(() => buildMonthlyData(projects), [projects])

  const W = 600
  const H = 100
  const PAD_X = 0
  const PAD_Y = 12
  const maxCount = Math.max(...data.map(d => d.count), 1)

  const pts = data.map((d, i) => ({
    x: PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2),
    y: PAD_Y + (1 - d.count / maxCount) * (H - PAD_Y * 2),
  }))

  const linePath = smoothPath(pts)

  // area fill: close path at bottom
  const areaPath = linePath
    + ` L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`

  const accent = 'var(--primary)'

  return (
    <div style={{ position: 'relative' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        style={{ width: '100%', height: 110, display: 'block', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="line-area-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={primaryColor} stopOpacity="0.18" />
            <stop offset="100%" stopColor={primaryColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal gridlines */}
        {[0, 0.5, 1].map((t, i) => {
          const y = PAD_Y + t * (H - PAD_Y * 2)
          return (
            <line
              key={i}
              x1={0} y1={y} x2={W} y2={y}
              stroke="var(--gray3)" strokeWidth="0.8"
              strokeDasharray={t === 0 || t === 1 ? undefined : '4 4'}
            />
          )
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#line-area-fill)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke={accent}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots + hover targets */}
        {pts.map((pt, i) => (
          <g key={i}>
            {/* invisible wide hit area */}
            <rect
              x={pt.x - (W / data.length) / 2}
              y={0}
              width={W / data.length}
              height={H}
              fill="transparent"
              style={{ cursor: data[i].count > 0 ? 'pointer' : 'default' }}
              onMouseEnter={() => setHovIdx(i)}
              onMouseLeave={() => setHovIdx(null)}
            />
            {/* dot */}
            <circle
              cx={pt.x}
              cy={pt.y}
              r={hovIdx === i ? 5.5 : data[i].count > 0 ? 3.5 : 2.5}
              fill={hovIdx === i ? accent : 'var(--white)'}
              stroke={accent}
              strokeWidth={hovIdx === i ? 0 : 2}
              style={{ transition: 'r 0.15s ease', pointerEvents: 'none' }}
            />
          </g>
        ))}
      </svg>

      {/* Tooltip */}
      {hovIdx !== null && (
        <div
          style={{
            position: 'absolute',
            bottom: 28,
            left: `calc(${(hovIdx / (data.length - 1)) * 100}%)`,
            transform: hovIdx === data.length - 1
              ? 'translateX(-100%)'
              : hovIdx === 0
              ? 'translateX(0)'
              : 'translateX(-50%)',
            background: 'var(--black)',
            color: '#fff',
            borderRadius: 8,
            padding: '5px 10px',
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            lineHeight: 1.5,
            boxShadow: '0 4px 14px rgba(0,0,0,0.22)',
            animation: 'fadeIn 0.12s ease both',
          }}
        >
          <div style={{ color: 'var(--gray2)', fontSize: 10 }}>{data[hovIdx].label}</div>
          <div style={{ color: accent, fontWeight: 800 }}>
            {data[hovIdx].count} projeto{data[hovIdx].count !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* X-axis labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {data.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              fontWeight: hovIdx === i ? 700 : 500,
              color: hovIdx === i ? 'var(--primary-text)' : 'var(--gray2)',
              transition: 'color 0.15s',
            }}
          >
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}
