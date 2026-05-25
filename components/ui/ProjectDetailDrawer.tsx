'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import type { Project, ProjectStatus, ProjectType } from '@/lib/types'
import { calcProgress } from '@/lib/utils'
import { MeetingsTab } from './MeetingsTab'

type DrawerTab = 'info' | 'meetings'

// ── Config ────────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:      { label: 'Em curso',        color: '#B45309', bg: 'rgba(251,191,36,0.13)' },
  negotiation: { label: 'Em negociação',   color: '#0284C7', bg: 'rgba(2,132,199,0.11)'  },
  completed:   { label: 'Finalizado',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.11)'  },
  paused:      { label: 'Pausado',         color: '#7C3AED', bg: 'rgba(124,58,237,0.11)' },
  cancelled:   { label: 'Cancelado',       color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
}

const TYPE_LABEL: Record<ProjectType, string> = {
  AI: 'IA', SaaS: 'SaaS', TaaS: 'TaaS',
  BI: 'BI', PowerPlatform: 'Power Platform', Other: 'Outro',
}

function fmt(date?: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function timeRemainingBadge(endDate?: string): { text: string; color: string; bg: string } | null {
  if (!endDate) return null
  const now     = new Date()
  const end     = new Date(endDate)
  const diffMs  = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays < 0)   return { text: `${Math.abs(diffDays)}d atrasado`, color: '#D93025', bg: 'rgba(217,48,37,0.10)' }
  if (diffDays <= 7)  return { text: `${diffDays}d restantes`,          color: '#B45309', bg: 'rgba(251,191,36,0.13)' }
  if (diffDays <= 30) return { text: `${diffDays}d restantes`,          color: '#0284C7', bg: 'rgba(2,132,199,0.11)'  }
  return                     { text: `${diffDays}d restantes`,          color: '#1E8A3E', bg: 'rgba(30,138,62,0.11)'  }
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{value}</div>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function ProjectDetailDrawer({ project, onClose }: {
  project: Project
  onClose: () => void
}) {
  const router    = useRouter()
  const [tab, setTab] = useState<DrawerTab>('info')
  const status    = STATUS_CONFIG[project.status] ?? STATUS_CONFIG['active']
  const prog      = calcProgress(project.start_date, project.end_date)
  const remaining = timeRemainingBadge(project.end_date)

  // Escape → close
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 98000,
          background: 'rgba(18,19,22,0.40)',
          backdropFilter: 'blur(4px)',
          animation: 'fadeIn 0.18s ease both',
        }}
      />

      {/* Centering wrapper */}
      <div style={{
        position: 'fixed', inset: 0, zIndex: 98001,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none',
      }}>

      {/* Modal */}
      <div style={{
        width: 'calc(100% - 48px)', maxWidth: 500,
        maxHeight: '88vh',
        background: 'var(--white)',
        borderRadius: 16,
        boxShadow: '0 24px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
        display: 'flex', flexDirection: 'column',
        animation: 'modalSlideUp 0.24s cubic-bezier(0.34,1.1,0.64,1) both',
        overflow: 'hidden',
        pointerEvents: 'auto',
      }}>

        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'flex-start', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 10, height: 36, borderRadius: 4,
            background: project.color_hex, flexShrink: 0,
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', marginBottom: 5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {project.name}
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700,
              color: status.color, background: status.bg,
              padding: '2px 8px', borderRadius: 100,
            }}>
              {status.label}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 10, border: '1px solid var(--gray3)',
              background: 'transparent', cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
              flexShrink: 0, transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
            title="Fechar"
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex', gap: 0,
          borderBottom: '1px solid var(--gray3)',
          padding: '0 20px',
          flexShrink: 0,
        }}>
          {(['info', 'meetings'] as DrawerTab[]).map(t => {
            const labels: Record<DrawerTab, string> = { info: 'Informações', meetings: 'Reuniões' }
            const active = tab === t
            const accentColor = project.color_hex || 'var(--primary)'
            return (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '10px 14px',
                  fontSize: 12, fontWeight: 700,
                  color: active ? accentColor : 'var(--gray2)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  borderBottom: `2px solid ${active ? accentColor : 'transparent'}`,
                  marginBottom: -1,
                  transition: 'color 0.15s, border-color 0.15s',
                }}
              >
                {labels[t]}
              </button>
            )
          })}
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
        {tab === 'meetings' && (
          <MeetingsTab projectId={project.id} projectColor={project.color_hex} />
        )}
        {tab === 'info' && (<>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20 }}>
            <InfoField label="Cliente" value={project.client?.name ?? '—'} />
            <InfoField label="Tipo"    value={TYPE_LABEL[project.type] ?? project.type} />
            <InfoField label="Gestor"  value={project.gestor ?? '—'} />
            {project.team_members && project.team_members.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  Equipe técnica
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {project.team_members.map(m => (
                    <span key={m} style={{
                      fontSize: 11, fontWeight: 700,
                      color: project.color_hex,
                      background: project.color_hex + '18',
                      border: `1px solid ${project.color_hex}40`,
                      padding: '2px 8px', borderRadius: 20,
                    }}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progress */}
          <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--gray3)', marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso</span>
              <span style={{ fontSize: 12, fontWeight: 800, color: project.color_hex }}>{prog}%</span>
            </div>
            <div style={{ height: 6, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${prog}%`, background: project.color_hex, borderRadius: 100 }} />
            </div>
          </div>

          {/* Dates */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
            <InfoField label="Início" value={fmt(project.start_date)} />
            <div>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                Fim previsto
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{fmt(project.end_date)}</span>
                {remaining && (
                  <span style={{ fontSize: 10, fontWeight: 700, color: remaining.color, background: remaining.bg, padding: '1px 7px', borderRadius: 100 }}>
                    {remaining.text}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          {project.description && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                Descrição
              </div>
              <p style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.6, margin: 0 }}>
                {project.description}
              </p>
            </div>
          )}

          {/* Observações */}
          {project.observacoes && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                Observações
              </div>
              <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.6, margin: 0, whiteSpace: 'pre-wrap' }}>
                {project.observacoes}
              </p>
            </div>
          )}

          {/* Links */}
          {project.links && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                Pasta no Drive
              </div>
              <a
                href={project.links}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: 12, color: 'var(--primary)', fontWeight: 600,
                  textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.75')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                <svg width={12} height={12} viewBox="0 0 13 13" fill="none">
                  <path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8.5M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Abrir pasta
              </a>
            </div>
          )}
          </>)}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px', borderTop: '1px solid var(--gray3)',
          flexShrink: 0, background: 'var(--white)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
              background: 'transparent', fontSize: 13, fontWeight: 600,
              color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' }}
          >
            Fechar
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { onClose(); router.push(`/projects?open=${project.id}`) }}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
                background: 'transparent', fontSize: 13, fontWeight: 600,
                color: 'var(--black)', cursor: 'pointer', transition: 'all 0.15s',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--black)' }}
            >
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12L4 10.25H1.75V8L8.5 1.5z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
              </svg>
              Editar
            </button>
            <button
              onClick={() => { onClose(); router.push(`/tasks?tab=checkpoint&expand=${project.id}`) }}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: 'var(--primary)', fontSize: 13, fontWeight: 700,
                color: '#fff', cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: '0 2px 8px var(--primary-mid)',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              Abrir em Checkpoint
              <svg width={11} height={11} viewBox="0 0 11 11" fill="none">
                <path d="M1 5.5h9M6 1.5l4 4-4 4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </>,
    document.body
  )
}
