'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Project, ProjectStatus, Client } from '@/lib/types'
import { PageNav } from '@/components/layout/PageNav'
import { ProjectsView } from '@/components/projects/ProjectsView'
import { calcProgress } from '@/lib/utils'
import { toast } from '@/stores/toastStore'
import {
  EditProjectDrawer,
  STATUS_CONFIG,
  TYPE_LABEL,
  ALL_STATUSES,
} from '@/components/projects/EditProjectDrawer'

const PROJECTS_TABS = [
  { label: 'Cadastro', tab: '' },
]

function fmt(date?: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function newEmptyProject(clients: Client[]): Project {
  return {
    id: crypto.randomUUID(),
    client_id: clients[0]?.id ?? '',
    client: clients[0],
    name: '',
    description: '',
    status: 'active',
    type: 'AI',
    color_hex: clients[0]?.color_hex ?? '#84CC16',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    progress: 0,
    created_at: new Date().toISOString().split('T')[0],
    gestor: '',
    observacoes: undefined,
    links: undefined,
  }
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function DeleteProjectModal({ project, onConfirm, onClose }: {
  project: Project
  onConfirm: () => void
  onClose: () => void
}) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 4000,
        background: 'rgba(18,19,22,0.35)', backdropFilter: 'blur(3px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 400, background: 'var(--white)', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.22)',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.22s ease both',
        }}
      >
        <div style={{ height: 4, background: '#D93025' }} />
        <div style={{ padding: '24px 28px 28px' }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: 'rgba(217,48,37,0.10)', border: '1px solid rgba(217,48,37,0.20)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <path d="M2.5 5h15M7 5V3.5A.5.5 0 017.5 3h5a.5.5 0 01.5.5V5M8 9v6M12 9v6M3.5 5l1 11.5a.5.5 0 00.5.5h10a.5.5 0 00.5-.5L17 5" stroke="#D93025" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--black)', marginBottom: 6 }}>
            Excluir projeto?
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.55, marginBottom: 4 }}>
            Tem certeza que deseja excluir{' '}
            <span style={{ fontWeight: 700, color: 'var(--black)' }}>"{project.name}"</span>?
          </div>
          <div style={{ fontSize: 12, color: '#D93025', marginBottom: 24 }}>
            Esta ação não pode ser desfeita.
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button
              onClick={onClose}
              style={{
                padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
                background: 'transparent', fontSize: 13, fontWeight: 600,
                color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '8px 20px', borderRadius: 8, border: 'none',
                background: '#D93025', fontSize: 13, fontWeight: 700,
                color: '#fff', cursor: 'pointer', transition: 'all 0.15s',
                boxShadow: '0 2px 8px rgba(217,48,37,0.35)',
              }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 14px rgba(217,48,37,0.50)' }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(217,48,37,0.35)' }}
            >
              Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Project list table ────────────────────────────────────────────────────────

function ProjectTable({ projects, onEdit, onDelete }: { projects: Project[]; onEdit: (p: Project) => void; onDelete: (p: Project) => void }) {
  const COLS = [
    { key: 'name',       label: 'Projeto',   w: '22%' },
    { key: 'client',     label: 'Cliente',   w: '14%' },
    { key: 'type',       label: 'Tipo',      w: '9%'  },
    { key: 'status',     label: 'Status',    w: '10%' },
    { key: 'gestor',     label: 'Gestor',    w: '10%' },
    { key: 'start_date', label: 'Início',    w: '8%'  },
    { key: 'end_date',   label: 'Fim prev.', w: '8%'  },
    { key: 'progress',   label: 'Progresso', w: '9%'  },
  ]

  const [hovRow, setHovRow] = useState<string | null>(null)

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      {/* Head */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)' }}>
        <div style={{ width: 4, marginRight: 14, flexShrink: 0 }} />
        {COLS.map(c => (
          <div key={c.key} style={{ width: c.w, flexShrink: 0, padding: '11px 8px 11px 0', fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {c.label}
          </div>
        ))}
        <div style={{ flex: 1 }} />
      </div>

      {/* Rows */}
      {projects.length === 0 ? (
        <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--gray2)' }}>
          Nenhum projeto encontrado.
        </div>
      ) : (
        projects.map((p, i) => {
          const s = STATUS_CONFIG[p.status] ?? STATUS_CONFIG['active']
          const isHov = hovRow === p.id
          return (
            <div
              key={p.id}
              onClick={() => onEdit(p)}
              onMouseEnter={() => setHovRow(p.id)}
              onMouseLeave={() => setHovRow(null)}
              className="animate-slide-up"
              style={{
                display: 'flex', alignItems: 'center', padding: '0 20px',
                borderBottom: i < projects.length - 1 ? '1px solid var(--gray3)' : 'none',
                background: isHov ? `${p.color_hex}06` : 'var(--white)',
                cursor: 'pointer', transition: 'background 0.15s',
                animationDelay: `${i * 0.03}s`,
              }}
            >
              <div style={{ width: 4, height: 40, borderRadius: 2, background: p.color_hex, marginRight: 14, flexShrink: 0, opacity: isHov ? 1 : 0.6, transition: 'opacity 0.15s' }} />

              <div style={{ width: '22%', flexShrink: 0, padding: '13px 8px 13px 0', minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                {p.description && <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.description}</div>}
              </div>

              <div style={{ width: '14%', flexShrink: 0, padding: '0 8px 0 0', fontSize: 12, color: 'var(--gray)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.client?.name ?? '—'}
              </div>

              <div style={{ width: '9%', flexShrink: 0, padding: '0 8px 0 0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: p.color_hex, background: p.color_hex + '15', padding: '2px 7px', borderRadius: 100 }}>
                  {TYPE_LABEL[p.type]}
                </span>
              </div>

              <div style={{ width: '10%', flexShrink: 0, padding: '0 8px 0 0' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: s.color, background: s.bg, padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>
                  {s.label}
                </span>
              </div>

              <div style={{ width: '10%', flexShrink: 0, padding: '0 8px 0 0', fontSize: 12, color: 'var(--gray)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.gestor ? p.gestor.split(' ')[0] : '—'}
              </div>

              <div style={{ width: '8%', flexShrink: 0, padding: '0 8px 0 0', fontSize: 12, color: 'var(--gray)', fontWeight: 500 }}>
                {fmt(p.start_date)}
              </div>

              <div style={{ width: '8%', flexShrink: 0, padding: '0 8px 0 0', fontSize: 12, color: 'var(--gray)', fontWeight: 500 }}>
                {fmt(p.end_date)}
              </div>

              {(() => {
                const prog = calcProgress(p.start_date, p.end_date)
                return (
                  <div style={{ width: '11%', flexShrink: 0, padding: '0 8px 0 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ flex: 1, height: 5, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${prog}%`, background: p.color_hex, borderRadius: 100 }} />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: p.color_hex, flexShrink: 0 }}>{prog}%</span>
                    </div>
                  </div>
                )
              })()}

              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <div
                  onClick={e => { e.stopPropagation(); onEdit(p) }}
                  style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isHov ? p.color_hex + '15' : 'transparent',
                    border: isHov ? `1px solid ${p.color_hex}35` : '1px solid transparent',
                    color: isHov ? p.color_hex : 'transparent',
                    transition: 'all 0.15s', flexShrink: 0, cursor: 'pointer',
                  }}
                  title="Editar projeto"
                >
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12L4 10.25H1.75V8L8.5 1.5z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
                  </svg>
                </div>
                <div
                  onClick={e => { e.stopPropagation(); onDelete(p) }}
                  style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isHov ? 'rgba(217,48,37,0.08)' : 'transparent',
                    border: isHov ? '1px solid rgba(217,48,37,0.25)' : '1px solid transparent',
                    color: isHov ? '#D93025' : 'transparent',
                    transition: 'all 0.15s', flexShrink: 0, cursor: 'pointer',
                  }}
                  title="Excluir projeto"
                >
                  <svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                    <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 8a.5.5 0 00.5.5h6.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ProjectsPage() {
  const params    = useSearchParams()
  const tab       = params.get('tab') ?? ''
  const openId    = params.get('open') ?? ''
  const expandId  = params.get('expand') ?? ''

  return <ProjectsOverview autoOpenId={openId} />
}

function ProjectsOverview({ autoOpenId }: { autoOpenId?: string }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients,  setClients]  = useState<Client[]>([])
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | ''>('')
  const [editing,  setEditing]  = useState<Project | null>(null)
  const [isNew,    setIsNew]    = useState(false)
  const [deleting, setDeleting] = useState<Project | null>(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([p, c]: [Project[], Client[]]) => {
      setProjects(p)
      setClients(c)
      // Auto-open edit drawer if ?open=<id> is in the URL
      if (autoOpenId) {
        const found = p.find((x: Project) => x.id === autoOpenId)
        if (found) { setEditing(found); setIsNew(false) }
      }
      setLoading(false)
    })
  }, [autoOpenId])

  const filtered = filterStatus
    ? projects.filter(p => p.status === filterStatus)
    : projects

  const handleSave = async (updated: Project) => {
    const method = isNew ? 'POST' : 'PUT'
    const url    = isNew ? '/api/projects' : `/api/projects/${updated.id}`
    const res    = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    const data = await res.json()
    if (!res.ok || data?.error) {
      toast.error(
        isNew ? 'Erro ao criar projeto' : 'Erro ao salvar projeto',
        data?.error ?? `HTTP ${res.status}`,
      )
      return
    }
    const saved = data as Project
    setProjects(prev =>
      isNew ? [...prev, saved] : prev.map(p => p.id === saved.id ? saved : p)
    )
    toast.success(
      isNew ? 'Projeto criado!' : 'Projeto atualizado!',
      isNew ? `"${saved.name}" foi adicionado com sucesso.` : `"${saved.name}" foi salvo.`,
    )
    setEditing(null)
    setIsNew(false)
  }

  const handleDelete = async () => {
    if (!deleting) return
    const name = deleting.name
    const res = await fetch(`/api/projects/${deleting.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erro ao excluir projeto', 'Tente novamente.')
      setDeleting(null)
      return
    }
    setProjects(prev => prev.filter(p => p.id !== deleting.id))
    setDeleting(null)
    setEditing(null)
    setIsNew(false)
    toast.success('Projeto excluído', `"${name}" foi removido com sucesso.`)
  }

  const handleNew = () => {
    setEditing(newEmptyProject(clients))
    setIsNew(true)
  }

  if (loading) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="shimmer-bar" style={{ width: 100, height: 22, borderRadius: 6, background: 'var(--gray3)', marginBottom: 8 }} />
        <div className="shimmer-bar" style={{ width: 180, height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {Array.from({ length: 7 }, (_, i) => (
          <div key={i} className="shimmer-bar" style={{
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderRadius: 12, padding: '16px 20px',
            display: 'grid', gridTemplateColumns: '4px 1fr 120px 80px 110px 160px',
            alignItems: 'center', gap: 16,
            animationDelay: `${i * 0.06}s`,
          }}>
            <div style={{ width: 4, height: 32, borderRadius: 2, background: 'var(--gray3)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: '60%', height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
              <div style={{ width: '35%', height: 10, borderRadius: 4, background: 'var(--gray3)' }} />
            </div>
            <div style={{ width: 24, height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
            <div style={{ width: 65, height: 22, borderRadius: 100, background: 'var(--gray3)' }} />
            <div style={{ width: 90, height: 22, borderRadius: 100, background: 'var(--gray3)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <div style={{ width: '100%', height: 6, borderRadius: 100, background: 'var(--gray3)' }} />
              <div style={{ width: 50, height: 10, borderRadius: 4, background: 'var(--gray3)', alignSelf: 'flex-end' }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Projetos</h1>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
            {projects.length} projeto{projects.length !== 1 ? 's' : ''} · {clients.length} clientes
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={() => setFilterStatus('')}
            style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${filterStatus === '' ? 'var(--primary)' : 'var(--gray3)'}`,
              background: filterStatus === '' ? 'var(--primary-dim)' : 'transparent',
              color: filterStatus === '' ? 'var(--primary-text)' : 'var(--gray2)',
              transition: 'all 0.15s',
            }}
          >
            Todos
          </button>
          {ALL_STATUSES.map(s => {
            const cfg = STATUS_CONFIG[s]
            const active = filterStatus === s
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(active ? '' : s)}
                style={{
                  padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  border: `1px solid ${active ? cfg.color : 'var(--gray3)'}`,
                  background: active ? cfg.bg : 'transparent',
                  color: active ? cfg.color : 'var(--gray2)',
                  transition: 'all 0.15s',
                }}
              >
                {cfg.label}
              </button>
            )
          })}
          <button
            onClick={handleNew}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
              color: 'var(--primary-text)', background: 'var(--primary-dim)',
              border: '1px solid var(--primary-mid)', padding: '6px 14px',
              borderRadius: 100, cursor: 'pointer', transition: 'opacity .15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            + Novo projeto
          </button>
        </div>
      </div>

      <ProjectTable
        projects={filtered}
        onEdit={p => { setEditing(p); setIsNew(false) }}
        onDelete={p => setDeleting(p)}
      />

      {editing && (
        <EditProjectDrawer
          project={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setIsNew(false) }}
          onDelete={!isNew ? () => { setDeleting(editing); setEditing(null) } : undefined}
          isNew={isNew}
          clients={clients}
        />
      )}

      {deleting && (
        <DeleteProjectModal
          project={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
