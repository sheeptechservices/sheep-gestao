'use client'
import { useState, useEffect, useRef } from 'react'
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

// ── Component ─────────────────────────────────────────────────────────────────
export function ConsultAgentButton({
  task, project,
  variant = 'icon',
  direction = 'up',
}: ConsultAgentButtonProps) {
  const [open, setOpen]   = useState(false)
  const [hov, setHov]     = useState(false)
  const wrapRef           = useRef<HTMLDivElement>(null)

  const openChat        = useChatStore(s => s.openChat)
  const setPendingInput = useChatStore(s => s.setPendingInput)
  const agents          = useAgentsStore(s => s.agents).filter(a => a.enabled)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open])

  const handleSelectAgent = (agentType: AgentType) => {
    setOpen(false)
    const context = buildContext(task, project)
    setPendingInput(agentType, context)
    openChat(agentType)
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative', display: 'inline-flex' }}>
      {/* Trigger button */}
      {variant === 'icon' ? (
        <button
          onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          title="Consultar especialista"
          style={{
            width: 22, height: 22, borderRadius: 6, border: 'none',
            background: open ? 'var(--primary)' : hov ? 'var(--primary-dim)' : 'transparent',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: open ? '#fff' : 'var(--primary)',
            transition: 'all 0.15s',
            padding: 0, flexShrink: 0,
          }}
        >
          <svg width={12} height={12} viewBox="0 0 14 14" fill="none">
            <path d="M12 2H2C1.45 2 1 2.45 1 3v7c0 .55.45 1 1 1h2v2.5l3-2.5h5c.55 0 1-.45 1-1V3c0-.55-.45-1-1-1Z"
              stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/>
            <path d="M4.5 6.5h5M4.5 4.5h3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round"/>
          </svg>
        </button>
      ) : (
        <button
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

      {/* Agent picker popover */}
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            ...(direction === 'up'
              ? { bottom: 'calc(100% + 6px)' }
              : { top: 'calc(100% + 6px)' }),
            right: 0,
            background: 'var(--white)',
            borderRadius: 12,
            border: '1px solid var(--gray3)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.16)',
            padding: '8px',
            display: 'flex', flexDirection: 'column', gap: 2,
            zIndex: 9999,
            minWidth: 200,
            animation: 'slideUp 0.18s ease both',
          }}
        >
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '2px 6px 6px' }}>
            Abrir chat com
          </div>
          {agents.map(agent => (
            <AgentRow key={agent.type} agent={agent} onSelect={() => handleSelectAgent(agent.type as AgentType)} />
          ))}
        </div>
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
