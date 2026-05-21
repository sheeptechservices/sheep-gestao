'use client'
import { useState, useRef, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import type { Project, Task, Week, ProjectStatus, ProjectType, TaskUrgency } from '@/lib/types'
import { calcProgress } from '@/lib/utils'
import { useTasksStore } from '@/stores/tasksStore'
import { toast } from '@/stores/toastStore'
import { AppSelect } from '@/components/ui/AppSelect'
import { WeekPickerSelect } from '@/components/ui/WeekPickerSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { localToday, localDateStr } from '@/lib/localDate'
import { playDoneSound } from '@/lib/sounds'
import { ConsultAgentButton } from '@/components/ui/ConsultAgentButton'
import { WBTaskModal, type FormState } from '@/components/tasks/WeeklyBoard'

// ── Troque para visualizar as variantes de navegação de semanas ───────────────
// 'pills' | 'accordion' | 'prevnext'
const WEEK_NAV_MODE: 'pills' | 'accordion' | 'prevnext' = 'prevnext'

// ── Config ────────────────────────────────────────────────────────────────────

const PROJECT_STATUS: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:      { label: 'Em curso',       color: '#B45309', bg: 'rgba(251,191,36,0.12)' },
  negotiation: { label: 'Em negociação',  color: '#0284C7', bg: 'rgba(2,132,199,0.10)'  },
  completed:   { label: 'Finalizado',     color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)'  },
  paused:      { label: 'Pausado',        color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  cancelled:   { label: 'Cancelado',      color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
}

const TYPE_LABEL: Record<ProjectType, string> = {
  AI: 'IA', SaaS: 'SaaS', TaaS: 'TaaS',
  BI: 'BI', PowerPlatform: 'Power Platform', Other: 'Outro',
}

// ── Icon buttons ─────────────────────────────────────────────────────────────
function EditBtn({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Editar"
      style={{
        width: 26, height: 26, borderRadius: 7,
        border: `1px solid ${hov ? '#94a3b8' : 'var(--gray3)'}`,
        background: hov ? '#f1f5f9' : 'var(--white)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease', transform: hov ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12L4 10.25H1.75V8L8.5 1.5z" stroke={hov ? '#475569' : 'var(--gray)'} strokeWidth={1.3} strokeLinejoin="round" style={{ transition: 'stroke 0.15s' }}/>
      </svg>
    </button>
  )
}

function DeleteBtn({ onClick }: { onClick: (e: React.MouseEvent) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Excluir"
      style={{
        width: 26, height: 26, borderRadius: 7,
        border: `1px solid ${hov ? '#f87171' : '#fca5a5'}`,
        background: hov ? '#fef2f2' : 'var(--white)',
        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
        transition: 'all 0.15s ease', transform: hov ? 'scale(1.1)' : 'scale(1)',
      }}
    >
      <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
        <path d="M2 3h8M5 3V2h2v1M4.5 3v6M7.5 3v6M3 3l.5 7h5l.5-7" stroke={hov ? '#dc2626' : '#D93025'} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.15s' }}/>
      </svg>
    </button>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirmModal({ taskTitle, onConfirm, onClose }: {
  taskTitle: string
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(18,19,22,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 16,
          padding: '28px 28px 24px', width: 380,
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          animation: 'modalSlideUp 0.22s ease both',
          display: 'flex', flexDirection: 'column', gap: 16,
        }}
      >
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(217,48,37,0.08)', border: '1px solid rgba(217,48,37,0.15)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M8 5V4h4v1M6.5 5v11M13.5 5v11M4 5l1 13h10l1-13" stroke="#D93025" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Text */}
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', margin: '0 0 6px' }}>
            Excluir entregável
          </h2>
          <p style={{ fontSize: 12, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
            Tem certeza que deseja excluir{' '}
            <strong style={{ color: 'var(--black)' }}>"{taskTitle}"</strong>?
            Essa ação não pode ser desfeita.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: '1px solid var(--gray3)', background: 'transparent',
              color: 'var(--gray2)', cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => { onConfirm(); onClose() }}
            style={{
              padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: 'none', background: '#D93025', color: '#fff',
              cursor: 'pointer', transition: 'background 0.15s',
            }}
          >
            Excluir
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Flag config ───────────────────────────────────────────────────────────────
const FLAG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  revisar:   { label: 'Revisar',   color: '#D97706', bg: 'rgba(217,119,6,0.12)'  },
  bloqueado: { label: 'Bloqueado', color: '#DC2626', bg: 'rgba(220,38,38,0.10)'  },
}
const ALL_FLAGS = Object.keys(FLAG_CONFIG)

// ── Urgency sort ──────────────────────────────────────────────────────────────
const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
function sortByUrgency(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const oa = a.urgency ? (URGENCY_ORDER[a.urgency] ?? 3) : 3
    const ob = b.urgency ? (URGENCY_ORDER[b.urgency] ?? 3) : 3
    return oa - ob
  })
}

// ── Urgency config ────────────────────────────────────────────────────────────
const URGENCY_CONFIG: Record<TaskUrgency, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',  color: '#059669', bg: 'rgba(5,150,105,0.10)'  },
  medium: { label: 'Média',  color: '#B45309', bg: 'rgba(180,83,9,0.10)'   },
  high:   { label: 'Alta',   color: '#DC2626', bg: 'rgba(220,38,38,0.10)'  },
}

function FlagBadge({ flag }: { flag: string }) {
  const cfg = FLAG_CONFIG[flag]
  if (!cfg) return null
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
      color: cfg.color, background: cfg.bg,
    }}>{cfg.label}</span>
  )
}

function DescriptionIcon({ description }: { description: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <span
      onMouseEnter={e => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.top })
      }}
      onMouseLeave={() => setPos(null)}
      style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, cursor: 'default' }}
    >
      {/* Three horizontal lines icon */}
      <svg width={12} height={10} viewBox="0 0 12 10" fill="none" style={{ display: 'block' }}>
        <path d="M1 1h10M1 5h10M1 9h7" stroke="var(--gray2)" strokeWidth={1.0} strokeLinecap="round" />
      </svg>
      {pos && typeof document !== 'undefined' && createPortal(
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, calc(-100% - 10px))',
          background: 'var(--black)',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.55,
          padding: '8px 12px',
          borderRadius: 9,
          width: 260,
          whiteSpace: 'pre-wrap' as React.CSSProperties['whiteSpace'],
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {description}
          <span style={{
            position: 'absolute',
            top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--black)',
          }} />
        </span>,
        document.body
      )}
    </span>
  )
}

function FlagCommentIcon({ comment }: { comment?: string }) {
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null)
  return (
    <span
      onMouseEnter={e => {
        const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
        setPos({ x: r.left + r.width / 2, y: r.top })
      }}
      onMouseLeave={() => setPos(null)}
      style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0, cursor: 'default' }}
    >
      <svg width={13} height={13} viewBox="0 0 16 16" fill="none" style={{ display: 'block' }}>
        <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7a1 1 0 01-1 1H9l-3 2v-2H3a1 1 0 01-1-1V3z"
          fill="var(--gray3)" stroke="var(--gray2)" strokeWidth={1.4} />
        <path d="M5 6h6M5 8.5h4" stroke="var(--gray2)" strokeWidth={1.2} strokeLinecap="round" />
      </svg>
      {pos && typeof document !== 'undefined' && createPortal(
        <span style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          transform: 'translate(-50%, calc(-100% - 10px))',
          background: 'var(--black)',
          border: 'none',
          color: '#fff',
          fontSize: 12,
          fontWeight: 500,
          lineHeight: 1.55,
          padding: '8px 12px',
          borderRadius: 9,
          width: 240,
          whiteSpace: 'pre-wrap' as React.CSSProperties['whiteSpace'],
          boxShadow: '0 6px 20px rgba(0,0,0,0.25)',
          zIndex: 9999,
          pointerEvents: 'none',
        }}>
          {comment}
          <span style={{
            position: 'absolute',
            top: '100%', left: '50%',
            transform: 'translateX(-50%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: '6px solid var(--black)',
          }} />
        </span>,
        document.body
      )}
    </span>
  )
}

// ── Deadline badge helper ─────────────────────────────────────────────────────
const DAY_ABBR = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
function deadlineBadge(deadline: string): { label: string; color: string; bg: string } {
  const today = localToday()
  const d = new Date(deadline + 'T12:00:00')
  const label = `${DAY_ABBR[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`
  if (deadline < today)  return { label, color: '#DC2626', bg: 'rgba(220,38,38,0.10)' }
  if (deadline === today) return { label, color: '#D97706', bg: 'rgba(217,119,6,0.10)' }
  return { label, color: '#059669', bg: 'rgba(5,150,105,0.10)' }
}

// ── Kanban card ───────────────────────────────────────────────────────────────
function KanbanCard({ task, dragging, color, project, onEdit, onDelete, onDragStart, onDragEnd }: {
  task: Task
  dragging: boolean
  color: string
  project?: Project
  onEdit: () => void
  onDelete: () => void
  onDragStart: () => void
  onDragEnd: () => void
}) {
  const [hov, setHov]               = useState(false)
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      {confirming && (
        <DeleteConfirmModal
          taskTitle={task.title}
          onConfirm={onDelete}
          onClose={() => setConfirming(false)}
        />
      )}
      <div
        draggable
        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
        onDragEnd={onDragEnd}
        onClick={() => onEdit()}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: dragging ? 'var(--primary-dim)' : hov ? 'var(--white)' : 'var(--bg)',
          border: `1px solid ${dragging ? 'var(--primary-mid)' : 'var(--gray3)'}`,
          borderRadius: 8, padding: '10px 12px',
          boxShadow: dragging ? `0 8px 24px var(--primary-mid)` : hov ? '0 4px 12px rgba(0,0,0,0.07)' : 'none',
          transform: dragging ? 'rotate(2deg) scale(1.03)' : hov ? 'translateY(-1px)' : 'none',
          opacity: dragging ? 0.85 : 1,
          transition: 'all 0.15s ease',
          cursor: dragging ? 'grabbing' : 'pointer',
          display: 'flex', flexDirection: 'column', gap: 8,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
          <div style={{
            width: 6, height: 6, borderRadius: '50%', flexShrink: 0, marginTop: 4,
            background: color,
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--black)', lineHeight: 1.4, flex: 1 }}>
            {task.title}
          </span>
          {task.description && <DescriptionIcon description={task.description} />}
        </div>
        {task.urgency && URGENCY_CONFIG[task.urgency] && (
          <div style={{ paddingLeft: 13 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10,
              color: URGENCY_CONFIG[task.urgency].color,
              background: URGENCY_CONFIG[task.urgency].bg,
            }}>
              {URGENCY_CONFIG[task.urgency].label}
            </span>
          </div>
        )}
        {task.flags && task.flags.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, paddingLeft: 13, flexWrap: 'wrap' }}>
            {task.flags.map(flag => <FlagBadge key={flag} flag={flag} />)}
            {task.flag_comment && <FlagCommentIcon comment={task.flag_comment} />}
          </div>
        )}
        {task.flag_comment && (!task.flags || task.flags.length === 0) && (
          <div style={{ fontSize: 10, color: 'var(--gray2)', fontStyle: 'italic', paddingLeft: 13 }}>
            {task.flag_comment}
          </div>
        )}
        {task.assigned_to && (
          <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, paddingLeft: 13 }}>
            {task.assigned_to}
          </div>
        )}
        {hov && !dragging && (
          <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4, animation: 'fadeIn 0.12s ease both' }}>
            <ConsultAgentButton task={task} project={project} variant="icon" direction="down" />
            <DeleteBtn onClick={e => { e.stopPropagation(); setConfirming(true) }} />
          </div>
        )}
      </div>
    </>
  )
}

// ── Kanban view ───────────────────────────────────────────────────────────────
function KanbanView({ tasks, color, project, onEdit, onDelete, onStatusChange }: {
  tasks: Task[]
  color: string
  project?: Project
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
}) {
  const [dragId,  setDragId]  = useState<string | null>(null)
  const [overCol, setOverCol] = useState<'todo' | 'done' | null>(null)

  const COLS: { key: 'todo' | 'done'; label: string; color: string; bg: string }[] = [
    { key: 'todo', label: 'A fazer',   color: '#64748B', bg: 'rgba(100,116,139,0.10)' },
    { key: 'done', label: 'Concluído', color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)'  },
  ]

  function handleDrop(colKey: 'todo' | 'done') {
    if (dragId) {
      const task = tasks.find(t => t.id === dragId)
      const newDone = colKey === 'done'
      if (task && task.done !== newDone) onStatusChange(dragId, newDone)
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
      {COLS.map(col => {
        const colTasks = tasks.filter(t => col.key === 'done' ? t.done : !t.done)
        const isOver   = overCol === col.key && dragId !== null
        const draggedTask = tasks.find(t => t.id === dragId)
        const canDrop  = isOver && (col.key === 'done' ? !draggedTask?.done : draggedTask?.done)

        return (
          <div
            key={col.key}
            onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverCol(col.key) }}
            onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverCol(null) }}
            onDrop={() => handleDrop(col.key)}
            style={{
              minWidth: 140, borderRadius: 10, padding: '6px 4px',
              background: canDrop ? `${col.color}0A` : 'transparent',
              border: `1.5px dashed ${canDrop ? col.color + '66' : 'transparent'}`,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, padding: '0 4px' }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: col.color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {col.label}
              </span>
              {colTasks.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: col.bg, color: col.color }}>
                  {colTasks.length}
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {colTasks.length === 0 && !canDrop ? (
                <div style={{ height: 48, border: '1.5px dashed var(--gray3)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 10, color: 'var(--gray2)' }}>—</span>
                </div>
              ) : (
                <>
                  {colTasks.map(t => (
                    <KanbanCard
                      key={t.id} task={t}
                      dragging={dragId === t.id}
                      color={color}
                      project={project}
                      onEdit={() => onEdit(t)}
                      onDelete={() => onDelete(t.id)}
                      onDragStart={() => setDragId(t.id)}
                      onDragEnd={() => { setDragId(null); setOverCol(null) }}
                    />
                  ))}
                  {canDrop && (
                    <div style={{ height: 44, borderRadius: 8, background: `${col.color}14`, border: `1.5px dashed ${col.color}88`, animation: 'fadeIn 0.15s ease both' }} />
                  )}
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ tasks, color, project, onEdit, onDelete, onStatusChange }: {
  tasks: Task[]
  color: string
  project?: Project
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
}) {
  const [hovId,       setHovId]       = useState<string | null>(null)
  const [confirmTask, setConfirmTask] = useState<Task | null>(null)
  return (
    <>
    {confirmTask && (
      <DeleteConfirmModal
        taskTitle={confirmTask.title}
        onConfirm={() => onDelete(confirmTask.id)}
        onClose={() => setConfirmTask(null)}
      />
    )}
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '28px 1fr 90px 100px 60px', padding: '0 10px 8px', gap: 8 }}>
        {['', 'Entregável', 'Previsão', 'Responsável', ''].map((h, i) => (
          <span key={i} style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            {h}
          </span>
        ))}
      </div>
      {tasks.map((task, i) => {
        const isH = hovId === task.id
        const db  = task.deadline ? deadlineBadge(task.deadline) : null
        return (
          <div
            key={task.id}
            onClick={() => onEdit(task)}
            onMouseEnter={() => setHovId(task.id)}
            onMouseLeave={() => setHovId(null)}
            style={{
              display: 'grid', gridTemplateColumns: '28px 1fr 90px 100px 60px',
              padding: '8px 10px', gap: 8, alignItems: 'center',
              borderTop: '1px solid var(--gray3)',
              background: isH ? 'var(--bg)' : 'transparent',
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            {/* Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <button
                onClick={e => { e.stopPropagation(); onStatusChange(task.id, !task.done) }}
                style={{
                  width: 18, height: 18, borderRadius: 5, flexShrink: 0, cursor: 'pointer',
                  border: `2px solid ${task.done ? color : 'var(--gray3)'}`,
                  background: task.done ? color : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s', padding: 0,
                }}
                title={task.done ? 'Marcar como pendente' : 'Marcar como feito'}
              >
                {task.done && (
                  <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2.5L8 3" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            </div>
            {/* Title + Urgency + Flags */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              <span style={{
                fontSize: 12, fontWeight: 500,
                color: task.done ? 'var(--gray2)' : 'var(--black)',
                textDecoration: task.done ? 'line-through' : 'none',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                transition: 'all 0.15s',
              }}>
                {task.title}
              </span>
              {task.description && <DescriptionIcon description={task.description} />}
              {task.urgency && URGENCY_CONFIG[task.urgency] && (
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, flexShrink: 0,
                  color: URGENCY_CONFIG[task.urgency].color,
                  background: URGENCY_CONFIG[task.urgency].bg,
                }}>
                  {URGENCY_CONFIG[task.urgency].label}
                </span>
              )}
              {task.flags?.map(flag => (
                <FlagBadge key={flag} flag={flag} />
              ))}
              {task.flags && task.flags.length > 0 && task.flag_comment && (
                <FlagCommentIcon comment={task.flag_comment} />
              )}
            </div>
            {/* Previsão de entrega */}
            {db ? (
              <span style={{
                fontSize: 11, fontWeight: 700,
                color: db.color,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {db.label}
              </span>
            ) : (
              <span style={{ fontSize: 11, color: 'var(--gray3)', fontWeight: 500 }}>—</span>
            )}
            {/* Responsável */}
            <span style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {task.assigned_to ?? '—'}
            </span>
            {/* Actions */}
            <div style={{ display: 'flex', gap: 4, opacity: isH ? 1 : 0, transition: 'opacity 0.15s', justifyContent: 'flex-end' }}>
              <ConsultAgentButton task={task} project={project} variant="icon" direction="up" />
              <DeleteBtn onClick={e => { e.stopPropagation(); setConfirmTask(task) }} />
            </div>
          </div>
        )
      })}
    </div>
    </>
  )
}

// ── Task week summary ─────────────────────────────────────────────────────────
function timeRemaining(endDate?: string): { label: string; color: string; bg: string } | null {
  if (!endDate) return null
  const now = new Date()
  const end = new Date(endDate)
  const diffMs = end.getTime() - now.getTime()
  if (diffMs < 0) {
    const days = Math.abs(Math.round(diffMs / 86400000))
    return { label: `${days}d atrasado`, color: '#D93025', bg: 'rgba(217,48,37,0.10)' }
  }
  const diffDays = Math.round(diffMs / 86400000)
  if (diffDays < 1) return { label: 'Hoje', color: '#D93025', bg: 'rgba(217,48,37,0.10)' }
  if (diffDays < 7) return { label: `${diffDays}d restantes`, color: '#B45309', bg: 'rgba(251,191,36,0.12)' }
  if (diffDays < 30) return { label: `${Math.round(diffDays / 7)}sem restantes`, color: '#B45309', bg: 'rgba(251,191,36,0.12)' }
  const months = Math.round(diffMs / (30.44 * 86400000))
  return { label: `${months}m restantes`, color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)' }
}

function TaskWeekSummary({ tasks }: { tasks: Task[] }) {
  if (tasks.length === 0) return (
    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100, color: 'var(--gray2)', background: 'var(--gray3)', justifySelf: 'start' }}>
      Sem entregáveis
    </span>
  )

  const total = tasks.length
  const done  = tasks.filter(t => t.done).length

  const concluded = done === total
  const label = concluded ? 'Semana concluída' : 'Semana não concluída'
  const color = concluded ? '#1E8A3E' : '#B45309'
  const bg    = concluded ? 'rgba(30,138,62,0.10)' : 'rgba(251,191,36,0.12)'

  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 100,
      color, background: bg, whiteSpace: 'nowrap', justifySelf: 'start',
    }}>
      {label}
    </span>
  )
}

// ── Add task button ───────────────────────────────────────────────────────────
function AddTaskButton({ onClick, color }: { onClick: (e: React.MouseEvent) => void; color: string }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 800, color: '#fff',
        background: color,
        border: 'none',
        padding: '5px 13px', borderRadius: 100, cursor: 'pointer',
        boxShadow: hov ? `0 3px 10px ${color}55` : 'none',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        opacity: hov ? 0.88 : 1,
        transition: 'all 0.2s ease',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{
        fontSize: 16, lineHeight: 1, fontWeight: 400,
        transform: hov ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
        display: 'inline-block',
      }}>+</span>
      Adicionar entregável
    </button>
  )
}

// ── Replicate button ──────────────────────────────────────────────────────────
function ReplicateButton({ count, nextWeekLabel, color, onClick }: { count: number; nextWeekLabel: string; color: string; onClick: (e: React.MouseEvent) => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 5,
        fontSize: 11, fontWeight: 700, color: 'var(--gray)',
        background: hov ? 'var(--bg)' : 'transparent',
        border: '1px solid var(--gray3)',
        padding: '4px 11px', borderRadius: 100, cursor: 'pointer',
        transition: 'all 0.18s ease',
      }}
    >
      <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
        <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
      Replicar pendentes próx. semana
    </button>
  )
}

// ── Week nav helpers ─────────────────────────────────────────────────────────
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${MESES[parseInt(m) - 1]} ${y}`
}
function fmtD(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}

function weekStatus(week: Week): 'past' | 'current' | 'future' {
  const now = new Date()
  if (now > new Date(week.end_date))   return 'past'
  if (now < new Date(week.start_date)) return 'future'
  return 'current'
}

// ── BacklogSection ────────────────────────────────────────────────────────────
function BacklogSection({ tasks, color, project, view, onEdit, onDelete, onStatusChange }: {
  tasks: Task[]; color: string; project?: Project; view: 'list' | 'kanban'
  onEdit: (t: Task) => void; onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
}) {
  if (tasks.length === 0) return null
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginTop: 14, borderTop: '1px dashed var(--gray3)', paddingTop: 12 }}>
      <div
        onClick={() => setOpen(o => !o)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: open ? 10 : 0 }}
      >
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
          style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
          <path d="M4 3l4 3-4 3" stroke="var(--gray2)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
          Backlog · {tasks.length} entregáve{tasks.length !== 1 ? 'is' : 'l'} sem semana
        </span>
      </div>
      {open && (
        view === 'kanban'
          ? <KanbanView tasks={tasks} color={color} project={project} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
          : <ListView  tasks={tasks} color={color} project={project} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
      )}
    </div>
  )
}

// ── WeekPills ─────────────────────────────────────────────────────────────────
function WeekPills({ weeks, selected, onSelect, tasks, color }: {
  weeks: Week[]; selected: string | 'all'
  onSelect: (id: string | 'all') => void
  tasks: Task[]; color: string
}) {
  if (weeks.length === 0) return null
  return (
    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2, marginBottom: 14,
      scrollbarWidth: 'none', msOverflowStyle: 'none' } as React.CSSProperties}>

      {weeks.map(week => {
        const ws    = weekStatus(week)
        const wt    = tasks.filter(t => t.week_id === week.id)
        const done  = wt.length > 0 && wt.every(t => t.done)
        const active = selected === week.id
        const icon  = done ? '✓' : ws === 'current' ? '●' : ''

        return (
          <button key={week.id} onClick={() => onSelect(week.id)} style={{
            flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: '5px 12px', borderRadius: 10, cursor: 'pointer', border: '1px solid',
            borderColor: active ? color : ws === 'current' ? color + '55' : 'var(--gray3)',
            background: active ? color + '18' : ws === 'current' ? color + '08' : 'var(--white)',
            transition: 'all 0.15s',
          }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: active ? color : 'var(--black)', display: 'flex', alignItems: 'center', gap: 4 }}>
              {icon && <span style={{ fontSize: 9, color: done ? '#1E8A3E' : color }}>{icon}</span>}
              Sem {week.week_number}
            </span>
            <span style={{ fontSize: 9, color: 'var(--gray2)', fontWeight: 500, whiteSpace: 'nowrap' }}>
              {fmtD(week.start_date)}–{fmtD(week.end_date)}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// ── WeekPrevNext ──────────────────────────────────────────────────────────────
function WeekPrevNext({ weeks, tasks, color, onWeekChange, initialIdx }: {
  weeks: Week[]; tasks: Task[]; color: string
  onWeekChange: (week: Week | null, idx: number) => void
  initialIdx: number
}) {
  const [idx, setIdx]           = useState(initialIdx)
  const [pickerOpen, setPicker] = useState(false)
  const centerRef               = useRef<HTMLButtonElement>(null)

  const week = weeks[idx] ?? null

  function go(next: number) {
    setIdx(next)
    onWeekChange(weeks[next] ?? null, next)
    setPicker(false)
  }

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return
    function handler(e: MouseEvent) {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) setPicker(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  if (weeks.length === 0) return null

  const wt    = week ? tasks.filter(t => t.week_id === week.id) : []
  const stats = {
    done: wt.filter(t => t.done).length,
    todo: wt.filter(t => !t.done).length,
  }
  const ws = week ? weekStatus(week) : 'past'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, marginBottom: 16 }}>
      {/* Navigator row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Prev */}
        <button
          onClick={() => go(idx - 1)} disabled={idx === 0}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--gray3)',
            background: 'var(--white)', cursor: idx === 0 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: idx === 0 ? 0.35 : 1, transition: 'opacity 0.15s', flexShrink: 0,
          }}
        >
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path d="M6 2L3 5l3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Center — clickable, opens week picker */}
        <div style={{ position: 'relative' }}>
          <button
            ref={centerRef}
            onClick={() => setPicker(o => !o)}
            style={{
              textAlign: 'center', background: pickerOpen ? color + '10' : 'transparent',
              border: `1px solid ${pickerOpen ? color + '55' : 'var(--gray3)'}`,
              borderRadius: 10, padding: '6px 14px', cursor: 'pointer',
              transition: 'all 0.15s', minWidth: 160,
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              {ws === 'current' && (
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
              )}
              Semana {week?.week_number}
              {ws === 'past'    && <span style={{ fontSize: 10, fontWeight: 700, color: '#1E8A3E' }}>✓</span>}
              {ws === 'current' && <span style={{ fontSize: 10, fontWeight: 700, color }}>Atual</span>}
              {ws === 'future'  && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)' }}>Planejada</span>}
              <svg width={9} height={6} viewBox="0 0 9 6" fill="none"
                style={{ opacity: 0.4, transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
                <path d="M1 1L4.5 5L8 1" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            {week && (
              <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500 }}>
                {fmtD(week.start_date)} – {fmtD(week.end_date)}
              </div>
            )}
          </button>

          {/* Week picker dropdown */}
          {pickerOpen && createPortal(
            (() => {
              const rect = centerRef.current?.getBoundingClientRect()
              return (
                <div
                  onMouseDown={e => e.stopPropagation()}
                  style={{
                    position: 'fixed',
                    top: (rect?.bottom ?? 0) + 6,
                    left: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
                    transform: 'translateX(-50%)',
                    zIndex: 3000,
                    background: 'var(--white)',
                    border: '1px solid var(--gray3)',
                    borderRadius: 12,
                    boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                    padding: 6,
                    minWidth: 200,
                    animation: 'fadeIn 0.12s ease both',
                  }}
                >
                  {weeks.map((w, i) => {
                    const ws2     = weekStatus(w)
                    const wt2     = tasks.filter(t => t.week_id === w.id)
                    const done2   = wt2.filter(t => t.done).length
                    const isActive = i === idx
                    return (
                      <button
                        key={w.id}
                        onClick={() => go(i)}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                          background: isActive ? color + '15' : 'transparent',
                          transition: 'background 0.12s', textAlign: 'left',
                        }}
                        onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                        onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                      >
                        {/* Status dot */}
                        <div style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: ws2 === 'current' ? color : ws2 === 'past' ? '#1E8A3E' : 'var(--gray3)',
                        }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: isActive ? 800 : 600, color: isActive ? color : 'var(--black)' }}>
                            Semana {w.week_number}
                          </div>
                          <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>
                            {fmtD(w.start_date)} – {fmtD(w.end_date)}
                          </div>
                        </div>
                        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray2)', flexShrink: 0 }}>
                          {done2}/{wt2.length}
                        </span>
                        {isActive && (
                          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                            <path d="M2 5l2.5 2.5L8 3" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>
                    )
                  })}
                </div>
              )
            })(),
            document.body
          )}
        </div>

        {/* Next */}
        <button
          onClick={() => go(idx + 1)} disabled={idx === weeks.length - 1}
          style={{
            width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--gray3)',
            background: 'var(--white)', cursor: idx === weeks.length - 1 ? 'default' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: idx === weeks.length - 1 ? 0.35 : 1, transition: 'opacity 0.15s', flexShrink: 0,
          }}
        >
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
            <path d="M4 2l3 3-3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Mini-stats */}
      {wt.length > 0 && (
        <div style={{ display: 'flex', gap: 10, fontSize: 10, fontWeight: 600 }}>
          {stats.done > 0 && <span style={{ color: '#1E8A3E' }}>✓ {stats.done} feito{stats.done !== 1 ? 's' : ''}</span>}
          {stats.todo > 0 && <span style={{ color: 'var(--gray2)' }}>○ {stats.todo} pendente{stats.todo !== 1 ? 's' : ''}</span>}
        </div>
      )}
      {wt.length === 0 && (
        <span style={{ fontSize: 10, color: 'var(--gray2)' }}>Sem entregáveis nesta semana</span>
      )}
    </div>
  )
}

// ── WeekAccordion ─────────────────────────────────────────────────────────────
function WeekAccordion({ weeks, currentWeekId, tasks, backlogTasks, color, view, onAdd, onEdit, onDelete, onStatusChange }: {
  weeks: Week[]; currentWeekId: string | null
  tasks: Task[]; backlogTasks: Task[]
  color: string; view: 'list' | 'kanban'
  onAdd: (weekId?: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(
    () => new Set(currentWeekId ? [currentWeekId] : [])
  )
  const [backlogOpen, setBacklogOpen] = useState(false)

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {weeks.map((week, wi) => {
        const wt     = tasks.filter(t => t.week_id === week.id)
        const done   = wt.filter(t => t.done).length
        const ws     = weekStatus(week)
        const isOpen = openIds.has(week.id)
        const allDone = wt.length > 0 && wt.every(t => t.done)

        const statusLabel = allDone ? 'Concluída' : ws === 'current' ? 'Em andamento' : ws === 'past' ? 'Passada' : 'Planejada'
        const statusColor = allDone ? '#1E8A3E' : ws === 'current' ? '#B45309' : ws === 'past' ? 'var(--gray2)' : '#3B82F6'
        const statusBg    = allDone ? 'rgba(30,138,62,0.10)' : ws === 'current' ? 'rgba(251,191,36,0.12)' : ws === 'past' ? 'var(--gray3)' : 'rgba(59,130,246,0.10)'

        return (
          <div key={week.id} style={{
            borderTop: wi === 0 ? 'none' : '1px solid var(--gray3)',
          }}>
            {/* Section header */}
            <div
              onClick={() => toggle(week.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 4px', cursor: 'pointer',
                background: isOpen ? color + '06' : 'transparent',
                transition: 'background 0.15s',
              }}
            >
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
                style={{ transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                <path d="M4 3l4 3-4 3" stroke={isOpen ? color : 'var(--gray2)'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: isOpen ? color : 'var(--black)' }}>
                  Semana {week.week_number}
                </span>
                <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>
                  {fmtD(week.start_date)}–{fmtD(week.end_date)}
                </span>
                {ws === 'current' && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />
                )}
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
                  color: statusColor, background: statusBg }}>
                  {statusLabel}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)' }}>
                  {done}/{wt.length}
                </span>
                {isOpen && (
                  <button
                    onClick={e => { e.stopPropagation(); onAdd(week.id) }}
                    style={{
                      fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 100,
                      background: color, color: '#fff', border: 'none', cursor: 'pointer',
                    }}
                  >+ Entregável</button>
                )}
              </div>
            </div>

            {/* Section content */}
            <div style={{
              maxHeight: isOpen ? 800 : 0, overflow: 'hidden',
              transition: isOpen
                ? 'max-height 0.35s cubic-bezier(0.4,0,0.2,1)'
                : 'max-height 0.25s cubic-bezier(0.4,0,0.2,1)',
            }}>
              {isOpen && (
                <div style={{ paddingBottom: 12 }}>
                  {week.goals && (
                    <div style={{
                      padding: '6px 10px', borderRadius: 7, marginBottom: 8,
                      background: color + '0E', borderLeft: `2px solid ${color}`,
                      fontSize: 11, color: 'var(--gray)', lineHeight: 1.4,
                    }}>
                      <span style={{ fontWeight: 800, color: 'var(--gray2)', fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meta · </span>
                      {week.goals}
                    </div>
                  )}
                  {wt.length === 0 ? (
                    <div style={{ fontSize: 12, color: 'var(--gray2)', fontStyle: 'italic', padding: '12px 0', textAlign: 'center' }}>
                      Sem entregáveis nesta semana.
                    </div>
                  ) : view === 'kanban' ? (
                    <KanbanView tasks={wt} color={color} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
                  ) : (
                    <ListView  tasks={wt} color={color} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
                  )}
                </div>
              )}
            </div>
          </div>
        )
      })}

      {/* Backlog */}
      {backlogTasks.length > 0 && (
        <div style={{ borderTop: '1px dashed var(--gray3)' }}>
          <div
            onClick={() => setBacklogOpen(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px', cursor: 'pointer' }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
              style={{ transform: backlogOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
              <path d="M4 3l4 3-4 3" stroke="var(--gray2)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--gray2)' }}>Backlog</span>
            <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>
              {backlogTasks.length} entregáve{backlogTasks.length !== 1 ? 'is' : 'l'} sem semana
            </span>
          </div>
          <div style={{
            maxHeight: backlogOpen ? 600 : 0, overflow: 'hidden',
            transition: 'max-height 0.3s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {backlogOpen && (
              <div style={{ paddingBottom: 12 }}>
                {view === 'kanban'
                  ? <KanbanView tasks={backlogTasks} color={color} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
                  : <ListView  tasks={backlogTasks} color={color} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
                }
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// ── GlobalWeekNav ─────────────────────────────────────────────────────────────
interface GlobalWeek { start_date: string; end_date: string }

function GlobalWeekNav({ weeks, idx, onChange }: {
  weeks: GlobalWeek[]
  idx: number
  onChange: (idx: number) => void
}) {
  const [pickerOpen,     setPicker]     = useState(false)
  const [pickerMonthKey, setPickerMonth] = useState(() => weeks[idx]?.start_date.slice(0, 7) ?? '')
  const centerRef                        = useRef<HTMLButtonElement>(null)
  const week                             = weeks[idx]

  useEffect(() => {
    if (!pickerOpen) return
    function h(e: MouseEvent) {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) setPicker(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pickerOpen])

  if (!week) return null

  const today  = localToday()
  const ws     = today > week.end_date ? 'past' : today < week.start_date ? 'future' : 'current'
  const wsLabel = ws === 'past' ? 'Passada' : ws === 'current' ? 'Atual' : 'Planejada'
  const wsColor = ws === 'past' ? '#94A3B8' : ws === 'current' ? 'var(--primary)' : '#3B82F6'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
      padding: '4px 0',
    }}>
      {/* Prev */}
      <button onClick={() => onChange(idx - 1)} disabled={idx === 0} style={{
        width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--gray3)',
        background: 'var(--white)', cursor: idx === 0 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: idx === 0 ? 0.3 : 1, transition: 'opacity 0.15s', flexShrink: 0,
      }}>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
          <path d="M6 2L3 5l3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Center — picker trigger */}
      <div style={{ position: 'relative' }}>
        <button
          ref={centerRef}
          onClick={() => { setPickerMonth(weeks[idx].start_date.slice(0, 7)); setPicker(o => !o) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '6px 16px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${pickerOpen ? 'var(--primary)' : 'var(--gray3)'}`,
            background: pickerOpen ? 'var(--primary-dim)' : 'var(--white)',
            transition: 'all 0.15s', minWidth: 220, justifyContent: 'center',
          }}
        >
          {ws === 'current' && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)' }}>
            {fmtD(week.start_date)} – {fmtD(week.end_date)}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: wsColor }}>
            {wsLabel}
          </span>
          <svg width={9} height={6} viewBox="0 0 9 6" fill="none"
            style={{ opacity: 0.4, transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
            <path d="M1 1L4.5 5L8 1" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Picker dropdown */}
        {pickerOpen && createPortal(
          (() => {
            const rect = centerRef.current?.getBoundingClientRect()
            return (
              <div
                onMouseDown={e => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  top: (rect?.bottom ?? 0) + 6,
                  left: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
                  transform: 'translateX(-50%)',
                  zIndex: 3000,
                  background: 'var(--white)',
                  border: '1px solid var(--gray3)',
                  borderRadius: 12,
                  boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                  padding: '6px 6px 6px',
                  minWidth: 240,
                  animation: 'fadeIn 0.12s ease both',
                }}
              >
                {(() => {
                  const td2            = localToday()
                  const seen = new Set<string>()
                  const availableMonths = weeks.map(w => w.start_date.slice(0, 7)).filter(m => seen.has(m) ? false : (seen.add(m), true)).sort()
                  const monthIdx        = availableMonths.indexOf(pickerMonthKey)
                  const weeksInMonth    = weeks.filter(w => w.start_date.slice(0, 7) === pickerMonthKey)

                  const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
                    width: 22, height: 22, borderRadius: '50%',
                    border: '1px solid var(--gray3)', background: 'transparent',
                    cursor: disabled ? 'default' : 'pointer',
                    opacity: disabled ? 0.3 : 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, lineHeight: 1, color: 'var(--gray)', flexShrink: 0,
                    transition: 'opacity 0.15s',
                  })

                  return (
                    <>
                      {/* Month navigator header */}
                      <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '4px 6px 8px', borderBottom: '1px solid var(--gray3)', marginBottom: 4,
                      }}>
                        <button
                          disabled={monthIdx === 0}
                          onClick={e => { e.stopPropagation(); setPickerMonth(availableMonths[monthIdx - 1]) }}
                          style={navBtnStyle(monthIdx === 0)}
                        >‹</button>
                        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--black)' }}>
                          {fmtMonth(pickerMonthKey)}
                        </span>
                        <button
                          disabled={monthIdx === availableMonths.length - 1}
                          onClick={e => { e.stopPropagation(); setPickerMonth(availableMonths[monthIdx + 1]) }}
                          style={navBtnStyle(monthIdx === availableMonths.length - 1)}
                        >›</button>
                      </div>

                      {/* Weeks of selected month */}
                      {weeksInMonth.map(w => {
                        const globalIdx = weeks.findIndex(x => x.start_date === w.start_date)
                        const ws2       = td2 > w.end_date ? 'past' : td2 < w.start_date ? 'future' : 'current'
                        const active    = globalIdx === idx
                        return (
                          <button key={w.start_date} onClick={() => { onChange(globalIdx); setPicker(false) }} style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                            padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                            background: active ? 'var(--primary-dim)' : 'transparent',
                            transition: 'background 0.12s', textAlign: 'left',
                          }}
                            onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                            onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                          >
                            <div style={{
                              width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                              background: ws2 === 'current' ? 'var(--primary)' : ws2 === 'past' ? '#CBD5E1' : '#93C5FD',
                            }} />
                            <span style={{
                              fontSize: 12, fontWeight: active ? 800 : 600, flex: 1,
                              color: ws2 === 'past' ? 'var(--gray2)' : active ? 'var(--primary-text)' : 'var(--black)',
                              opacity: ws2 === 'past' ? 0.7 : 1,
                            }}>
                              {fmtD(w.start_date)} – {fmtD(w.end_date)}
                            </span>
                            <span style={{ fontSize: 10, fontWeight: 600,
                              color: ws2 === 'current' ? 'var(--primary)' : ws2 === 'past' ? '#94A3B8' : '#3B82F6',
                            }}>
                              {ws2 === 'current' ? 'Atual' : ws2 === 'past' ? 'Passada' : 'Planejada'}
                            </span>
                            {active && (
                              <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                                <path d="M2 5l2.5 2.5L8 3" stroke="var(--primary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                            )}
                          </button>
                        )
                      })}
                    </>
                  )
                })()}
              </div>
            )
          })(),
          document.body
        )}
      </div>

      {/* Next */}
      <button onClick={() => onChange(idx + 1)} disabled={idx === weeks.length - 1} style={{
        width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--gray3)',
        background: 'var(--white)', cursor: idx === weeks.length - 1 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: idx === weeks.length - 1 ? 0.3 : 1, transition: 'opacity 0.15s', flexShrink: 0,
      }}>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
          <path d="M4 2l3 3-3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}

// ── Day view card (top-level to avoid remount-on-drag bug) ────────────────────
function DayTaskCard({ task, color, project, isDragging, compact = false, onDragStart, onDragEnd, onClick, onStatusChange, onDelete }: {
  task: Task
  color: string
  project?: Project
  isDragging: boolean
  compact?: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
  onStatusChange: () => void
  onDelete?: () => void
}) {
  const [pop, setPop]               = useState(false)
  const [hov, setHov]               = useState(false)
  const [confirming, setConfirming] = useState(false)
  return (
    <>
      {confirming && (
        <DeleteConfirmModal
          taskTitle={task.title}
          onConfirm={() => { onDelete?.(); setConfirming(false) }}
          onClose={() => setConfirming(false)}
        />
      )}
      <div
        draggable
        onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
        onDragEnd={onDragEnd}
        onClick={() => { if (!isDragging) onClick() }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: isDragging ? color + '18' : hov ? 'var(--white)' : 'var(--white)',
          borderRadius: compact ? 6 : 7,
          border: `1px solid ${isDragging ? color + '66' : hov ? color + '55' : 'var(--gray3)'}`,
          padding: compact ? '5px 7px' : '7px 8px',
          cursor: isDragging ? 'grabbing' : 'pointer',
          opacity: isDragging ? 0.5 : task.done ? 0.6 : 1,
          transform: isDragging ? 'rotate(1.5deg) scale(1.02)' : hov ? 'translateY(-1px)' : 'none',
          boxShadow: hov && !isDragging ? `0 3px 10px rgba(0,0,0,0.08)` : 'none',
          transition: 'all 0.15s ease',
          display: 'flex', flexDirection: compact ? 'row' : 'column',
          gap: compact ? 6 : 4, alignItems: compact ? 'center' : 'stretch',
          userSelect: 'none', position: 'relative',
        }}
      >
        <button
          onClick={e => {
            e.stopPropagation()
            if (!task.done) { setPop(true); playDoneSound() }
            onStatusChange()
          }}
          onAnimationEnd={() => setPop(false)}
          style={{
            width: compact ? 14 : 15, height: compact ? 14 : 15,
            borderRadius: 4, flexShrink: 0, cursor: 'pointer',
            border: `2px solid ${task.done ? color : 'var(--gray3)'}`,
            background: task.done ? color : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0,
            ...(compact ? {} : { marginTop: 1 }),
            animation: pop ? 'checkPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
            transition: pop ? 'none' : 'all 0.15s',
          }}
        >
          {task.done && (
            <svg width={compact ? 7 : 8} height={compact ? 7 : 8} viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2.5L8 3" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>

        {compact ? (
          <>
            <span style={{
              fontSize: 11, fontWeight: 500, flex: 1,
              color: task.done ? 'var(--gray2)' : 'var(--black)',
              textDecoration: task.done ? 'line-through' : 'none',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{task.title}</span>
            {task.urgency && URGENCY_CONFIG[task.urgency] && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8, flexShrink: 0,
                color: URGENCY_CONFIG[task.urgency].color, background: URGENCY_CONFIG[task.urgency].bg,
              }}>{URGENCY_CONFIG[task.urgency].label}</span>
            )}
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 0 }}>
            <span style={{
              fontSize: 11, fontWeight: 600, lineHeight: 1.35,
              color: task.done ? 'var(--gray2)' : 'var(--black)',
              textDecoration: task.done ? 'line-through' : 'none',
            }}>{task.title}</span>
            {(task.urgency || task.assigned_to) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                {task.urgency && URGENCY_CONFIG[task.urgency] && (
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                    color: URGENCY_CONFIG[task.urgency].color, background: URGENCY_CONFIG[task.urgency].bg,
                  }}>{URGENCY_CONFIG[task.urgency].label}</span>
                )}
                {task.assigned_to && (
                  <span style={{ fontSize: 9, color: 'var(--gray2)', fontWeight: 500 }}>
                    {task.assigned_to.split(' ')[0]}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Hover action buttons */}
        {hov && !isDragging && (
          <div style={{
            position: 'absolute', top: compact ? '50%' : 6, right: 6,
            transform: compact ? 'translateY(-50%)' : 'none',
            display: 'flex', gap: 3,
            animation: 'fadeIn 0.12s ease both',
          }}>
            <ConsultAgentButton task={task} project={project} variant="icon" direction={compact ? 'up' : 'down'} />
            {onDelete && (
              <div
                onClick={e => { e.stopPropagation(); setConfirming(true) }}
                title="Excluir"
                style={{
                  width: 20, height: 20, borderRadius: 5,
                  background: 'var(--white)', border: '1px solid rgba(220,38,38,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
                  transition: 'background 0.12s, border-color 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.borderColor = '#DC2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)' }}
              >
                <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                  <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.6 7h3.8l.6-7" stroke="#DC2626" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ── Day view ──────────────────────────────────────────────────────────────────
function DayView({ tasks, weekStart, color, project, onAdd, onEdit, onDelete, onStatusChange }: {
  tasks: Task[]
  weekStart: string   // 'YYYY-MM-DD' of Monday
  color: string
  project?: Project
  onAdd?: (date: string) => void
  onEdit: (t: Task) => void
  onDelete?: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
}) {
  const { updateTask } = useTasksStore()
  const today    = localToday()
  const DAY_NAMES = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']

  const [dragId,   setDragId]   = useState<string | null>(null)
  const [overZone, setOverZone] = useState<string | null>(null)  // date or 'no-date'

  // Generate Mon–Fri dates from weekStart
  const days = Array.from({ length: 5 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00')
    d.setDate(d.getDate() + i)
    return localDateStr(d)
  })

  const tasksByDay: Record<string, Task[]> = {}
  const noDateTasks: Task[] = []
  for (const task of tasks) {
    if (task.deadline && days.includes(task.deadline)) {
      if (!tasksByDay[task.deadline]) tasksByDay[task.deadline] = []
      tasksByDay[task.deadline].push(task)
    } else {
      noDateTasks.push(task)
    }
  }

  function handleDrop(zone: string) {
    if (!dragId) return
    const task = tasks.find(t => t.id === dragId)
    if (!task) return
    const newDeadline = zone === 'no-date' ? undefined : zone
    const curZone = task.deadline && days.includes(task.deadline) ? task.deadline : 'no-date'
    if (zone !== curZone) updateTask(dragId, { deadline: newDeadline })
    setDragId(null)
    setOverZone(null)
  }

  function dropZoneProps(zone: string) {
    const draggedTask = tasks.find(t => t.id === dragId)
    const curZone = draggedTask
      ? (draggedTask.deadline && days.includes(draggedTask.deadline) ? draggedTask.deadline : 'no-date')
      : null
    const canDrop = dragId !== null && curZone !== zone
    return {
      onDragOver:  (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverZone(zone) },
      onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverZone(null) },
      onDrop:      (e: React.DragEvent) => { e.preventDefault(); handleDrop(zone) },
      isOver:      overZone === zone && canDrop,
    }
  }

  return (
    <div>
      {/* Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        {days.map((date, i) => {
          const isToday  = date === today
          const dayTasks = tasksByDay[date] ?? []
          const { onDragOver, onDragLeave, onDrop, isOver } = dropZoneProps(date)

          return (
            <div
              key={date}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              onDrop={onDrop}
              style={{
                borderRadius: 10,
                border: `1.5px ${isOver ? 'dashed' : 'solid'} ${isOver ? color : isToday ? color : 'var(--gray3)'}`,
                background: isOver ? color + '10' : isToday ? color + '06' : 'var(--bg)',
                overflow: 'hidden',
                transition: 'border-color 0.15s, background 0.15s',
              }}
            >
              {/* Column header */}
              <div style={{
                padding: '7px 10px',
                borderBottom: `1px solid ${isOver ? color + '44' : isToday ? color + '33' : 'var(--gray3)'}`,
                background: isOver ? color + '14' : isToday ? color + '12' : 'transparent',
                transition: 'background 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: isOver ? color : isToday ? color : 'var(--black)' }}>
                    {DAY_NAMES[i]}
                    {isToday && (
                      <span style={{
                        marginLeft: 5, fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                        background: color, color: '#fff',
                      }}>Hoje</span>
                    )}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>
                    {(() => { const [, m, d] = date.split('-'); return `${d}/${m}` })()}
                  </div>
                </div>
                {onAdd && (
                  <button
                    onClick={() => onAdd(date)}
                    title={`Novo entregável em ${DAY_NAMES[i]}`}
                    style={{
                      width: 20, height: 20, borderRadius: 6,
                      border: '1px solid var(--gray3)', background: 'transparent',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--gray2)', fontSize: 14, lineHeight: 1, fontWeight: 400,
                      transition: 'all 0.15s', flexShrink: 0, padding: 0,
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = color + '18'
                      e.currentTarget.style.borderColor = color
                      e.currentTarget.style.color = color
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.borderColor = 'var(--gray3)'
                      e.currentTarget.style.color = 'var(--gray2)'
                    }}
                  >+</button>
                )}
              </div>

              {/* Tasks + drop placeholder */}
              <div style={{ padding: '6px 6px', display: 'flex', flexDirection: 'column', gap: 5, minHeight: 60 }}>
                {dayTasks.length === 0 && !isOver ? (
                  onAdd ? (
                    <button
                      onClick={() => onAdd(date)}
                      title={`Novo entregável em ${DAY_NAMES[i]}`}
                      style={{
                        width: '100%', minHeight: 56,
                        border: `1.5px dashed var(--gray3)`,
                        borderRadius: 7, background: 'transparent',
                        cursor: 'pointer', display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center', gap: 3,
                        color: 'var(--gray3)', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = color
                        e.currentTarget.style.background = color + '10'
                        e.currentTarget.style.color = color
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = 'var(--gray3)'
                        e.currentTarget.style.background = 'transparent'
                        e.currentTarget.style.color = 'var(--gray3)'
                      }}
                    >
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M6.5 1v11M1 6.5h11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                      </svg>
                      <span style={{ fontSize: 9, fontWeight: 600 }}>Adicionar</span>
                    </button>
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0' }}>
                      <span style={{ fontSize: 10, color: 'var(--gray3)' }}>—</span>
                    </div>
                  )
                ) : (
                  <>
                    {dayTasks.map(task => (
                      <DayTaskCard
                        key={task.id}
                        task={task}
                        color={color}
                        project={project}
                        isDragging={dragId === task.id}
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => { setDragId(null); setOverZone(null) }}
                        onClick={() => onEdit(task)}
                        onStatusChange={() => onStatusChange(task.id, !task.done)}
                        onDelete={onDelete ? () => onDelete(task.id) : undefined}
                      />
                    ))}
                    {isOver && (
                      <div style={{
                        height: 44, borderRadius: 7,
                        background: color + '14',
                        border: `1.5px dashed ${color}88`,
                        animation: 'fadeIn 0.15s ease both',
                      }} />
                    )}
                    {!isOver && onAdd && (
                      <button
                        onClick={() => onAdd(date)}
                        title={`Novo entregável em ${DAY_NAMES[i]}`}
                        style={{
                          width: '100%', padding: '5px 0',
                          border: '1px dashed transparent',
                          borderRadius: 5, background: 'transparent',
                          cursor: 'pointer', display: 'flex',
                          alignItems: 'center', justifyContent: 'center', gap: 3,
                          color: 'var(--gray3)', fontSize: 10, fontWeight: 600,
                          transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = color
                          e.currentTarget.style.background = color + '10'
                          e.currentTarget.style.color = color
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = 'transparent'
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = 'var(--gray3)'
                        }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                        </svg>
                        Adicionar
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* No-date footer */}
      {(() => {
        const { onDragOver, onDragLeave, onDrop, isOver } = dropZoneProps('no-date')
        const showFooter = noDateTasks.length > 0 || isOver
        if (!showFooter) return null
        return (
          <div
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            style={{
              marginTop: 10, padding: '8px 10px', borderRadius: 8,
              background: isOver ? 'var(--gray3)' : 'var(--bg)',
              border: `1px dashed ${isOver ? 'var(--gray2)' : 'var(--gray3)'}`,
              transition: 'background 0.15s, border-color 0.15s',
            }}
          >
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              Sem data definida · {noDateTasks.length}
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {noDateTasks.map(task => (
                <DayTaskCard
                  key={task.id}
                  task={task}
                  color={color}
                  project={project}
                  isDragging={dragId === task.id}
                  compact
                  onDragStart={() => setDragId(task.id)}
                  onDragEnd={() => { setDragId(null); setOverZone(null) }}
                  onClick={() => onEdit(task)}
                  onStatusChange={() => onStatusChange(task.id, !task.done)}
                  onDelete={onDelete ? () => onDelete(task.id) : undefined}
                />
              ))}
              {isOver && (
                <div style={{
                  height: 32, borderRadius: 6,
                  background: 'rgba(100,116,139,0.08)',
                  border: '1.5px dashed var(--gray2)',
                  animation: 'fadeIn 0.15s ease both',
                }} />
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// ── Project row ───────────────────────────────────────────────────────────────
function ProjectRow({ project, tasks, isOpen, onToggle, onAdd, onAddForDay, onEdit, onDelete, onStatusChange, onReplicate, globalWeekStart, weeks, titleMode, isDragging, isDragOver, onDragStart, onDragEnd, onDragOver, onDrop, nested = false }: {
  project: Project
  tasks: Task[]
  isOpen: boolean
  onToggle: () => void
  onAdd: (weekId?: string) => void
  onAddForDay?: (weekId: string | undefined, deadline: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
  onReplicate: (tasks: Task[], toWeekId: string) => void
  globalWeekStart: string | null
  weeks: Week[]
  titleMode: 'project' | 'client'
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: () => void
  onDrop: () => void
  nested?: boolean
}) {
  const [view, setView]       = useState<'list' | 'kanban' | 'day'>('list')
  const [viewKey, setViewKey] = useState(0)
  const [hov, setHov]         = useState(false)

  function switchView(v: 'list' | 'kanban' | 'day') {
    if (v === view) return
    setView(v)
    setViewKey(k => k + 1)
  }

  const ps = PROJECT_STATUS[project.status]

  // ── Week navigation ─────────────────────────────────────────────────────────
  const projectWeeks = [...weeks].sort((a, b) => a.start_date.localeCompare(b.start_date))

  // Effective week: driven by global selector
  const effectiveWeek = globalWeekStart
    ? (projectWeeks.find(w => w.start_date === globalWeekStart) ?? null)
    : null

  const weekTasks    = sortByUrgency(effectiveWeek ? tasks.filter(t => t.week_id === effectiveWeek.id) : [])
  const backlogTasks = sortByUrgency(tasks.filter(t => !t.week_id))

  const nextWeek = effectiveWeek
    ? (projectWeeks.find(w => w.start_date > effectiveWeek.start_date) ?? null)
    : null
  const pendingTasks = weekTasks.filter(t => !t.done)

  return (
    <div
      draggable={!nested && !isOpen}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
      style={nested ? {
        overflow: 'hidden',
        borderTop: '1px solid var(--gray3)',
        background: 'var(--white)',
      } : {
        border: `1px solid ${isOpen ? project.color_hex + '55' : isDragOver ? 'var(--primary)' : 'var(--gray3)'}`,
        borderRadius: 12, overflow: 'hidden',
        transition: 'border-color 0.2s, opacity 0.15s, box-shadow 0.2s',
        background: 'var(--white)',
        boxShadow: isDragOver
          ? `0 -3px 0 var(--primary), var(--shadow)`
          : isOpen ? `0 4px 20px ${project.color_hex}18` : 'var(--shadow)',
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      {/* Summary row */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 4px 1fr 100px 140px 90px 80px 130px 160px 28px',
          alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer',
          background: hov && !isOpen ? `linear-gradient(90deg, ${project.color_hex}08 0%, transparent 60%)` : 'transparent',
          transform: hov && !isOpen ? 'translateX(3px)' : 'translateX(0)',
          transition: 'background 0.25s ease, transform 0.25s ease',
        }}
      >
        {/* Drag handle */}
        <div
          onClick={e => e.stopPropagation()}
          title="Arrastar para reordenar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', color: hov ? 'var(--gray2)' : 'var(--gray3)',
            transition: 'color 0.15s', userSelect: 'none', fontSize: 14,
          }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
            <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
            <circle cx="2.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="11.5" r="1.5"/>
          </svg>
        </div>
        <div style={{
          width: 4, height: hov && !isOpen ? 40 : 28, borderRadius: 2,
          background: project.color_hex, flexShrink: 0,
          boxShadow: hov && !isOpen ? `0 0 8px ${project.color_hex}66` : 'none',
          transition: 'height 0.25s ease, box-shadow 0.25s ease',
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: hov && !isOpen ? project.color_hex : 'var(--black)', transition: 'color 0.18s ease',
          }}>
            {titleMode === 'client' ? (project.client?.name ?? 'Sem cliente') : titleMode === 'dev' ? (project.team_members?.join(', ') || 'Sem dev') : project.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {titleMode === 'client' ? project.name : titleMode === 'dev' ? project.name : (project.client?.name ?? '—')} · {TYPE_LABEL[project.type]}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: weekTasks.length > 0 ? 'var(--black)' : 'var(--gray2)' }}>
          {weekTasks.length > 0 ? weekTasks.length : '—'}
        </span>
        <TaskWeekSummary tasks={weekTasks} />
        <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 9px', borderRadius: 100, color: ps.color, background: ps.bg, whiteSpace: 'nowrap', width: 'fit-content' }}>
          {ps.label}
        </span>
        <span style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {project.gestor?.split(' ')[0] ?? '—'}
        </span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-start' }}>
          {project.end_date ? (
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray)' }}>
              {new Date(project.end_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }).replace('.', '')}
            </span>
          ) : <span style={{ fontSize: 11, color: 'var(--gray2)' }}>—</span>}
          {(() => {
            const tr = timeRemaining(project.end_date)
            if (!tr) return null
            return (
              <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, color: tr.color, background: tr.bg, whiteSpace: 'nowrap' }}>
                {tr.label}
              </span>
            )
          })()}
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso</span>
            <span style={{ fontSize: 11, fontWeight: 800, color: project.color_hex }}>{calcProgress(project.start_date, project.end_date)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${calcProgress(project.start_date, project.end_date)}%`, background: project.color_hex, borderRadius: 100 }} />
          </div>
        </div>
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{
          flexShrink: 0,
          transform: isOpen ? 'rotate(180deg)' : hov ? 'translateY(2px)' : 'none',
          transition: 'transform 0.25s ease',
        }}>
          <path d="M4 6l4 4 4-4" stroke={hov ? project.color_hex : 'var(--gray2)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.18s' }} />
        </svg>
      </div>

      {/* Expanded content */}
      <div style={{
        maxHeight: isOpen ? 2400 : 0, opacity: isOpen ? 1 : 0, overflow: 'hidden',
        transition: isOpen
          ? 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease 0.05s'
          : 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
      }}>
        <div style={{ borderTop: `1px solid ${project.color_hex}33`, padding: '16px 22px 20px' }}>

          {/* Equipe técnica */}
          {project.team_members && project.team_members.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', flexShrink: 0 }}>Equipe</span>
              {project.team_members.map(name => (
                <span key={name} style={{
                  fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 20,
                  background: project.color_hex + '15', color: project.color_hex,
                  border: `1px solid ${project.color_hex}35`,
                }}>{name}</span>
              ))}
            </div>
          )}

          {/* Week goals banner */}
          {effectiveWeek?.goals && (
            <div style={{
              padding: '7px 12px', borderRadius: 8, marginBottom: 14,
              background: `${project.color_hex}0E`, borderLeft: `3px solid ${project.color_hex}`,
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}>
              <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', flexShrink: 0, paddingTop: 1 }}>Meta</span>
              <span style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.5 }}>· {effectiveWeek.goals}</span>
            </div>
          )}

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)' }}>
                {effectiveWeek
                  ? `${weekTasks.length} entregáve${weekTasks.length !== 1 ? 'is' : 'l'}`
                  : 'Sem semana correspondente'}
              </span>
              <AddTaskButton onClick={e => { e.stopPropagation(); onAdd(effectiveWeek?.id) }} color={project.color_hex} />
              {nextWeek && pendingTasks.length > 0 && (
                <ReplicateButton
                  count={pendingTasks.length}
                  nextWeekLabel={`S${nextWeek.week_number}`}
                  color={project.color_hex}
                  onClick={e => { e.stopPropagation(); onReplicate(pendingTasks, nextWeek.id) }}
                />
              )}
            </div>
            <div style={{ position: 'relative', display: 'flex', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 8, padding: 2 }}>
              <div style={{
                position: 'absolute', top: 2, bottom: 2, width: 'calc(33.33% - 2px)',
                left: view === 'list' ? 2 : view === 'kanban' ? 'calc(33.33%)' : 'calc(66.66%)',
                background: 'var(--white)', borderRadius: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none',
              }} />
              {(['list', 'kanban', 'day'] as const).map(v => (
                <button key={v} onClick={e => { e.stopPropagation(); switchView(v) }} style={{
                  position: 'relative', zIndex: 1, width: 52, padding: '4px 0', borderRadius: 6,
                  fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: view === v ? 'var(--black)' : 'var(--gray2)',
                  transition: 'color 0.2s ease', textAlign: 'center',
                }}>
                  {v === 'list' ? 'Lista' : v === 'kanban' ? 'Kanban' : 'Dias'}
                </button>
              ))}
            </div>
          </div>

          {/* Task view */}
          <div key={viewKey} style={{ animation: 'viewSwitch 0.22s ease both' }}>
            {!effectiveWeek ? (
              <div style={{ fontSize: 12, color: 'var(--gray2)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                Este projeto não tem semana cadastrada para este período.
              </div>
            ) : weekTasks.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--gray2)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                Sem entregáveis nesta semana.
              </div>
            ) : view === 'kanban' ? (
              <KanbanView tasks={weekTasks} color={project.color_hex} project={project} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            ) : view === 'day' ? (
              <DayView tasks={weekTasks} weekStart={effectiveWeek.start_date} color={project.color_hex} project={project} onAdd={onAddForDay ? (date) => onAddForDay(effectiveWeek?.id, date) : undefined} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            ) : (
              <ListView tasks={weekTasks} color={project.color_hex} project={project} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            )}
          </div>

          {/* Backlog */}
          {view !== 'day' && (
          <BacklogSection
            tasks={backlogTasks}
            color={project.color_hex}
            project={project}
            view={view as 'list' | 'kanban'}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
          )}
        </div>
      </div>
    </div>
  )
}

// ── General Tasks Row ─────────────────────────────────────────────────────────
const GENERAL_COLOR = '#6366F1'

function GeneralTasksRow({ tasks, weeks, globalWeekStart, isOpen, onToggle, onAdd, onAddForDay, onEdit, onDelete, onStatusChange }: {
  tasks: Task[]
  weeks: Week[]
  globalWeekStart: string | null
  isOpen: boolean
  onToggle: () => void
  onAdd: (weekId?: string) => void
  onAddForDay?: (weekId: string | undefined, deadline: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
}) {
  const [view, setView]   = useState<'list' | 'kanban' | 'day'>('list')
  const [viewKey, setViewKey] = useState(0)
  const [hov, setHov]     = useState(false)

  function switchView(v: 'list' | 'kanban' | 'day') {
    if (v === view) return
    setView(v)
    setViewKey(k => k + 1)
  }

  const effectiveWeek = globalWeekStart
    ? weeks.find(w => w.start_date === globalWeekStart) ?? null
    : null
  const weekTasks    = sortByUrgency(effectiveWeek ? tasks.filter(t => t.week_id === effectiveWeek.id) : [])
  const backlogTasks = sortByUrgency(tasks.filter(t => !t.week_id))

  return (
    <div
      style={{
        border: `1px solid ${isOpen ? GENERAL_COLOR + '55' : 'var(--gray3)'}`,
        borderRadius: 12, overflow: 'hidden',
        background: 'var(--white)',
        boxShadow: isOpen ? `0 4px 20px ${GENERAL_COLOR}18` : 'var(--shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s',
      }}
    >
      {/* Summary row */}
      <div
        onClick={onToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 4px 1fr 100px 140px 90px 80px 130px 160px 28px',
          alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer',
          background: hov && !isOpen ? `linear-gradient(90deg, ${GENERAL_COLOR}08 0%, transparent 60%)` : 'transparent',
          transform: hov && !isOpen ? 'translateX(3px)' : 'translateX(0)',
          transition: 'background 0.25s ease, transform 0.25s ease',
        }}
      >
        {/* No drag handle — placeholder */}
        <div />
        <div style={{
          width: 4, height: hov && !isOpen ? 40 : 28, borderRadius: 2,
          background: GENERAL_COLOR, flexShrink: 0,
          boxShadow: hov && !isOpen ? `0 0 8px ${GENERAL_COLOR}66` : 'none',
          transition: 'height 0.25s ease, box-shadow 0.25s ease',
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 800,
            color: hov && !isOpen ? GENERAL_COLOR : isOpen ? GENERAL_COLOR : 'var(--black)',
            transition: 'color 0.18s ease',
          }}>
            Entregáveis gerais
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>
            Tarefas não vinculadas a projetos específicos
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: weekTasks.length > 0 ? 'var(--black)' : 'var(--gray2)' }}>
          {weekTasks.length > 0 ? weekTasks.length : '—'}
        </span>
        <TaskWeekSummary tasks={weekTasks} />
        {/* Span remaining columns */}
        <div /><div /><div /><div />
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none" style={{
          flexShrink: 0,
          transform: isOpen ? 'rotate(180deg)' : hov ? 'translateY(2px)' : 'none',
          transition: 'transform 0.25s ease',
        }}>
          <path d="M4 6l4 4 4-4" stroke={hov ? GENERAL_COLOR : 'var(--gray2)'} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'stroke 0.18s' }} />
        </svg>
      </div>

      {/* Expanded content */}
      <div style={{
        maxHeight: isOpen ? 2400 : 0, opacity: isOpen ? 1 : 0, overflow: 'hidden',
        transition: isOpen
          ? 'max-height 0.4s cubic-bezier(0.4,0,0.2,1), opacity 0.3s ease 0.05s'
          : 'max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.2s ease',
      }}>
        <div style={{ borderTop: `1px solid ${GENERAL_COLOR}33`, padding: '16px 22px 20px' }}>

          {/* Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)' }}>
                {effectiveWeek
                  ? `${weekTasks.length} entregáve${weekTasks.length !== 1 ? 'is' : 'l'}`
                  : 'Sem semana correspondente'}
              </span>
              <AddTaskButton onClick={e => { e.stopPropagation(); onAdd(effectiveWeek?.id) }} color={GENERAL_COLOR} />
            </div>
            <div style={{ position: 'relative', display: 'flex', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 8, padding: 2 }}>
              <div style={{
                position: 'absolute', top: 2, bottom: 2, width: 'calc(33.33% - 2px)',
                left: view === 'list' ? 2 : view === 'kanban' ? 'calc(33.33%)' : 'calc(66.66%)',
                background: 'var(--white)', borderRadius: 6,
                boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
                transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)', pointerEvents: 'none',
              }} />
              {(['list', 'kanban', 'day'] as const).map(v => (
                <button key={v} onClick={e => { e.stopPropagation(); switchView(v) }} style={{
                  position: 'relative', zIndex: 1, width: 52, padding: '4px 0', borderRadius: 6,
                  fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer',
                  background: 'transparent', color: view === v ? 'var(--black)' : 'var(--gray2)',
                  transition: 'color 0.2s ease', textAlign: 'center',
                }}>
                  {v === 'list' ? 'Lista' : v === 'kanban' ? 'Kanban' : 'Dias'}
                </button>
              ))}
            </div>
          </div>

          {/* Task view */}
          <div key={viewKey} style={{ animation: 'viewSwitch 0.22s ease both' }}>
            {!effectiveWeek ? (
              <div style={{ fontSize: 12, color: 'var(--gray2)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                Este período não tem semana correspondente.
              </div>
            ) : weekTasks.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--gray2)', fontStyle: 'italic', padding: '16px 0', textAlign: 'center' }}>
                Sem entregáveis gerais nesta semana.
              </div>
            ) : view === 'kanban' ? (
              <KanbanView tasks={weekTasks} color={GENERAL_COLOR} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            ) : view === 'day' ? (
              <DayView tasks={weekTasks} weekStart={effectiveWeek.start_date} color={GENERAL_COLOR} onAdd={onAddForDay ? (date) => onAddForDay(effectiveWeek?.id, date) : undefined} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            ) : (
              <ListView tasks={weekTasks} color={GENERAL_COLOR} onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange} />
            )}
          </div>

          {/* Backlog */}
          {view !== 'day' && (
          <BacklogSection
            tasks={backlogTasks}
            color={GENERAL_COLOR}
            view={view as 'list' | 'kanban'}
            onEdit={onEdit}
            onDelete={onDelete}
            onStatusChange={onStatusChange}
          />
          )}
        </div>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
// ── Filter Dropdown ───────────────────────────────────────────────────────────
function FilterDropdown({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open,     setOpen]    = useState(false)
  const [pos,      setPos]     = useState<{ top: number; left: number; width: number } | null>(null)
  const [hovTrig,  setHovTrig] = useState(false)
  const [hovItem,  setHovItem] = useState<string | null>(null)
  const ref      = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const active   = value !== ''
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        ref.current      && !ref.current.contains(t) &&
        panelRef.current && !panelRef.current.contains(t)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function toggle() {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 160) })
    }
    setOpen(o => !o)
  }

  function pick(v: string) { onChange(v); setOpen(false) }

  return (
    <>
      <button
        ref={ref}
        onClick={toggle}
        onMouseEnter={() => setHovTrig(true)}
        onMouseLeave={() => setHovTrig(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 8,
          border: `1px solid ${active || open ? 'var(--primary)' : hovTrig ? 'var(--gray2)' : 'var(--gray3)'}`,
          background: active || open
            ? hovTrig ? 'var(--primary-dim)' : 'var(--primary-dim)'
            : hovTrig ? 'rgba(0,0,0,0.04)' : 'var(--white)',
          color: active || open ? 'var(--primary-text)' : hovTrig ? 'var(--black)' : 'var(--gray)',
          fontSize: 11, fontWeight: active ? 700 : 500,
          cursor: 'pointer', outline: 'none',
          transition: 'border-color 0.15s, background 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {selected ? selected.label : label}
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" style={{ flexShrink: 0, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
          <path d="M1 1L4.5 5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width,
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            zIndex: 2000, overflow: 'hidden',
            animation: 'fadeIn 0.12s ease both',
          }}
        >
          <button
            onClick={() => pick('')}
            onMouseEnter={() => setHovItem('__all__')}
            onMouseLeave={() => setHovItem(null)}
            style={{
              width: '100%', textAlign: 'left', padding: '8px 12px',
              background: value === '' ? 'var(--primary-dim)' : hovItem === '__all__' ? 'rgba(0,0,0,0.04)' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--gray3)',
              fontSize: 11, fontWeight: 600,
              color: value === '' ? 'var(--primary-text)' : hovItem === '__all__' ? 'var(--black)' : 'var(--gray2)',
              cursor: 'pointer', transition: 'background 0.12s, color 0.12s',
            }}
          >
            {label} — todos
          </button>
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              onMouseEnter={() => setHovItem(o.value)}
              onMouseLeave={() => setHovItem(null)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                background: value === o.value ? 'var(--primary-dim)' : hovItem === o.value ? 'rgba(0,0,0,0.04)' : 'transparent',
                border: 'none',
                fontSize: 11, fontWeight: value === o.value ? 700 : 500,
                color: value === o.value ? 'var(--primary-text)' : 'var(--black)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                transition: 'background 0.12s',
              }}
            >
              {o.label}
              {value === o.value && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Sort header cell ───────────────────────────────────────────────────────────
type SortKey = 'name' | 'deadline' | 'progress' | 'tasks'
function SortCell({ label, col, sortBy, sortDir, onSort, style }: {
  label: string; col: SortKey; sortBy: SortKey; sortDir: 'asc' | 'desc'
  onSort: (col: SortKey) => void; style?: React.CSSProperties
}) {
  const [hov, setHov] = useState(false)
  const active = sortBy === col
  return (
    <div
      onClick={() => onSort(col)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', userSelect: 'none',
        fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em',
        color: active ? 'var(--black)' : hov ? 'var(--gray)' : 'var(--gray2)',
        transition: 'color 0.15s',
        ...style,
      }}
    >
      {label}
      <svg width={8} height={8} viewBox="0 0 8 8" fill="none" style={{ opacity: active ? 1 : hov ? 0.5 : 0.3, transition: 'opacity 0.15s' }}>
        {active && sortDir === 'asc'
          ? <path d="M4 6.5V1.5M1.5 4L4 1.5 6.5 4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
          : <path d="M4 1.5v5M1.5 4L4 6.5 6.5 4" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round" />
        }
      </svg>
    </div>
  )
}

// ── Export week dropdown ──────────────────────────────────────────────────────
function ExportWeekButton({ onExport, devs }: { onExport: (dev?: string) => void; devs: string[] }) {
  const [open, setOpen] = useState(false)
  const [hov,  setHov]  = useState(false)
  const [hovItem, setHovItem] = useState<string | null>(null)
  const ref     = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)

  useEffect(() => {
    if (!open) return
    function close(e: MouseEvent) {
      const t = e.target as Node
      if (ref.current?.contains(t) || panelRef.current?.contains(t)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function toggle() {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left })
    }
    setOpen(o => !o)
  }

  function pick(dev?: string) { onExport(dev); setOpen(false) }

  return (
    <>
      <button
        ref={ref}
        onClick={toggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 12px', borderRadius: 8,
          border: `1px solid ${open || hov ? 'var(--gray2)' : 'var(--gray3)'}`,
          background: open || hov ? 'var(--white)' : 'transparent',
          color: open || hov ? 'var(--black)' : 'var(--gray)',
          fontSize: 11, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.15s',
        }}
      >
        <svg width={12} height={12} viewBox="0 0 16 16" fill="none">
          <path d="M4 5V2h8v3M4 11H2V7a1 1 0 011-1h10a1 1 0 011 1v4h-2M4 9h8v5H4V9z"
            stroke="currentColor" strokeWidth={1.5} strokeLinejoin="round"/>
        </svg>
        Exportar semana
        <svg width={8} height={5} viewBox="0 0 8 5" fill="none"
          style={{ opacity: 0.5, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1 1l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left,
            minWidth: 200, zIndex: 3000,
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            overflow: 'hidden', animation: 'fadeIn 0.12s ease both',
          }}
        >
          {/* Geral */}
          <button
            onClick={() => pick(undefined)}
            onMouseEnter={() => setHovItem('__all__')}
            onMouseLeave={() => setHovItem(null)}
            style={{
              width: '100%', textAlign: 'left', padding: '9px 13px',
              border: 'none', borderBottom: devs.length > 0 ? '1px solid var(--gray3)' : 'none',
              background: hovItem === '__all__' ? 'var(--bg)' : 'transparent',
              fontSize: 12, fontWeight: 600, color: 'var(--black)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: 'background 0.12s',
            }}
          >
            <svg width={13} height={13} viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="1.5" width="13" height="13" rx="2.5" stroke="var(--gray2)" strokeWidth={1.4}/>
              <path d="M4 5.5h8M4 8h8M4 10.5h5" stroke="var(--gray2)" strokeWidth={1.2} strokeLinecap="round"/>
            </svg>
            Relatório geral
          </button>

          {/* One per dev */}
          {devs.map(dev => (
            <button
              key={dev}
              onClick={() => pick(dev)}
              onMouseEnter={() => setHovItem(dev)}
              onMouseLeave={() => setHovItem(null)}
              style={{
                width: '100%', textAlign: 'left', padding: '9px 13px',
                border: 'none', background: hovItem === dev ? 'var(--bg)' : 'transparent',
                fontSize: 12, fontWeight: 500, color: 'var(--black)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                transition: 'background 0.12s',
              }}
            >
              <span style={{
                width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 800, color: 'var(--primary-text)',
              }}>
                {dev.split(' ').slice(0,2).map((n: string) => n[0]).join('').toUpperCase()}
              </span>
              {dev}
            </button>
          ))}

          {devs.length === 0 && (
            <div style={{ padding: '8px 13px 10px', fontSize: 11, color: 'var(--gray2)' }}>
              Nenhum responsável atribuído esta semana.
            </div>
          )}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Dev group row ─────────────────────────────────────────────────────────────
function DevGroupRow({ devName, devColor, projects, tasks, weeks, globalWeekStart, openIds, onToggle, onAdd, onAddForDay, onEdit, onDelete, onStatusChange, onReplicate, isOpen, onGroupToggle, isDragging, isDragOver, onDragStart, onDragEnd, onDragOver, onDrop }: {
  devName: string
  devColor: string
  projects: Project[]
  tasks: Task[]
  weeks: Week[]
  globalWeekStart: string | null
  openIds: Set<string>
  onToggle: (id: string) => void
  onAdd: (projectId: string, weekId?: string) => void
  onAddForDay?: (projectId: string, weekId: string | undefined, deadline: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
  onReplicate: (tasks: Task[], toWeekId: string) => void
  isOpen: boolean
  onGroupToggle: () => void
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: () => void
  onDrop: () => void
}) {
  const [hov, setHov] = useState(false)

  const effectiveWeek = globalWeekStart
    ? weeks.find(w => w.start_date === globalWeekStart) ?? null
    : null
  const allWeekTasks = projects.flatMap(p =>
    tasks.filter(t => t.project_id === p.id && (effectiveWeek ? t.week_id === effectiveWeek.id : false))
  )

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
      style={{
        border: `1px solid ${isOpen ? devColor + '55' : isDragOver ? 'var(--primary)' : 'var(--gray3)'}`,
        borderRadius: 12, overflow: 'hidden',
        background: 'var(--white)',
        boxShadow: isDragOver
          ? `0 -3px 0 var(--primary), var(--shadow)`
          : isOpen ? `0 4px 20px ${devColor}18` : 'var(--shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.15s',
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      <div
        onClick={onGroupToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 4px 1fr 100px 140px 90px 80px 130px 160px 28px',
          alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer',
          background: isOpen ? `${devColor}06` : hov ? `${devColor}04` : 'transparent',
          transition: 'background 0.25s ease',
        }}
      >
        {/* Drag handle */}
        <div
          onClick={e => e.stopPropagation()}
          title="Arrastar para reordenar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', color: hov ? 'var(--gray2)' : 'var(--gray3)',
            transition: 'color 0.15s', userSelect: 'none',
          }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
            <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
            <circle cx="2.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="11.5" r="1.5"/>
          </svg>
        </div>
        <div style={{
          width: 4, height: isOpen ? 40 : 28, borderRadius: 2,
          background: devColor, flexShrink: 0,
          boxShadow: isOpen ? `0 0 8px ${devColor}66` : 'none',
          transition: 'height 0.25s ease, box-shadow 0.25s ease',
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 800,
            color: isOpen || hov ? devColor : 'var(--black)',
            transition: 'color 0.18s ease',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {devName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: allWeekTasks.length > 0 ? 'var(--black)' : 'var(--gray2)' }}>
          {allWeekTasks.length > 0 ? allWeekTasks.length : '—'}
        </span>
        <TaskWeekSummary tasks={allWeekTasks} />
        <div /><div /><div /><div />
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}
        >
          <path d="M6 4l4 4-4 4" stroke="var(--gray2)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {isOpen && projects.map(project => (
        <ProjectRow
          key={project.id}
          project={project}
          tasks={tasks.filter(t => t.project_id === project.id)}
          isOpen={openIds.has(project.id)}
          onToggle={() => onToggle(project.id)}
          onAdd={(weekId) => onAdd(project.id, weekId)}
          onAddForDay={onAddForDay ? (weekId, deadline) => onAddForDay(project.id, weekId, deadline) : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onReplicate={onReplicate}
          globalWeekStart={globalWeekStart}
          weeks={weeks}
          titleMode="project"
          nested
          isDragging={false}
          isDragOver={false}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
        />
      ))}
    </div>
  )
}

// ── Client group row ──────────────────────────────────────────────────────────
function ClientGroupRow({ clientId, clientName, clientColor, projects, tasks, weeks, globalWeekStart, openIds, onToggle, onAdd, onAddForDay, onEdit, onDelete, onStatusChange, onReplicate, isOpen, onGroupToggle, isDragging, isDragOver, onDragStart, onDragEnd, onDragOver, onDrop }: {
  clientId: string
  clientName: string
  clientColor: string
  projects: Project[]
  tasks: Task[]
  weeks: Week[]
  globalWeekStart: string | null
  openIds: Set<string>
  onToggle: (id: string) => void
  onAdd: (projectId: string, weekId?: string) => void
  onAddForDay?: (projectId: string, weekId: string | undefined, deadline: string) => void
  onEdit: (t: Task) => void
  onDelete: (id: string) => void
  onStatusChange: (id: string, done: boolean) => void
  onReplicate: (tasks: Task[], toWeekId: string) => void
  isOpen: boolean
  onGroupToggle: () => void
  isDragging: boolean
  isDragOver: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onDragOver: () => void
  onDrop: () => void
}) {
  const [hov, setHov] = useState(false)

  const effectiveWeek = globalWeekStart
    ? weeks.find(w => w.start_date === globalWeekStart) ?? null
    : null
  const allWeekTasks = projects.flatMap(p =>
    tasks.filter(t => t.project_id === p.id && (effectiveWeek ? t.week_id === effectiveWeek.id : false))
  )

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={e => { e.preventDefault(); onDragOver() }}
      onDrop={e => { e.preventDefault(); onDrop() }}
      style={{
        border: `1px solid ${isOpen ? clientColor + '55' : isDragOver ? 'var(--primary)' : 'var(--gray3)'}`,
        borderRadius: 12, overflow: 'hidden',
        background: 'var(--white)',
        boxShadow: isDragOver
          ? `0 -3px 0 var(--primary), var(--shadow)`
          : isOpen ? `0 4px 20px ${clientColor}18` : 'var(--shadow)',
        transition: 'border-color 0.2s, box-shadow 0.2s, opacity 0.15s',
        opacity: isDragging ? 0.45 : 1,
      }}
    >
      {/* Group header */}
      <div
        onClick={onGroupToggle}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          display: 'grid',
          gridTemplateColumns: '16px 4px 1fr 100px 140px 90px 80px 130px 160px 28px',
          alignItems: 'center', gap: 16, padding: '14px 18px', cursor: 'pointer',
          background: isOpen ? `${clientColor}06` : hov ? `${clientColor}04` : 'transparent',
          transition: 'background 0.25s ease',
        }}
      >
        {/* Drag handle */}
        <div
          onClick={e => e.stopPropagation()}
          title="Arrastar para reordenar"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'grab', color: hov ? 'var(--gray2)' : 'var(--gray3)',
            transition: 'color 0.15s', userSelect: 'none',
          }}
        >
          <svg width="10" height="14" viewBox="0 0 10 14" fill="currentColor">
            <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
            <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
            <circle cx="2.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="11.5" r="1.5"/>
          </svg>
        </div>
        <div style={{
          width: 4, height: isOpen ? 40 : 28, borderRadius: 2,
          background: clientColor, flexShrink: 0,
          boxShadow: isOpen ? `0 0 8px ${clientColor}66` : 'none',
          transition: 'height 0.25s ease, box-shadow 0.25s ease',
        }} />
        <div style={{ minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 800,
            color: isOpen || hov ? clientColor : 'var(--black)',
            transition: 'color 0.18s ease',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {clientName}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''}
          </div>
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: allWeekTasks.length > 0 ? 'var(--black)' : 'var(--gray2)' }}>
          {allWeekTasks.length > 0 ? allWeekTasks.length : '—'}
        </span>
        <TaskWeekSummary tasks={allWeekTasks} />
        <div /><div /><div /><div />
        <svg width={16} height={16} viewBox="0 0 16 16" fill="none"
          style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease', flexShrink: 0 }}
        >
          <path d="M6 4l4 4-4 4" stroke="var(--gray2)" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Project rows inside group */}
      {isOpen && projects.map(project => (
        <ProjectRow
          key={project.id}
          project={project}
          tasks={tasks.filter(t => t.project_id === project.id)}
          isOpen={openIds.has(project.id)}
          onToggle={() => onToggle(project.id)}
          onAdd={(weekId) => onAdd(project.id, weekId)}
          onAddForDay={onAddForDay ? (weekId, deadline) => onAddForDay(project.id, weekId, deadline) : undefined}
          onEdit={onEdit}
          onDelete={onDelete}
          onStatusChange={onStatusChange}
          onReplicate={onReplicate}
          globalWeekStart={globalWeekStart}
          weeks={weeks}
          titleMode="project"
          nested
          isDragging={false}
          isDragOver={false}
          onDragStart={() => {}}
          onDragEnd={() => {}}
          onDragOver={() => {}}
          onDrop={() => {}}
        />
      ))}
    </div>
  )
}

export function ProjectsView({ autoExpandId }: { autoExpandId?: string } = {}) {
  const tasks        = useTasksStore(s => s.tasks)
  const fetchTasks   = useTasksStore(s => s.fetchTasks)
  const addTask      = useTasksStore(s => s.addTask)
  const updateTask   = useTasksStore(s => s.updateTask)
  const deleteTask_  = useTasksStore(s => s.deleteTask)
  const toggleDone   = useTasksStore(s => s.toggleDone)

  const [projects,      setProjects]      = useState<Project[]>([])
  const [weeks,         setWeeks]         = useState<Week[]>([])
  const [loadingProj,   setLoadingProj]   = useState(true)
  const [titleMode,     setTitleMode]     = useState<'project' | 'client' | 'dev'>('project')
  const [manualOrder,   setManualOrder]   = useState<string[]>([])
  const [dragSrcId,      setDragSrcId]      = useState<string | null>(null)
  const [dragOverId,     setDragOverId]     = useState<string | null>(null)
  const [dragSrcGroupId,    setDragSrcGroupId]    = useState<string | null>(null)
  const [dragOverGroupId,   setDragOverGroupId]   = useState<string | null>(null)
  const [dragSrcDevGroupId, setDragSrcDevGroupId] = useState<string | null>(null)
  const [dragOverDevGroupId,setDragOverDevGroupId]= useState<string | null>(null)
  const [devGroupOrder,     setDevGroupOrder]     = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/weeks').then(r => r.json()),
    ]).then(([p, w]: [Project[], Week[]]) => {
      setProjects(p)
      setWeeks(w)
      setLoadingProj(false)
      // Restore manual order if persisted
      const withOrder = p.filter(proj => (proj.display_order ?? 0) > 0)
      if (withOrder.length > 0) {
        const sorted = [...p].sort((a, b) => {
          const oa = (a.display_order ?? 0) > 0 ? (a.display_order as number) : 999999
          const ob = (b.display_order ?? 0) > 0 ? (b.display_order as number) : 999999
          return oa - ob
        })
        setManualOrder(sorted.map(proj => proj.id))
      }
      // Auto-expand a specific project (from Quick Search "Abrir em Gestão")
      if (autoExpandId) {
        const target = p.find((proj: Project) => proj.id === autoExpandId)
        if (target) {
          setOpenIds(new Set([autoExpandId]))
          setOpenGroupIds(new Set([target.client_id]))
          setOpenDevGroupIds(new Set(target.team_members ?? []))
        }
      }
    })
    fetchTasks()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [openIds,         setOpenIds]         = useState<Set<string>>(new Set())
  const [openGroupIds,    setOpenGroupIds]    = useState<Set<string>>(new Set())
  const [openDevGroupIds, setOpenDevGroupIds] = useState<Set<string>>(new Set())
  const [editing,         setEditing]         = useState<Task | null>(null)
  const [deletingFromModal, setDeletingFromModal] = useState<Task | null>(null)
  // addingFor: null = modal closed, '' = general task, '<id>' = project task
  const [addingFor,          setAddingFor]          = useState<string | null>(null)
  const [addingForWeekId,    setAddingForWeekId]    = useState<string | null>(null)
  const [addingForDeadline,  setAddingForDeadline]  = useState<string | undefined>(undefined)
  const [generalOpen,     setGeneralOpen]     = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [filterType,   setFilterType]   = useState<string>('')
  const [filterGestor, setFilterGestor] = useState<string>('')
  const [filterClient, setFilterClient] = useState<string>('')
  const [filterSemana, setFilterSemana] = useState<string>('')
  const [filterDev,    setFilterDev]    = useState<string>('')
  const [sortBy,  setSortBy]  = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  // ── Global week navigation ──────────────────────────────────────────────────
  const allGlobalWeeks = useMemo<{ start_date: string; end_date: string }[]>(() => {
    const map = new Map<string, { start_date: string; end_date: string }>()
    weeks.forEach(w => { if (!map.has(w.start_date)) map.set(w.start_date, { start_date: w.start_date, end_date: w.end_date }) })
    return Array.from(map.values()).sort((a, b) => a.start_date.localeCompare(b.start_date))
  }, [weeks])

  const todayStr = localToday()
  const [globalWeekIdx, setGlobalWeekIdx] = useState(0)

  useEffect(() => {
    if (allGlobalWeeks.length === 0) return
    const idx = allGlobalWeeks.findIndex(w => w.start_date <= todayStr && todayStr <= w.end_date)
    setGlobalWeekIdx(idx >= 0 ? idx : allGlobalWeeks.length - 1)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allGlobalWeeks])
  const globalWeekStart = allGlobalWeeks[globalWeekIdx]?.start_date ?? null

  function clearManualOrder() {
    setManualOrder([])
    fetch('/api/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [] }),
    })
  }

  function onSort(col: SortKey) {
    if (manualOrder.length > 0) clearManualOrder()
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  function handleGroupDrop(targetClientId: string) {
    if (!dragSrcGroupId || dragSrcGroupId === targetClientId) {
      setDragSrcGroupId(null); setDragOverGroupId(null); return
    }
    // Current group order derived from clientGroups (already respects manualOrder)
    const currentOrder = clientGroups.map(g => g.clientId)
    const srcIdx = currentOrder.indexOf(dragSrcGroupId)
    const tgtIdx = currentOrder.indexOf(targetClientId)
    if (srcIdx === -1 || tgtIdx === -1) { setDragSrcGroupId(null); setDragOverGroupId(null); return }

    const newGroupOrder = [...currentOrder]
    newGroupOrder.splice(srcIdx, 1)
    const newTgt = newGroupOrder.indexOf(targetClientId)
    newGroupOrder.splice(newTgt, 0, dragSrcGroupId)

    // Build a map of clientId → project IDs (in current relative order)
    const groupMap = new Map(clientGroups.map(g => [g.clientId, g.projects.map(p => p.id)]))
    // Flatten groups in new order → new project manualOrder
    const newProjectOrder = newGroupOrder.flatMap(cid => groupMap.get(cid) ?? [])
    // Include any projects not currently displayed (filtered out) at the end
    const allIds = projects.map(p => p.id)
    const fullOrder = [
      ...newProjectOrder.filter(id => allIds.includes(id)),
      ...allIds.filter(id => !newProjectOrder.includes(id)),
    ]

    setManualOrder(fullOrder)
    setDragSrcGroupId(null)
    setDragOverGroupId(null)

    fetch('/api/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: fullOrder }),
    })
  }

  function handleDevGroupDrop(targetDevName: string) {
    if (!dragSrcDevGroupId || dragSrcDevGroupId === targetDevName) {
      setDragSrcDevGroupId(null); setDragOverDevGroupId(null); return
    }
    const currentOrder = devGroupOrder.length > 0
      ? devGroupOrder
      : orderedDevGroups.map(g => g.devName)
    const srcIdx = currentOrder.indexOf(dragSrcDevGroupId)
    if (srcIdx === -1) { setDragSrcDevGroupId(null); setDragOverDevGroupId(null); return }
    const newOrder = [...currentOrder]
    newOrder.splice(srcIdx, 1)
    const newTgt = newOrder.indexOf(targetDevName)
    newOrder.splice(newTgt, 0, dragSrcDevGroupId)
    setDevGroupOrder(newOrder)
    setDragSrcDevGroupId(null)
    setDragOverDevGroupId(null)
  }

  function handleDrop(targetId: string) {
    if (!dragSrcId || dragSrcId === targetId) {
      setDragSrcId(null); setDragOverId(null); return
    }
    const base = manualOrder.length > 0
      ? [...manualOrder]
      : projects.map(p => p.id)
    const srcIdx = base.indexOf(dragSrcId)
    const tgtIdx = base.indexOf(targetId)
    if (srcIdx === -1 || tgtIdx === -1) { setDragSrcId(null); setDragOverId(null); return }
    base.splice(srcIdx, 1)
    const newTgt = base.indexOf(targetId)
    base.splice(newTgt, 0, dragSrcId)
    setManualOrder(base)
    setDragSrcId(null)
    setDragOverId(null)
    fetch('/api/projects/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: base }),
    })
  }

  const gestores = Array.from(new Set(projects.map(p => p.gestor).filter(Boolean))) as string[]
  const devOpts = Array.from(
    new Set(projects.flatMap(p => p.team_members ?? []))
  ).sort().map(d => ({ value: d, label: d }))
  const clientOpts = Array.from(
    new Map(projects.filter(p => p.client).map(p => [p.client_id, p.client!.name])).entries()
  ).map(([value, label]) => ({ value, label })).sort((a, b) => a.label.localeCompare(b.label))

  const displayed = projects
    .filter(p => {
      if (filterStatus && p.status !== filterStatus) return false
      if (filterType   && p.type   !== filterType)   return false
      if (filterGestor && p.gestor !== filterGestor) return false
      if (filterClient && p.client_id !== filterClient) return false
      if (filterDev    && !(p.team_members ?? []).includes(filterDev)) return false
      if (filterSemana) {
        const effectiveW = globalWeekStart
          ? weeks.find(w => w.start_date === globalWeekStart) ?? null
          : null
        const weekPts   = effectiveW ? tasks.filter(t => t.project_id === p.id && t.week_id === effectiveW.id) : []
        const concluded = weekPts.length > 0 && weekPts.every(t => t.done)
        if (filterSemana === 'concluded'     && !concluded) return false
        if (filterSemana === 'not_concluded' && concluded)  return false
      }
      return true
    })
    .sort((a, b) => {
      let cmp = 0
      if (sortBy === 'name')     cmp = a.name.localeCompare(b.name)
      if (sortBy === 'progress') cmp = calcProgress(a.start_date, a.end_date) - calcProgress(b.start_date, b.end_date)
      if (sortBy === 'tasks') {
        const weekForProject = (pid: string) => {
          if (!globalWeekStart) return null
          return weeks.find(w => w.start_date === globalWeekStart)
        }
        const countA = (() => { const w = weekForProject(a.id); return w ? tasks.filter(t => t.project_id === a.id && t.week_id === w.id).length : 0 })()
        const countB = (() => { const w = weekForProject(b.id); return w ? tasks.filter(t => t.project_id === b.id && t.week_id === w.id).length : 0 })()
        cmp = countA - countB
      }
      if (sortBy === 'deadline') {
        const da = a.end_date ? new Date(a.end_date).getTime() : Infinity
        const db = b.end_date ? new Date(b.end_date).getTime() : Infinity
        cmp = da - db
      }
      return sortDir === 'asc' ? cmp : -cmp
    })

  const orderedDisplayed = useMemo(() => {
    if (manualOrder.length === 0) return displayed
    return [...displayed].sort((a, b) => {
      const ia = manualOrder.indexOf(a.id)
      const ib = manualOrder.indexOf(b.id)
      return (ia === -1 ? 999999 : ia) - (ib === -1 ? 999999 : ib)
    })
  }, [displayed, manualOrder])

  function toggle(id: string) {
    setOpenIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const clientGroups = useMemo(() => {
    if (titleMode !== 'client') return []
    const map = new Map<string, { clientName: string; clientColor: string; projects: Project[] }>()
    orderedDisplayed.forEach(p => {
      const key = p.client_id
      if (!map.has(key)) map.set(key, {
        clientName:  p.client?.name     ?? 'Sem cliente',
        clientColor: p.client?.color_hex ?? '#84CC16',
        projects: [],
      })
      map.get(key)!.projects.push(p)
    })
    return Array.from(map.entries()).map(([clientId, data]) => ({ clientId, ...data }))
  }, [titleMode, orderedDisplayed])

  const DEV_PALETTE = ['#7C3AED','#0284C7','#059669','#B45309','#DC2626','#DB2777','#2563EB','#0891B2']
  const devGroups = useMemo(() => {
    if (titleMode !== 'dev') return []
    const map = new Map<string, Project[]>()
    orderedDisplayed.forEach(p => {
      const devs = (p.team_members ?? []).length > 0 ? (p.team_members as string[]) : ['Sem dev']
      devs.forEach(dev => {
        if (!map.has(dev)) map.set(dev, [])
        map.get(dev)!.push(p)
      })
    })
    return Array.from(map.entries()).map(([devName, devProjects], idx) => ({
      devName,
      devColor: devName === 'Sem dev' ? '#94A3B8' : DEV_PALETTE[idx % DEV_PALETTE.length],
      projects: devProjects,
    }))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [titleMode, orderedDisplayed])

  const orderedDevGroups = useMemo(() => {
    if (devGroupOrder.length === 0) return devGroups
    return [...devGroups].sort((a, b) => {
      const ia = devGroupOrder.indexOf(a.devName)
      const ib = devGroupOrder.indexOf(b.devName)
      return (ia === -1 ? 999999 : ia) - (ib === -1 ? 999999 : ib)
    })
  }, [devGroups, devGroupOrder])

  function toggleGroup(clientId: string) {
    setOpenGroupIds(prev => {
      const next = new Set(prev)
      next.has(clientId) ? next.delete(clientId) : next.add(clientId)
      return next
    })
  }

  function toggleDevGroup(devName: string) {
    setOpenDevGroupIds(prev => {
      const next = new Set(prev)
      next.has(devName) ? next.delete(devName) : next.add(devName)
      return next
    })
  }

  const allExpanded = titleMode === 'client'
    ? clientGroups.length > 0 && clientGroups.every(g => openGroupIds.has(g.clientId))
    : titleMode === 'dev'
    ? devGroups.length > 0 && devGroups.every(g => openDevGroupIds.has(g.devName))
    : orderedDisplayed.length > 0 && orderedDisplayed.every(p => openIds.has(p.id))

  function toggleAll() {
    if (titleMode === 'client') {
      if (allExpanded) setOpenGroupIds(new Set())
      else setOpenGroupIds(new Set(clientGroups.map(g => g.clientId)))
    } else if (titleMode === 'dev') {
      if (allExpanded) setOpenDevGroupIds(new Set())
      else setOpenDevGroupIds(new Set(devGroups.map(g => g.devName)))
    } else {
      if (allExpanded) setOpenIds(new Set())
      else setOpenIds(new Set(orderedDisplayed.map(p => p.id)))
    }
  }

  function handleSave(_projectId: string, data: FormState) {
    if (editing) {
      updateTask(editing.id, {
        ...data,
        project_id:   data.project_id || undefined,
        week_id:      data.week_id ?? undefined,
        description:  data.description || undefined,
        urgency:      data.urgency || undefined,
        assigned_to:  data.assigned_to || undefined,
        member_id:    data.member_id   || undefined,
        flags:        data.flags.length ? data.flags : undefined,
        flag_comment: data.flag_comment || undefined,
        deadline:     data.deadline || undefined,
      })
      toast.success('Entregável atualizado', data.title)
    } else {
      const newTask: Task = {
        id: crypto.randomUUID(),
        project_id:   data.project_id || undefined,
        week_id:      data.week_id ?? undefined,
        title:        data.title,
        description:  data.description || undefined,
        urgency:      data.urgency || undefined,
        done:         data.done,
        assigned_to:  data.assigned_to || undefined,
        member_id:    data.member_id   || undefined,
        flags:        data.flags.length ? data.flags : undefined,
        flag_comment: data.flag_comment || undefined,
        deadline:     data.deadline || undefined,
        created_at:   new Date().toISOString(),
      }
      addTask(newTask)
      toast.success('Entregável criado', data.title)
    }
    setEditing(null)
    setAddingFor(null)
    setAddingForWeekId(null)
    setAddingForDeadline(undefined)
  }

  function handleDelete(id: string) {
    deleteTask_(id)
    toast.success('Entregável excluído')
  }

  function handleStatusChange(id: string, done: boolean) {
    toggleDone(id, done)
  }

  function handleReplicate(pendingTasks: Task[], toWeekId: string) {
    pendingTasks.forEach(t => {
      addTask({
        ...t,
        id: crypto.randomUUID(),
        week_id: toWeekId,
        done: false,
        created_at: new Date().toISOString(),
      })
    })
    const n = pendingTasks.length
    toast.success(
      'Entregáveis replicados',
      `${n} entregáve${n !== 1 ? 'is' : 'l'} pendente${n !== 1 ? 's' : ''} copiado${n !== 1 ? 's' : ''} para a próxima semana.`
    )
  }

  // For general tasks project_id is undefined — fall back to '' so modal renders
  const modalProjectId = editing !== null
    ? (editing.project_id ?? '')
    : addingFor
  const isShowingModal = editing !== null || addingFor !== null

  const activeFilters = [filterStatus, filterType, filterGestor, filterClient, filterSemana, filterDev].filter(Boolean).length

  // General tasks — not linked to any project
  const generalTasks = tasks.filter(t => !t.project_id)

  // Devs with tasks assigned this week (for export dropdown)
  const weekDevsThisWeek = useMemo(() => {
    const weekIds = new Set(weeks.filter(w => w.start_date === (allGlobalWeeks[globalWeekIdx]?.start_date ?? '')).map(w => w.id))
    const names = new Set<string>()
    tasks.forEach(t => { if (t.week_id && weekIds.has(t.week_id) && t.assigned_to) names.add(t.assigned_to) })
    return Array.from(names).sort()
  }, [tasks, weeks, allGlobalWeeks, globalWeekIdx])

  // ── Weekly report export ────────────────────────────────────────────────────
  function handleExportWeek(devFilter?: string) {
    const currentGlobalWeek = allGlobalWeeks[globalWeekIdx]
    if (!currentGlobalWeek) return

    const esc = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')

    const fmtShort = (d: string) => {
      const MESES_SHORT = ['jan','fev','mar','abr','mai','jun','jul','ago','set','out','nov','dez']
      const [, m, day] = d.split('-')
      return `${parseInt(day)} ${MESES_SHORT[parseInt(m)-1]}`
    }
    const fmtFull = (d: string) => {
      const MESES_FULL = ['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']
      const [y, m, day] = d.split('-')
      return `${parseInt(day)} de ${MESES_FULL[parseInt(m)-1]} de ${y}`
    }

    const weekIds = new Set(weeks.filter(w => w.start_date === currentGlobalWeek.start_date).map(w => w.id))
    const weekNum = weeks.find(w => w.start_date === currentGlobalWeek.start_date)?.week_number ?? '—'

    type ReportRow = { project: Project; projectTasks: Task[] }
    const rows: ReportRow[] = projects
      .map(p => ({
        project: p,
        projectTasks: sortByUrgency(tasks.filter(t =>
          t.project_id === p.id &&
          t.week_id && weekIds.has(t.week_id) &&
          (!devFilter || t.assigned_to === devFilter)
        )),
      }))
      .filter(r => r.projectTasks.length > 0)

    const URGENCY_LABELS: Record<string, string> = { high: 'Alta',  medium: 'Média', low: 'Baixa' }
    const URGENCY_COLORS: Record<string, string> = { high: '#DC2626', medium: '#D97706', low: '#059669' }
    const STATUS_LABELS:  Record<string, string> = {
      active: 'Em curso', negotiation: 'Em negociação',
      completed: 'Finalizado', paused: 'Pausado', cancelled: 'Cancelado',
    }

    const totalTasks = rows.reduce((s, r) => s + r.projectTasks.length, 0)
    const doneTasks  = rows.reduce((s, r) => s + r.projectTasks.filter(t => t.done).length, 0)
    const pendTasks  = totalTasks - doneTasks

    // ── project blocks ────────────────────────────────────────────────────────
    const projectBlocks = rows.map(({ project: p, projectTasks }, pi) => {
      const doneCount = projectTasks.filter(t => t.done).length
      const pct       = projectTasks.length > 0 ? Math.round((doneCount / projectTasks.length) * 100) : 0
      const statusLabel = STATUS_LABELS[p.status] ?? p.status

      const taskRows = projectTasks.map((t, ti) => {
        const isLast    = ti === projectTasks.length - 1
        const urgBadge  = t.urgency ? `
          <span style="display:inline-flex;align-items:center;gap:3px;font-size:9.5px;font-weight:700;
            padding:2px 7px;border-radius:20px;letter-spacing:0.02em;
            color:${URGENCY_COLORS[t.urgency]};border:1px solid ${URGENCY_COLORS[t.urgency]}55;
            background:${URGENCY_COLORS[t.urgency]}12;white-space:nowrap;flex-shrink:0">
            ${URGENCY_LABELS[t.urgency]}
          </span>` : ''

        const FLAG_REPORT_COLORS: Record<string, { color: string; bg: string; label: string }> = {
          revisar:   { color: '#D97706', bg: '#D9770612', label: 'Revisar'   },
          bloqueado: { color: '#DC2626', bg: '#DC262610', label: 'Bloqueado' },
        }
        const flagBadges = (t.flags ?? []).map(flag => {
          const fc = FLAG_REPORT_COLORS[flag]
          if (!fc) return ''
          return `<span style="display:inline-flex;align-items:center;font-size:9.5px;font-weight:700;
            padding:2px 7px;border-radius:20px;letter-spacing:0.02em;
            color:${fc.color};border:1px solid ${fc.color}55;
            background:${fc.bg};white-space:nowrap;flex-shrink:0">
            ${fc.label}
          </span>`
        }).join('')

        const flagCommentColor = (t.flags ?? []).includes('bloqueado') ? '#DC2626' : '#D97706'
        const flagComment = t.flag_comment ? `<div style="font-size:11px;color:${flagCommentColor};margin-top:5px;line-height:1.55;font-weight:500;word-break:break-word;overflow-wrap:break-word;padding:5px 9px;background:${flagCommentColor}08;border-left:2px solid ${flagCommentColor}55;border-radius:0 4px 4px 0">${esc(t.flag_comment)}</div>` : ''
        const checkmark = t.done
          ? `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect width="14" height="14" rx="3.5" fill="${p.color_hex}"/>
               <path d="M3.5 7l2.5 2.8L10.5 4" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>
             </svg>`
          : `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
               <rect x="0.75" y="0.75" width="12.5" height="12.5" rx="2.75" stroke="#CBD5E1" stroke-width="1.5" fill="none"/>
             </svg>`
        const descLine = t.description ? `<div style="font-size:11px;color:#94A3B8;margin-top:3px;line-height:1.55;font-weight:400;word-break:break-word;overflow-wrap:break-word">${esc(t.description)}</div>` : ''
        const assignee = t.assigned_to ? `
          <span style="font-size:10px;font-weight:500;color:#94A3B8;white-space:nowrap;flex-shrink:0;padding-left:8px">
            ${esc(t.assigned_to)}
          </span>` : ''

        return `
        <tr style="border-bottom:${isLast ? 'none' : '1px solid #F1F5F9'}">
          <td style="padding:10px 12px 10px 0;vertical-align:top;width:18px">${checkmark}</td>
          <td style="padding:10px 12px 10px 0;vertical-align:top">
            <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
              <span style="font-size:12.5px;font-weight:${t.done ? 400 : 550};
                color:${t.done ? '#94A3B8' : '#1E293B'};
                text-decoration:${t.done ? 'line-through' : 'none'};
                text-decoration-color:#CBD5E1;line-height:1.4">
                ${esc(t.title)}
              </span>
              ${urgBadge}
              ${flagBadges}
            </div>
            ${descLine}
            ${flagComment}
          </td>
          <td style="padding:10px 0 10px 8px;vertical-align:top;text-align:right;white-space:nowrap">
            ${assignee}
          </td>
        </tr>`
      }).join('')

      return `
      <div style="margin-bottom:${pi === rows.length - 1 ? 0 : 28}px;break-inside:avoid">
        <!-- Project header -->
        <div style="display:flex;align-items:stretch;border-radius:10px 10px 0 0;overflow:hidden;border:1px solid #E2E8F0;border-bottom:none">
          <div style="width:5px;background:${p.color_hex};flex-shrink:0"></div>
          <div style="flex:1;padding:12px 16px;background:#FAFAFA;display:flex;align-items:center;justify-content:space-between;gap:12px">
            <div>
              <div style="font-size:13.5px;font-weight:700;color:#0F172A;line-height:1.3">${esc(p.name)}</div>
              <div style="font-size:11px;color:#94A3B8;margin-top:2px;font-weight:400">
                ${esc(p.client?.name ?? '')}
                ${p.gestor ? `<span style="margin:0 5px;color:#CBD5E1">·</span>${esc(p.gestor)}` : ''}
                <span style="margin:0 5px;color:#CBD5E1">·</span>${statusLabel}
              </div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
              <!-- Mini progress bar -->
              <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">
                <div style="font-size:10px;font-weight:600;color:${doneCount === projectTasks.length ? '#059669' : '#94A3B8'}">
                  ${doneCount}/${projectTasks.length} feito${doneCount !== 1 ? 's' : ''}
                </div>
                <div style="width:72px;height:4px;background:#E2E8F0;border-radius:100px;overflow:hidden">
                  <div style="height:100%;width:${pct}%;background:${p.color_hex};border-radius:100px"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- Tasks table -->
        <div style="border:1px solid #E2E8F0;border-radius:0 0 10px 10px;padding:0 16px;background:#fff">
          <table style="width:100%;border-collapse:collapse">
            <tbody>${taskRows}</tbody>
          </table>
        </div>
      </div>`
    }).join('')

    // ── stats bar ─────────────────────────────────────────────────────────────
    const statsBar = `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:#E2E8F0;border-radius:12px;overflow:hidden;margin-bottom:36px">
      <div style="background:#fff;padding:16px 20px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#0F172A;line-height:1">${rows.length}</div>
        <div style="font-size:10.5px;font-weight:600;color:#94A3B8;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Projeto${rows.length !== 1 ? 's' : ''}</div>
      </div>
      <div style="background:#fff;padding:16px 20px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:#0F172A;line-height:1">${totalTasks}</div>
        <div style="font-size:10.5px;font-weight:600;color:#94A3B8;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Entregáve${totalTasks !== 1 ? 'is' : 'l'}</div>
      </div>
      <div style="background:#fff;padding:16px 20px;text-align:center">
        <div style="font-size:22px;font-weight:800;color:${pendTasks === 0 ? '#059669' : '#0F172A'};line-height:1">${pendTasks}</div>
        <div style="font-size:10.5px;font-weight:600;color:#94A3B8;margin-top:4px;text-transform:uppercase;letter-spacing:0.06em">Pendente${pendTasks !== 1 ? 's' : ''}</div>
      </div>
    </div>`

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Entregáveis · Semana ${weekNum} · Sheep Tech</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"/>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    body {
      font-family: 'Manrope', sans-serif;
      background: #F8FAFC;
      color: #0F172A;
      min-height: 100vh;
    }
    .page {
      max-width: 800px;
      margin: 0 auto;
      background: #fff;
      min-height: 100vh;
      padding: 48px 52px 60px;
      box-shadow: 0 0 0 1px #E2E8F0;
    }
    .toolbar {
      position: fixed; top: 0; left: 0; right: 0;
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(8px);
      border-bottom: 1px solid #E2E8F0;
      padding: 10px 24px;
      display: flex; justify-content: flex-end; gap: 8px;
      z-index: 100;
    }
    .toolbar button {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 18px; border-radius: 8px;
      font-size: 12.5px; font-weight: 600;
      cursor: pointer; font-family: inherit;
      transition: all 0.15s;
    }
    .btn-print {
      background: #0F172A; color: #fff; border: none;
    }
    .btn-print:hover { background: #1E293B; }
    .btn-close {
      background: #fff; color: #64748B; border: 1px solid #E2E8F0;
    }
    .btn-close:hover { border-color: #94A3B8; color: #0F172A; }
    @media print {
      html { background: #fff; }
      body { background: #fff; }
      .toolbar { display: none !important; }
      .page { box-shadow: none; padding: 0; max-width: 100%; }
      @page { margin: 18mm 16mm; size: A4 portrait; }
      .break-avoid { break-inside: avoid; }
    }
    @media screen {
      body { padding-top: 56px; }
    }
  </style>
</head>
<body>

  <!-- Toolbar (screen only) -->
  <div class="toolbar">
    <button class="btn-close" onclick="window.close()">Fechar</button>
    <button class="btn-print" onclick="window.print()">
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path d="M4 5V2h8v3M4 11H2V6.5a1 1 0 011-1h10a1 1 0 011 1V11h-2M4 9h8v5H4V9z"
          stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
      </svg>
      Imprimir / Salvar PDF
    </button>
  </div>

  <div class="page">

    <!-- Header -->
    <div style="margin-bottom:36px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:8px;background:#0F172A;display:flex;align-items:center;justify-content:center">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M3 10h14M3 15h8" stroke="white" stroke-width="1.8" stroke-linecap="round"/>
            </svg>
          </div>
          <span style="font-size:12px;font-weight:700;color:#0F172A;letter-spacing:-0.01em">Sheep Tech</span>
        </div>
        <span style="font-size:11px;color:#94A3B8;font-weight:400">
          Gerado em ${fmtFull(new Date().toISOString().slice(0,10))}
        </span>
      </div>

      <div style="border-top:2px solid #0F172A;padding-top:20px;display:flex;align-items:flex-end;justify-content:space-between;gap:16px">
        <div>
          <div style="font-size:11px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">
            ${devFilter ? `Entregáveis de` : `Relatório Semanal de Entregáveis`}
          </div>
          <h1 style="font-size:28px;font-weight:800;color:#0F172A;line-height:1.1;letter-spacing:-0.02em">
            ${devFilter ? esc(devFilter) : `Semana ${weekNum}`}
          </h1>
          <div style="font-size:13px;color:#64748B;margin-top:6px;font-weight:400">
            ${devFilter ? `Semana ${weekNum} · ` : ''}${fmtShort(currentGlobalWeek.start_date)} – ${fmtShort(currentGlobalWeek.end_date)}
          </div>
        </div>
      </div>
    </div>

    <!-- Stats -->
    ${statsBar}

    <!-- Projects -->
    ${rows.length === 0
      ? `<div style="text-align:center;padding:60px 0;color:#94A3B8;font-size:14px;border:1px dashed #E2E8F0;border-radius:12px">
           Nenhum entregável cadastrado para esta semana.
         </div>`
      : projectBlocks
    }

    <!-- Footer -->
    <div style="margin-top:48px;padding-top:16px;border-top:1px solid #F1F5F9;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:10.5px;color:#CBD5E1;font-weight:500">Sheep Tech · Gestão de Projetos</span>
      <span style="font-size:10.5px;color:#CBD5E1;font-weight:500">Semana ${weekNum} · ${fmtShort(currentGlobalWeek.start_date)}–${fmtShort(currentGlobalWeek.end_date)}</span>
    </div>

  </div>
</body>
</html>`

    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
    }
  }

  return (
    <div>
      {/* Header + filtros */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        gap: 16,
        position: 'sticky', top: 0, zIndex: 200,
        background: 'var(--bg)', padding: '8px 0 14px',
        marginBottom: 20,
      }}>
        {/* Título — coluna esquerda */}
        <div style={{ flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Projetos</h1>
            <ExportWeekButton onExport={handleExportWeek} devs={weekDevsThisWeek} />
            {!loadingProj && orderedDisplayed.length > 0 && (
              <button
                onClick={toggleAll}
                title={allExpanded ? 'Fechar todos' : 'Expandir todos'}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '5px 10px', borderRadius: 8,
                  border: '1px solid var(--gray3)', background: 'var(--white)',
                  color: 'var(--gray)', fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--black)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray)' }}
              >
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  {allExpanded
                    ? <><path d="M2 4l3-3 3 3"/><path d="M2 7l3 3 3-3"/></>
                    : <><path d="M2 3.5h7"/><path d="M2 7.5h7"/><path d="M5.5 1v9"/></>
                  }
                </svg>
                {allExpanded ? 'Fechar todos' : 'Expandir todos'}
              </button>
            )}
          </div>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
            Acompanhamento semanal de entregáveis por projeto
          </p>
        </div>

        {/* Navegador de semana — coluna central */}
        <GlobalWeekNav
          weeks={allGlobalWeeks}
          idx={globalWeekIdx}
          onChange={setGlobalWeekIdx}
        />

        {/* Filtros — coluna direita */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'flex-end' }}>
            <FilterDropdown
              label="Status"
              value={filterStatus}
              onChange={setFilterStatus}
              options={[
                { value: 'active',    label: 'Em curso'   },
                { value: 'paused',    label: 'Pausado'    },
                { value: 'completed', label: 'Finalizado' },
                { value: 'cancelled', label: 'Cancelado'  },
              ]}
            />
            <FilterDropdown
              label="Tipo"
              value={filterType}
              onChange={setFilterType}
              options={[
                { value: 'AI',            label: 'IA'             },
                { value: 'SaaS',          label: 'SaaS'           },
                { value: 'TaaS',          label: 'TaaS'           },
                { value: 'BI',            label: 'BI'             },
                { value: 'PowerPlatform', label: 'Power Platform' },
                { value: 'Other',         label: 'Outro'          },
              ]}
            />
            <FilterDropdown
              label="Gestor"
              value={filterGestor}
              onChange={setFilterGestor}
              options={gestores.map(g => ({ value: g, label: g }))}
            />
            <FilterDropdown
              label="Responsável"
              value={filterDev}
              onChange={setFilterDev}
              options={devOpts}
            />
            <FilterDropdown
              label="Cliente"
              value={filterClient}
              onChange={setFilterClient}
              options={clientOpts}
            />
            <FilterDropdown
              label="Semana"
              value={filterSemana}
              onChange={setFilterSemana}
              options={[
                { value: 'concluded',     label: 'Semana concluída'     },
                { value: 'not_concluded', label: 'Semana não concluída' },
              ]}
            />
            {activeFilters > 0 && (
              <button
                onClick={() => { setFilterStatus(''); setFilterType(''); setFilterGestor(''); setFilterClient(''); setFilterSemana(''); setFilterDev('') }}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 4,
                  padding: '5px 9px', borderRadius: 8,
                  border: '1px solid var(--gray3)',
                  background: 'var(--white)', color: 'var(--gray)',
                  fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', outline: 'none',
                  transition: 'border-color 0.15s, color 0.15s',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray2)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--black)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray)' }}
              >
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
                  <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                </svg>
                Limpar
              </button>
            )}
          </div>
      </div>

      {/* Manual order badge */}
      {manualOrder.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            fontSize: 11, fontWeight: 600, color: 'var(--primary-text)',
            background: 'rgba(101,163,13,0.10)', border: '1px solid rgba(101,163,13,0.25)',
            borderRadius: 8, padding: '3px 8px',
          }}>
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M2 4l3-3 3 3M2 7l3 3 3-3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Ordem manual
          </span>
          <button
            onClick={clearManualOrder}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 11, fontWeight: 500, color: 'var(--gray)',
              background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
            }}
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            Limpar
          </button>
        </div>
      )}

      {/* Column headers */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '16px 4px 1fr 100px 140px 90px 80px 130px 160px 28px',
        alignItems: 'center', gap: 16,
        padding: '0 18px', marginBottom: 6,
      }}>
        <div />
        <div />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <SortCell
            label={titleMode === 'client' ? 'Cliente' : titleMode === 'dev' ? 'Dev' : 'Nome'}
            col="name" sortBy={sortBy} sortDir={sortDir} onSort={onSort}
          />
          {/* 3-way group toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--gray3)', borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}>
            {([
              { mode: 'project', title: 'Agrupar por projeto', icon: <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M1 2h7M1 4.5h7M1 7h7"/></svg> },
              { mode: 'client',  title: 'Agrupar por cliente', icon: <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="1" y="1" width="7" height="7" rx="1.5"/><path d="M1 4h7"/></svg> },
              { mode: 'dev',     title: 'Agrupar por dev', icon: <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="4.5" cy="3" r="1.5"/><path d="M1.5 8c0-1.66 1.34-3 3-3s3 1.34 3 3"/></svg> },
            ] as { mode: 'project'|'client'|'dev', title: string, icon: JSX.Element }[]).map(({ mode, title, icon }) => (
              <button
                key={mode}
                onClick={() => setTitleMode(mode)}
                title={title}
                style={{
                  width: 20, height: 20, border: 'none', cursor: 'pointer',
                  background: titleMode === mode ? 'var(--primary)' : 'var(--white)',
                  color: titleMode === mode ? 'var(--primary-contrast)' : 'var(--gray2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s, color 0.15s',
                }}
              >{icon}</button>
            ))}
          </div>
        </div>
        <SortCell label="Entregas" col="tasks" sortBy={sortBy} sortDir={sortDir} onSort={onSort} style={{ justifySelf: 'start' }} />
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray2)' }}>Semana</div>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray2)' }}>Status</div>
        <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray2)' }}>Gestor</div>
        <SortCell label="Deadline"  col="deadline" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
        <SortCell label="Progresso" col="progress" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
        <div />
      </div>

      {/* General tasks row */}
      {!loadingProj && (
        <div style={{ marginBottom: 10 }}>
          <GeneralTasksRow
            tasks={generalTasks}
            weeks={weeks}
            globalWeekStart={globalWeekStart}
            isOpen={generalOpen}
            onToggle={() => setGeneralOpen(o => !o)}
            onAdd={(weekId) => {
              setEditing(null)
              setAddingFor('')
              setAddingForWeekId(weekId ?? null)
            }}
            onAddForDay={(weekId, deadline) => { setEditing(null); setAddingFor(''); setAddingForWeekId(weekId ?? null); setAddingForDeadline(deadline) }}
            onEdit={t => { setAddingFor(null); setEditing(t) }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
          />
        </div>
      )}

      {/* Project list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loadingProj ? (
          // ── Skeleton rows ──────────────────────────────────────────────────
          <>
            {[0,1,2,3,4].map(i => (
              <div key={i} className="shimmer-bar" style={{
                background: 'var(--white)', border: '1px solid var(--gray3)',
                borderRadius: 12, padding: '14px 18px', boxShadow: 'var(--shadow)',
                display: 'grid',
                gridTemplateColumns: '16px 4px 1fr 100px 140px 90px 80px 130px 160px 28px',
                alignItems: 'center', gap: 16,
                animationDelay: `${i * 0.06}s`,
              }}>
                {/* Handle */}
                <div style={{ width: 10, height: 14, borderRadius: 3, background: 'var(--gray3)' }} />
                {/* Color bar */}
                <div style={{ width: 4, height: 28, borderRadius: 2, background: 'var(--gray3)' }} />
                {/* Name */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ width: '65%', height: 12, borderRadius: 4, background: 'var(--gray3)' }} />
                  <div style={{ width: '40%', height: 10, borderRadius: 4, background: 'var(--gray3)' }} />
                </div>
                {/* Tasks count */}
                <div style={{ width: 24, height: 12, borderRadius: 4, background: 'var(--gray3)' }} />
                {/* Week status */}
                <div style={{ width: 110, height: 22, borderRadius: 100, background: 'var(--gray3)' }} />
                {/* Status badge */}
                <div style={{ width: 70, height: 22, borderRadius: 100, background: 'var(--gray3)' }} />
                {/* Gestor */}
                <div style={{ width: 55, height: 11, borderRadius: 4, background: 'var(--gray3)' }} />
                {/* Deadline */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ width: 70, height: 11, borderRadius: 4, background: 'var(--gray3)' }} />
                  <div style={{ width: 55, height: 18, borderRadius: 100, background: 'var(--gray3)' }} />
                </div>
                {/* Progress */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ width: '100%', height: 10, borderRadius: 4, background: 'var(--gray3)' }} />
                  <div style={{ width: '100%', height: 4, borderRadius: 100, background: 'var(--gray3)' }} />
                </div>
                {/* Chevron */}
                <div style={{ width: 14, height: 14, borderRadius: 3, background: 'var(--gray3)' }} />
              </div>
            ))}
          </>
        ) : orderedDisplayed.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--gray2)', fontSize: 13 }}>
            Nenhum projeto encontrado para os filtros selecionados.
          </div>
        ) : titleMode === 'dev' ? (
          orderedDevGroups.map(group => (
            <DevGroupRow
              key={group.devName}
              devName={group.devName}
              devColor={group.devColor}
              projects={group.projects}
              tasks={tasks}
              weeks={weeks}
              globalWeekStart={globalWeekStart}
              openIds={openIds}
              onToggle={toggle}
              onAdd={(projectId, weekId) => { setEditing(null); setAddingFor(projectId); setAddingForWeekId(weekId ?? null) }}
              onAddForDay={(projectId, weekId, deadline) => { setEditing(null); setAddingFor(projectId); setAddingForWeekId(weekId ?? null); setAddingForDeadline(deadline) }}
              onEdit={t => { setAddingFor(null); setEditing(t) }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onReplicate={handleReplicate}
              isOpen={openDevGroupIds.has(group.devName)}
              onGroupToggle={() => toggleDevGroup(group.devName)}
              isDragging={dragSrcDevGroupId === group.devName}
              isDragOver={dragOverDevGroupId === group.devName}
              onDragStart={() => setDragSrcDevGroupId(group.devName)}
              onDragEnd={() => { setDragSrcDevGroupId(null); setDragOverDevGroupId(null) }}
              onDragOver={() => setDragOverDevGroupId(group.devName)}
              onDrop={() => handleDevGroupDrop(group.devName)}
            />
          ))
        ) : titleMode === 'client' ? (
          clientGroups.map(group => (
            <ClientGroupRow
              key={group.clientId}
              clientId={group.clientId}
              clientName={group.clientName}
              clientColor={group.clientColor}
              projects={group.projects}
              tasks={tasks}
              weeks={weeks}
              globalWeekStart={globalWeekStart}
              openIds={openIds}
              onToggle={toggle}
              onAdd={(projectId, weekId) => { setEditing(null); setAddingFor(projectId); setAddingForWeekId(weekId ?? null) }}
              onAddForDay={(projectId, weekId, deadline) => { setEditing(null); setAddingFor(projectId); setAddingForWeekId(weekId ?? null); setAddingForDeadline(deadline) }}
              onEdit={t => { setAddingFor(null); setEditing(t) }}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onReplicate={handleReplicate}
              isOpen={openGroupIds.has(group.clientId)}
              onGroupToggle={() => toggleGroup(group.clientId)}
              isDragging={dragSrcGroupId === group.clientId}
              isDragOver={dragOverGroupId === group.clientId}
              onDragStart={() => setDragSrcGroupId(group.clientId)}
              onDragEnd={() => { setDragSrcGroupId(null); setDragOverGroupId(null) }}
              onDragOver={() => setDragOverGroupId(group.clientId)}
              onDrop={() => handleGroupDrop(group.clientId)}
            />
          ))
        ) : orderedDisplayed.map(project => (
          <ProjectRow
            key={project.id}
            project={project}
            tasks={tasks.filter(t => t.project_id === project.id)}
            isOpen={openIds.has(project.id)}
            onToggle={() => toggle(project.id)}
            onAdd={(weekId) => { setEditing(null); setAddingFor(project.id); setAddingForWeekId(weekId ?? null) }}
            onAddForDay={(weekId, deadline) => { setEditing(null); setAddingFor(project.id); setAddingForWeekId(weekId ?? null); setAddingForDeadline(deadline) }}
            onEdit={t => { setAddingFor(null); setEditing(t) }}
            onDelete={handleDelete}
            onStatusChange={handleStatusChange}
            onReplicate={handleReplicate}
            globalWeekStart={globalWeekStart}
            weeks={weeks}
            titleMode={titleMode}
            isDragging={dragSrcId === project.id}
            isDragOver={dragOverId === project.id}
            onDragStart={() => setDragSrcId(project.id)}
            onDragEnd={() => { setDragSrcId(null); setDragOverId(null) }}
            onDragOver={() => setDragOverId(project.id)}
            onDrop={() => handleDrop(project.id)}
          />
        ))}
      </div>

      {isShowingModal && modalProjectId !== null && (
        <WBTaskModal
          task={editing ?? undefined}
          defaultProjectId={modalProjectId || undefined}
          defaultWeekId={editing ? null : addingForWeekId}
          defaultDeadline={editing ? undefined : addingForDeadline}
          onSave={(data, _draftId) => { handleSave(modalProjectId, data) }}
          onClose={() => { setEditing(null); setAddingFor(null); setAddingForWeekId(null); setAddingForDeadline(undefined) }}
          onDelete={editing ? () => setDeletingFromModal(editing) : undefined}
          weeks={weeks}
          projects={projects}
        />
      )}

      {deletingFromModal && (
        <DeleteConfirmModal
          taskTitle={deletingFromModal.title}
          onConfirm={() => {
            handleDelete(deletingFromModal.id)
            setDeletingFromModal(null)
            setEditing(null)
            setAddingFor(null)
          }}
          onClose={() => setDeletingFromModal(null)}
        />
      )}
    </div>
  )
}
