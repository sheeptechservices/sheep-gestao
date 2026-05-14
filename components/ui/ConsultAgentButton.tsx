'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useChatStore } from '@/stores/chatStore'
import { useAgentsStore } from '@/stores/agentsStore'
import type { Task, Project, AgentType, TaskUrgency } from '@/lib/types'

// ── Urgency labels ─────────────────────────────────────────────────────────────
const URGENCY_LABEL: Record<TaskUrgency, string> = {
  low: 'Baixa', medium: 'Média', high: 'Alta',
}

// ── Build the pre-filled context message ──────────────────────────────────────
function buildContext(task: Task, project?: Project): string {
  const lines: string[] = []
  lines.push('Preciso de ajuda com este entregável:\n')
  lines.push(`**Entregável:** ${task.title}`)
  if (project) {
    const clientName = project.client?.name
    lines.push(`**Projeto:** ${project.name}${clientName ? ` (${clientName})` : ''}`)
  }
  if (task.urgency) lines.push(`**Urgência:** ${URGENCY_LABEL[task.urgency]}`)
  if (task.assigned_to) lines.push(`**Responsável:** ${task.assigned_to}`)
  if (task.deadline) lines.push(`**Prazo:** ${task.deadline}`)
  lines.push(`**Status:** ${task.done ? 'Concluído ✓' : 'Pendente'}`)
  if (task.description?.trim()) lines.push(`\n**Descrição:** ${task.description.trim()}`)
  lines.push('\n')
  return lines.join('\n')
}

// ── Props ──────────────────────────────────────────────────────────────────────
interface ConsultAgentButtonProps {
  task: Task
  project?: Project
  /** 'icon' = compact icon only (for cards). 'full' = labeled button (for modals). */
  variant?: 'icon' | 'full'
  /** Popover opens upward by default; set to 'down' if card is at the top */
  direction?: 'up' | 'down'
}

// ── Popover rendered via portal to escape stacking contexts ───────────────────
function PopoverPortal({
  anchorRef,
  direction,
  onClose,
  children,
}: {
  anchorRef: React.RefObject<HTMLElement | null>
  direction: 'up' | 'down'
  onClose: () => void
  children: React.ReactNode
}) {
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const popRef = useRef<HTMLDivElement>(null)

  // Position relative to anchor
  useEffect(() => {
    if (!anchorRef.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const POPOVER_W = 210
    const POPOVER_H = 280 // approx max height

    let top: number
    if (direction === 'up') {
      top = rect.top + window.scrollY - POPOVER_H - 6
    } else {
      top = rect.bottom + window.scrollY + 6
    }
    // Clamp so it doesn't go off-screen top
    if (top < window.scrollY + 8) top = rect.bottom + window.scrollY + 6

    const left = Math.min(
      rect.right + window.scrollX - POPOVER_W,
      window.innerWidth - POPOVER_W - 8,
    )

    setPos({ top, left: Math.max(left, 8) })
  }, [anchorRef, direction])

  // Close on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (
        popRef.current && !popRef.current.contains(e.target as Node) &&
        anchorRef.current && !anchorRef.current.contains(e.target as Node)
      ) onClose()
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [anchorRef, onClose])

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  if (!pos) return null

  return createPortal(
    <div
      ref={popRef}
      onClick={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        top: pos.top,
        left: pos.left,
        background: 'var(--white)',
        borderRadius: 12,
        border: '1px solid var(--gray3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '8px',
        display: 'flex', flexDirection: 'column', gap: 2,
        zIndex: 99999,
        minWidth: 200,
        animation: 'slideUp 0.18s ease both',
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

// ── Component ─────────────────────────────────────────────────────────────────
export function ConsultAgentButton({
  task, project,
  variant = 'icon',
  direction = 'up',
}: ConsultAgentButtonProps) {
  const [open, setOpen] = useState(false)
  const btnRef          = useRef<HTMLButtonElement>(null)

  const openChat        = useChatStore(s => s.openChat)
  const setPendingInput = useChatStore(s => s.setPendingInput)
  const agents          = useAgentsStore(s => s.agents).filter(a => a.enabled)

  const handleSelectAgent = (agentType: AgentType) => {
    setOpen(false)
    const context = buildContext(task, project)
    setPendingInput(agentType, context)
    openChat(agentType)
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Trigger button */}
      {variant === 'icon' ? (
        <button
          ref={btnRef}
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          onMouseEnter={e => {
            if (!open) {
              e.currentTarget.style.background = 'rgba(34,197,94,0.08)'
              e.currentTarget.style.borderColor = '#22C55E'
            }
          }}
          onMouseLeave={e => {
            if (!open) {
              e.currentTarget.style.background = 'var(--white)'
              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.28)'
            }
          }}
          title="Consultar especialista"
          style={{
            width: 20, height: 20, borderRadius: 5,
            background: open ? 'rgba(34,197,94,0.08)' : 'var(--white)',
            border: `1px solid ${open ? '#22C55E' : 'rgba(34,197,94,0.28)'}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'background 0.12s, border-color 0.12s',
            padding: 0, flexShrink: 0,
          }}
        >
          <svg width={10} height={10} viewBox="0 0 14 14" fill="none">
            <path d="M12 2H2C1.45 2 1 2.45 1 3v7c0 .55.45 1 1 1h2v2.5l3-2.5h5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1Z"
              stroke="#22C55E" strokeWidth={1.4} strokeLinejoin="round"/>
            <path d="M4.5 6.5h5M4.5 4.5h3" stroke="#22C55E" strokeWidth={1.3} strokeLinecap="round"/>
          </svg>
        </button>
      ) : (
        <button
          ref={btnRef}
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '8px 14px', borderRadius: 10, border: '1px solid var(--primary-mid)',
            background: open ? 'var(--primary-dim)' : 'var(--white)',
            cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'var(--primary-text)',
            transition: 'all 0.15s', width: '100%', justifyContent: 'center',
          }}
          onMouseEnter={e => { if (!open) e.currentTarget.style.background = 'var(--primary-dim)' }}
          onMouseLeave={e => { if (!open) e.currentTarget.style.background = 'var(--white)' }}
        >
          <svg width={13} height={13} viewBox="0 0 14 14" fill="none">
            <path d="M12 2H2C1.45 2 1 2.45 1 3v7c0 .55.45 1 1 1h2v2.5l3-2.5h5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1Z"
              stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/>
            <path d="M4.5 6.5h5M4.5 4.5h3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
          </svg>
          Consultar especialista
        </button>
      )}

      {/* Agent picker popover — rendered via portal to escape card stacking context */}
      {open && (
        <PopoverPortal anchorRef={btnRef} direction={direction} onClose={() => setOpen(false)}>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 6px 6px' }}>
            Abrir chat com
          </div>
          {agents.map(agent => (
            <AgentRow key={agent.type} agent={agent} onSelect={() => handleSelectAgent(agent.type as AgentType)} />
          ))}
        </PopoverPortal>
      )}
    </div>
  )
}

// ── Agent row inside popover ──────────────────────────────────────────────────
function AgentRow({ agent, onSelect }: { agent: { type: string; name: string; role: string; emoji: string; color: string }; onSelect: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 9,
        padding: '7px 8px', borderRadius: 8, border: 'none',
        background: hov ? agent.color + '12' : 'transparent',
        cursor: 'pointer', textAlign: 'left', width: '100%',
        transition: 'background 0.1s',
      }}
    >
      <div style={{
        width: 26, height: 26, borderRadius: 7, flexShrink: 0,
        background: agent.color + '18', border: `1px solid ${agent.color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 13, lineHeight: 1,
      }}>
        {agent.emoji}
      </div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', lineHeight: 1.2 }}>{agent.name}</div>
        <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 1 }}>{agent.role}</div>
      </div>
    </button>
  )
}
