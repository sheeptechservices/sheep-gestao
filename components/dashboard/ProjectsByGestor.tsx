'use client'
import { useState } from 'react'
import type { Project, ProjectStatus } from '@/lib/types'
import { calcProgress } from '@/lib/utils'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  active:      { label: 'Em curso',       color: '#F59E0B' },
  negotiation: { label: 'Em negociação',  color: '#0284C7' },
  completed:   { label: 'Finalizado',     color: '#1E8A3E' },
  paused:      { label: 'Pausado',        color: '#7C3AED' },
  cancelled:   { label: 'Cancelado',      color: '#D93025' },
}

const AVATAR_COLORS = [
  '#84CC16', '#6366F1', '#F59E0B', '#14B8A6', '#EC4899', '#3B82F6',
]

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

function avgProgress(projects: Project[]) {
  if (!projects.length) return 0
  return Math.round(projects.reduce((s, p) => s + calcProgress(p.start_date, p.end_date), 0) / projects.length)
}

interface Props {
  projects: Project[]
}

export function ProjectsByGestor({ projects }: Props) {
  const [hovRow, setHovRow] = useState<string | null>(null)

  const gestores = Array.from(
    projects.reduce((map, p) => {
      const members = p.team_members?.length ? p.team_members : ['Sem equipe técnica']
      members.forEach(member => {
        if (!map.has(member)) map.set(member, [])
        map.get(member)!.push(p)
      })
      return map
    }, new Map<string, Project[]>())
  ).sort((a, b) => b[1].length - a[1].length)

  const maxCount = Math.max(...gestores.map(([, ps]) => ps.length))

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Legend */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
        {(Object.entries(STATUS_CONFIG) as [ProjectStatus, { label: string; color: string }][]).map(([, cfg]) => (
          <div key={cfg.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: cfg.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600 }}>{cfg.label}</span>
          </div>
        ))}
      </div>

      {/* Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {gestores.map(([gestor, ps], idx) => {
          const avg = avgProgress(ps)
          const isHov = hovRow === gestor

          return (
            <div
              key={gestor}
              onMouseEnter={() => setHovRow(gestor)}
              onMouseLeave={() => setHovRow(null)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 8,
                padding: '12px 14px', borderRadius: 10,
                background: isHov ? 'var(--bg)' : 'transparent',
                border: `1px solid ${isHov ? 'var(--gray3)' : 'transparent'}`,
                transition: 'background 0.15s, border-color 0.15s',
                cursor: 'default',
              }}
            >
              {/* Top row: avatar + name + count + avg */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: AVATAR_COLORS[idx % AVATAR_COLORS.length],
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 11, fontWeight: 800, color: '#fff',
                }}>
                  {initials(gestor)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {gestor}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>
                    {ps.length} projeto{ps.length !== 1 ? 's' : ''} · média {avg}%
                  </div>
                </div>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                  background: 'var(--primary-dim)', color: 'var(--primary-text)',
                  border: '1px solid var(--primary-mid)', flexShrink: 0,
                }}>
                  {ps.length}
                </span>
              </div>

              {/* Stacked bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{
                  height: 8, borderRadius: 100, overflow: 'hidden',
                  background: 'var(--gray3)',
                  display: 'flex',
                  width: `${(ps.length / maxCount) * 100}%`,
                  minWidth: 40,
                  transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
                }}>
                  {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(status => {
                    const count = ps.filter(p => p.status === status).length
                    if (!count) return null
                    const pct = (count / ps.length) * 100
                    return (
                      <div
                        key={status}
                        style={{
                          width: `${pct}%`, height: '100%',
                          background: STATUS_CONFIG[status].color,
                        }}
                      />
                    )
                  })}
                </div>

                {/* Status breakdown dots */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(Object.keys(STATUS_CONFIG) as ProjectStatus[]).map(status => {
                    const count = ps.filter(p => p.status === status).length
                    if (!count) return null
                    return (
                      <div key={status} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: STATUS_CONFIG[status].color }} />
                        <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600 }}>
                          {count} {STATUS_CONFIG[status].label.toLowerCase()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Progress per project */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 2 }}>
                {ps.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: p.color_hex, flexShrink: 0,
                    }} />
                    <span style={{
                      fontSize: 10, color: 'var(--gray)', fontWeight: 500,
                      flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {p.name}
                    </span>
                    <div style={{ width: 60, height: 4, borderRadius: 100, background: 'var(--gray3)', overflow: 'hidden', flexShrink: 0 }}>
                      <div style={{
                        height: '100%', width: `${Math.min(calcProgress(p.start_date, p.end_date), 100)}%`,
                        background: p.color_hex, borderRadius: 100,
                        transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                      }} />
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: p.color_hex, minWidth: 26, textAlign: 'right', flexShrink: 0 }}>
                      {calcProgress(p.start_date, p.end_date)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
