'use client'
import type { Task, Project } from '@/lib/types'

export function PriorityList({ tasks, projects }: { tasks: Task[]; projects: Project[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {tasks.map((task, i) => {
        const project = projects.find(p => p.id === task.project_id)

        return (
          <div
            key={task.id}
            className="animate-slide-up"
            style={{
              animationDelay: `${i * 0.05 + 0.1}s`,
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 10px', borderRadius: 'var(--radius-sm)',
              cursor: 'pointer', transition: 'background .15s',
            }}
            onMouseEnter={e => (e.currentTarget as HTMLDivElement).style.background = 'var(--bg)'}
            onMouseLeave={e => (e.currentTarget as HTMLDivElement).style.background = 'transparent'}
          >
            <div style={{
              width: 6, height: 6, borderRadius: '50%', flexShrink: 0,
              background: project?.color_hex ?? 'var(--primary)',
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 13, fontWeight: 600, color: 'var(--black)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                textDecoration: task.done ? 'line-through' : 'none',
                opacity: task.done ? 0.5 : 1,
              }}>
                {task.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {project?.name}
              </div>
            </div>

            <div style={{ flexShrink: 0 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                background: task.done ? 'rgba(30,138,62,0.08)' : 'rgba(18,19,22,0.06)',
                color: task.done ? '#1E8A3E' : 'var(--gray2)',
                border: `1px solid ${task.done ? 'rgba(30,138,62,0.2)' : 'var(--gray3)'}`,
              }}>
                {task.done ? 'Concluído' : 'Pendente'}
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
