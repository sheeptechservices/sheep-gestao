'use client'
import { useState } from 'react'
import type { Project } from '@/lib/types'
import { calcProgress } from '@/lib/utils'

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function startOfMonth(y: number, m: number) { return new Date(y, m, 1) }
function endOfMonth(y: number, m: number)   { return new Date(y, m + 1, 0, 23, 59, 59) }

export function GanttTimeline({ projects }: { projects: Project[] }) {
  const [hov, setHov] = useState<string | null>(null)

  const active = projects.filter(p => p.status !== 'completed' && p.status !== 'cancelled')

  // derive range: earliest start → latest end, padded ±1 month
  const allStarts = active.map(p => new Date(p.start_date).getTime())
  const allEnds   = active.map(p => p.end_date ? new Date(p.end_date).getTime() : Date.now() + 60 * 86400000)

  const rangeStart = new Date(Math.min(...allStarts))
  const rangeEnd   = new Date(Math.max(...allEnds))

  // first day of month before earliest start
  const firstMonth = new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1)
  // last day of month after latest end
  const lastMonth  = new Date(rangeEnd.getFullYear(), rangeEnd.getMonth() + 1, 0)

  // build month columns
  const months: { label: string; start: Date; end: Date }[] = []
  let cur = new Date(firstMonth)
  while (cur <= lastMonth) {
    const y = cur.getFullYear()
    const m = cur.getMonth()
    months.push({
      label: MONTH_LABELS[m],
      start: startOfMonth(y, m),
      end:   endOfMonth(y, m),
    })
    cur = new Date(y, m + 1, 1)
  }

  const timelineStart = firstMonth.getTime()
  const timelineEnd   = lastMonth.getTime()
  const totalMs       = timelineEnd - timelineStart

  const todayPct = Math.min(100, Math.max(0,
    ((Date.now() - timelineStart) / totalMs) * 100
  ))

  function pct(date: Date) {
    return Math.min(100, Math.max(0, ((date.getTime() - timelineStart) / totalMs) * 100))
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: 480 }}>
        {/* Month headers */}
        <div style={{ display: 'flex', paddingLeft: 130, marginBottom: 8 }}>
          {months.map((m, i) => (
            <div key={i} style={{
              flex: 1, textAlign: 'center',
              fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase',
            }}>
              {m.label}
            </div>
          ))}
        </div>

        {/* Project rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {active.map((project, i) => {
            const start   = new Date(project.start_date)
            const end     = project.end_date ? new Date(project.end_date) : new Date(Date.now() + 60 * 86400000)
            const startP  = pct(start)
            const endP    = pct(end)
            const widthP  = Math.max(1, endP - startP)
            const isH     = hov === project.id
            const isOver  = end < new Date() && project.status !== 'completed'

            return (
              <div
                key={project.id}
                style={{ display: 'flex', alignItems: 'center', height: 32 }}
                onMouseEnter={() => setHov(project.id)}
                onMouseLeave={() => setHov(null)}
              >
                {/* Label */}
                <div style={{
                  width: 122, flexShrink: 0, paddingRight: 8,
                  fontSize: 11, fontWeight: isH ? 700 : 500,
                  color: isH ? 'var(--black)' : 'var(--gray)',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  transition: 'color .15s, font-weight .15s',
                }}>
                  {project.name}
                </div>

                {/* Track */}
                <div style={{ flex: 1, position: 'relative', height: '100%' }}>
                  {/* Month grid lines */}
                  <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
                    {months.map((_, mi) => (
                      <div key={mi} style={{
                        flex: 1,
                        borderLeft: mi > 0 ? '1px solid var(--gray3)' : 'none',
                      }} />
                    ))}
                  </div>

                  {/* Today line */}
                  <div style={{
                    position: 'absolute', top: 0, bottom: 0, width: 1.5,
                    background: 'var(--primary)', opacity: 0.8, zIndex: 3,
                    left: `${todayPct}%`,
                  }} />

                  {/* Bar */}
                  <div
                    style={{
                      position: 'absolute', top: 6, bottom: 6,
                      left: `${startP}%`, width: `${widthP}%`,
                      borderRadius: 4, zIndex: 1,
                      background: isH ? `${project.color_hex}33` : `${project.color_hex}1A`,
                      borderLeft: `3px solid ${project.color_hex}`,
                      outline: isOver ? `1px solid #D93025` : 'none',
                      display: 'flex', alignItems: 'center',
                      overflow: 'hidden', paddingLeft: 6,
                      boxShadow: isH ? `0 2px 10px ${project.color_hex}44` : 'none',
                      transition: 'background 0.18s, box-shadow 0.18s',
                    }}
                  >
                    {/* Progress fill */}
                    <div style={{
                      position: 'absolute', inset: 0,
                      width: `${calcProgress(project.start_date, project.end_date)}%`,
                      background: `${project.color_hex}22`,
                      borderRadius: 4,
                      transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
                    }} />
                    <span style={{
                      position: 'relative', fontSize: 10, fontWeight: 800,
                      color: project.color_hex, whiteSpace: 'nowrap',
                    }}>
                      {calcProgress(project.start_date, project.end_date)}%
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
