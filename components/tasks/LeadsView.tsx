'use client'
import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '@/stores/toastStore'
import type { Lead, LeadFunnelStage, LeadPropensity } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES: { id: LeadFunnelStage; label: string; short: string; color: string; bg: string }[] = [
  { id: 'contato_inicial',  label: '1. Contato Inicial',  short: 'Contato',      color: '#6366F1', bg: 'rgba(99,102,241,0.07)'  },
  { id: 'apresentacao',     label: '2. Apresentação',     short: 'Apresentação', color: '#0891B2', bg: 'rgba(8,145,178,0.07)'   },
  { id: 'proposta',         label: '3. Proposta',         short: 'Proposta',     color: '#7C3AED', bg: 'rgba(124,58,237,0.07)'  },
  { id: 'negociacao',       label: '4. Negociação',       short: 'Negociação',   color: '#EA580C', bg: 'rgba(234,88,12,0.07)'   },
  { id: 'fechamento',       label: '5. Fechamento',       short: 'Fechamento',   color: '#D97706', bg: 'rgba(217,119,6,0.07)'   },
  { id: 'venda_realizada',  label: 'Venda Realizada',     short: 'Venda',        color: '#1E8A3E', bg: 'rgba(30,138,62,0.07)'   },
  { id: 'perdido',          label: 'Perdido',             short: 'Perdido',      color: '#9CA3AF', bg: 'rgba(156,163,175,0.07)' },
]

const PROJECT_TYPES = [
  'Alocação Time', 'Consultoria BI', 'Dev.Software', 'Transformação Digital',
  'Power Platform', 'IA', 'SaaS', 'TaaS', 'BI', 'Outro',
]

const TYPE_COLORS: Record<string, { color: string; bg: string }> = {
  'IA':                { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  'SaaS':              { color: '#0891B2', bg: 'rgba(8,145,178,0.10)'  },
  'BI':                { color: '#D97706', bg: 'rgba(217,119,6,0.10)'  },
  'TaaS':              { color: '#059669', bg: 'rgba(5,150,105,0.10)'  },
  'Consultoria BI':    { color: '#D97706', bg: 'rgba(217,119,6,0.10)'  },
  'Dev.Software':      { color: '#3B82F6', bg: 'rgba(59,130,246,0.10)' },
  'Alocação Time':     { color: '#8B5CF6', bg: 'rgba(139,92,246,0.10)' },
  'Transformação Digital': { color: '#EC4899', bg: 'rgba(236,72,153,0.10)' },
  'Power Platform':    { color: '#0EA5E9', bg: 'rgba(14,165,233,0.10)' },
  'Outro':             { color: '#6B7280', bg: 'rgba(107,114,128,0.10)'},
}

const PROPENSITY_CONFIG: Record<LeadPropensity, { label: string; color: string; bg: string; icon?: string }> = {
  frio:   { label: 'Frio',   color: '#3B82F6', bg: 'rgba(59,130,246,0.10)'  },
  morno:  { label: 'Morno',  color: '#EA580C', bg: 'rgba(234,88,12,0.10)'   },
  quente: { label: 'Quente', color: '#DC2626', bg: 'rgba(220,38,38,0.10)', icon: '🔥' },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtValue(v: number | null | undefined) {
  if (v == null) return '—'
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
}

function getStage(id: LeadFunnelStage) {
  return STAGES.find(s => s.id === id) ?? STAGES[0]
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8 }}>
      {STAGES.filter(s => s.id !== 'perdido').map(s => (
        <div key={s.id} style={{ minWidth: 200, flex: '0 0 200px' }}>
          <div style={{ height: 28, background: 'var(--gray3)', borderRadius: 6, marginBottom: 8, opacity: 0.6 }} />
          {[1,2].map(i => (
            <div key={i} className="shimmer-bar" style={{
              height: 80, background: 'var(--white)', border: '1px solid var(--gray3)',
              borderRadius: 8, marginBottom: 6,
            }} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ── Propensity badge ──────────────────────────────────────────────────────────

function PropensityBadge({ p }: { p: LeadPropensity | null | undefined }) {
  if (!p) return null
  const cfg = PROPENSITY_CONFIG[p]
  return (
    <span style={{
      fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 100,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33`,
      display: 'inline-flex', alignItems: 'center', gap: 3,
    }}>
      {cfg.icon && <span>{cfg.icon}</span>}
      {cfg.label}
    </span>
  )
}

// ── Project type chips ────────────────────────────────────────────────────────

function TypeChips({ types }: { types: string[] }) {
  if (!types.length) return null
  return (
    <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
      {types.map(t => {
        const c = TYPE_COLORS[t] ?? { color: 'var(--gray2)', bg: 'var(--gray3)' }
        return (
          <span key={t} style={{
            fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100,
            background: c.bg, color: c.color,
          }}>{t}</span>
        )
      })}
    </div>
  )
}

// ── Lead form modal ───────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<Lead, 'id' | 'created_at'> = {
  name: '', company: '', context: '', email: '', phone: '',
  first_contact_date: '', funnel_stage: 'contato_inicial', propensity: null,
  project_types: [], project_name: '', estimated_value: null,
  segment: '', sub_segment: '', commercial_origin: '', acquisition_channel: '',
  referred_by: '', notes: '', linkedin_id: '',
}

function LeadFormModal({
  initial, onClose, onSave,
}: {
  initial?: Lead | null
  onClose: () => void
  onSave: (data: Omit<Lead, 'id' | 'created_at'>) => Promise<void>
}) {
  const [form, setForm] = useState<Omit<Lead, 'id' | 'created_at'>>(() =>
    initial
      ? {
          name: initial.name ?? '', company: initial.company ?? '',
          context: initial.context ?? '', email: initial.email ?? '',
          phone: initial.phone ?? '', first_contact_date: initial.first_contact_date ?? '',
          funnel_stage: initial.funnel_stage, propensity: initial.propensity ?? null,
          project_types: initial.project_types ?? [], project_name: initial.project_name ?? '',
          estimated_value: initial.estimated_value ?? null,
          segment: initial.segment ?? '', sub_segment: initial.sub_segment ?? '',
          commercial_origin: initial.commercial_origin ?? '',
          acquisition_channel: initial.acquisition_channel ?? '',
          referred_by: initial.referred_by ?? '', notes: initial.notes ?? '',
          linkedin_id: initial.linkedin_id ?? '',
        }
      : { ...EMPTY_FORM }
  )
  const [saving, setSaving] = useState(false)

  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const toggleType = (t: string) => {
    set('project_types', form.project_types.includes(t)
      ? form.project_types.filter(x => x !== t)
      : [...form.project_types, t]
    )
  }

  const handleSubmit = async () => {
    setSaving(true)
    try { await onSave(form) } finally { setSaving(false) }
  }

  const inputStyle = {
    width: '100%', padding: '7px 10px', fontSize: 12, fontWeight: 500,
    border: '1px solid var(--gray3)', borderRadius: 7,
    background: 'var(--white)', color: 'var(--black)', outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const labelStyle = { fontSize: 11, fontWeight: 700, color: 'var(--black)', display: 'block' as const, marginBottom: 4 }

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(18,19,22,0.45)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 14,
          width: 'min(640px, 100%)',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          animation: 'modalSlideUp 0.22s ease both',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1,
        }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--black)' }}>
            {initial ? 'Editar Lead' : 'Novo Lead'}
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: '1px solid var(--gray3)',
            background: 'var(--bg)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
          }}>×</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row: name + company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input style={inputStyle} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Nome do contato" />
            </div>
            <div>
              <label style={labelStyle}>Empresa</label>
              <input style={inputStyle} value={form.company ?? ''} onChange={e => set('company', e.target.value)} placeholder="Nome da empresa" />
            </div>
          </div>

          {/* Row: email + phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>E-mail</label>
              <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div>
              <label style={labelStyle}>Telefone</label>
              <input style={inputStyle} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+55 11 9xxxx-xxxx" />
            </div>
          </div>

          {/* Row: funnel_stage + propensity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Etapa do Funil</label>
              <select style={inputStyle} value={form.funnel_stage} onChange={e => set('funnel_stage', e.target.value as LeadFunnelStage)}>
                {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Propensão</label>
              <select style={inputStyle} value={form.propensity ?? ''} onChange={e => set('propensity', e.target.value || null)}>
                <option value="">— Sem propensão —</option>
                <option value="frio">Frio</option>
                <option value="morno">Morno</option>
                <option value="quente">Quente 🔥</option>
              </select>
            </div>
          </div>

          {/* Row: segment + sub_segment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Segmento</label>
              <input style={inputStyle} value={form.segment ?? ''} onChange={e => set('segment', e.target.value)} placeholder="Fintech, Saúde, Varejo…" />
            </div>
            <div>
              <label style={labelStyle}>Sub-segmento</label>
              <input style={inputStyle} value={form.sub_segment ?? ''} onChange={e => set('sub_segment', e.target.value)} placeholder="Sub-segmento" />
            </div>
          </div>

          {/* Row: commercial_origin + acquisition_channel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Origem Comercial</label>
              <input style={inputStyle} value={form.commercial_origin ?? ''} onChange={e => set('commercial_origin', e.target.value)} placeholder="Indicação, LinkedIn, Evento…" />
            </div>
            <div>
              <label style={labelStyle}>Canal de Aquisição</label>
              <input style={inputStyle} value={form.acquisition_channel ?? ''} onChange={e => set('acquisition_channel', e.target.value)} placeholder="Inbound, Outbound…" />
            </div>
          </div>

          {/* Row: project_name + estimated_value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome do Projeto</label>
              <input style={inputStyle} value={form.project_name ?? ''} onChange={e => set('project_name', e.target.value)} placeholder="Nome do projeto / solução" />
            </div>
            <div>
              <label style={labelStyle}>Valor Estimado (R$)</label>
              <input style={inputStyle} type="number" value={form.estimated_value ?? ''} onChange={e => set('estimated_value', e.target.value ? Number(e.target.value) : null)} placeholder="0" />
            </div>
          </div>

          {/* Row: first_contact_date + referred_by */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Data do Primeiro Contato</label>
              <input style={inputStyle} type="date" value={form.first_contact_date ?? ''} onChange={e => set('first_contact_date', e.target.value)} />
            </div>
            <div>
              <label style={labelStyle}>Indicado por</label>
              <input style={inputStyle} value={form.referred_by ?? ''} onChange={e => set('referred_by', e.target.value)} placeholder="Nome de quem indicou" />
            </div>
          </div>

          {/* Project types */}
          <div>
            <label style={labelStyle}>Tipos de Projeto</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {PROJECT_TYPES.map(t => {
                const sel = form.project_types.includes(t)
                const c   = TYPE_COLORS[t] ?? { color: '#6B7280', bg: 'rgba(107,114,128,0.10)' }
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    style={{
                      padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${sel ? c.color : 'var(--gray3)'}`,
                      background: sel ? c.bg : 'var(--white)',
                      color: sel ? c.color : 'var(--gray2)',
                      cursor: 'pointer', transition: 'all 0.13s',
                    }}
                  >{t}</button>
                )
              })}
            </div>
          </div>

          {/* Context */}
          <div>
            <label style={labelStyle}>Contexto</label>
            <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.context ?? ''} onChange={e => set('context', e.target.value)} placeholder="Breve contexto do lead…" />
          </div>

          {/* Notes */}
          <div>
            <label style={labelStyle}>Observações</label>
            <textarea style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }} value={form.notes ?? ''} onChange={e => set('notes', e.target.value)} placeholder="Notas internas…" />
          </div>

          {/* LinkedIn ID */}
          <div>
            <label style={labelStyle}>LinkedIn ID</label>
            <input style={inputStyle} value={form.linkedin_id ?? ''} onChange={e => set('linkedin_id', e.target.value)} placeholder="ID do perfil LinkedIn" />
          </div>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px 20px', borderTop: '1px solid var(--gray3)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          position: 'sticky', bottom: 0, background: 'var(--white)',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
            background: 'var(--white)', fontSize: 13, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer',
          }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '8px 22px', borderRadius: 8, border: 'none',
              background: saving ? 'var(--gray3)' : 'var(--primary)',
              color: saving ? 'var(--gray2)' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer',
            }}
          >{saving ? 'Salvando…' : initial ? 'Atualizar' : 'Criar Lead'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Delete confirm modal ──────────────────────────────────────────────────────

function DeleteModal({ lead, onConfirm, onClose }: {
  lead: Lead; onConfirm: () => void; onClose: () => void
}) {
  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2100,
        background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--white)', borderRadius: 14, padding: '24px 28px',
        width: 'min(380px, 100%)', boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column', gap: 14,
      }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)' }}>Remover lead?</div>
        <div style={{ fontSize: 13, color: 'var(--gray2)', lineHeight: 1.5 }}>
          <strong style={{ color: 'var(--black)' }}>{lead.company || lead.name || 'Este lead'}</strong> será removido permanentemente.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{
            padding: '7px 16px', borderRadius: 8, border: '1px solid var(--gray3)',
            background: 'var(--white)', fontSize: 13, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            padding: '7px 16px', borderRadius: 8, border: 'none',
            background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer',
          }}>Remover</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({
  lead, color, isDragging, onDragStart, onDragEnd, onEdit, onDelete,
}: {
  lead: Lead; color: string; isDragging: boolean
  onDragStart: () => void; onDragEnd: () => void
  onEdit: () => void; onDelete: () => void
}) {
  const [hov, setHov] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
      onClick={() => { if (!isDragging) onEdit() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isDragging ? color + '12' : hov ? 'var(--card-hover-bg)' : 'var(--white)',
        borderRadius: 10,
        border: `1px solid ${isDragging ? color + '55' : hov ? color + '44' : 'var(--gray3)'}`,
        borderLeft: `3px solid ${isDragging ? color : hov ? color : 'var(--gray3)'}`,
        boxShadow: isDragging
          ? `0 8px 24px ${color}44`
          : hov ? `0 4px 14px rgba(0,0,0,0.09), 0 0 0 0px ${color}22`
          : 'none',
        cursor: isDragging ? 'grabbing' : 'pointer',
        transition: 'all 0.18s ease',
        transform: isDragging
          ? 'rotate(2deg) scale(1.04) translateZ(0)'
          : hov ? 'translateY(-2px) translateZ(0)' : 'translateZ(0)',
        opacity: isDragging ? 0.5 : 1,
        willChange: 'transform',
        backfaceVisibility: 'hidden',
        position: 'relative', userSelect: 'none',
        padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {lead.name && <div style={{ fontSize: 10, color: 'var(--gray2)', marginBottom: 1 }}>{lead.name}</div>}
          <div style={{
            fontSize: 13, fontWeight: 700, color: 'var(--black)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {lead.company || lead.name || '—'}
          </div>
        </div>
        {lead.estimated_value != null && (
          <span style={{ fontSize: 12, fontWeight: 800, color, flexShrink: 0 }}>
            {fmtValue(lead.estimated_value)}
          </span>
        )}
      </div>

      {lead.notes && (
        <div style={{
          fontSize: 11, color: 'var(--gray2)', lineHeight: 1.4,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{lead.notes}</div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center', flexWrap: 'wrap' }}>
          <PropensityBadge p={lead.propensity} />
          <TypeChips types={(lead.project_types ?? []).slice(0, 2)} />
        </div>
        {lead.first_contact_date && (
          <span style={{ fontSize: 10, color: 'var(--gray2)' }}>
            {new Date(lead.first_contact_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
          </span>
        )}
      </div>

      {hov && !isDragging && (
        <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 3 }}>
          <div
            onClick={e => { e.stopPropagation(); onDelete() }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.10)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)' }}
            style={{
              width: 20, height: 20, borderRadius: 5, cursor: 'pointer',
              background: 'var(--white)', border: '1px solid rgba(220,38,38,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}
          >
            <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.6 7h3.8l.6-7" stroke="#DC2626" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Kanban view ───────────────────────────────────────────────────────────────

function KanbanView({
  leads, onEdit, onDelete, onStageChange,
}: {
  leads: Lead[]
  onEdit: (l: Lead) => void
  onDelete: (l: Lead) => void
  onStageChange: (id: string, stage: LeadFunnelStage) => void
}) {
  const [dragId,   setDragId]   = useState<string | null>(null)
  const [overZone, setOverZone] = useState<LeadFunnelStage | null>(null)

  const activeStages = STAGES.filter(s => s.id !== 'perdido')
  const lostStage    = STAGES.find(s => s.id === 'perdido')!

  function dropProps(stageId: LeadFunnelStage) {
    const canDrop = dragId !== null && leads.find(l => l.id === dragId)?.funnel_stage !== stageId
    return {
      onDragOver: (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (canDrop) setOverZone(stageId) },
      onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverZone(null) },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        if (canDrop && dragId) onStageChange(dragId, stageId)
        setOverZone(null); setDragId(null)
      },
    }
  }

  function renderCol(stage: typeof STAGES[number], colLeads: Lead[], dimmed?: boolean) {
    const { onDragOver, onDragLeave, onDrop } = dropProps(stage.id)
    const isOver = overZone === stage.id
    const total  = colLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0)

    return (
      <div key={stage.id} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
        style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: dimmed ? 0.7 : 1 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {stage.short}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            {total > 0 && <span style={{ fontSize: 10, fontWeight: 700, color: stage.color }}>{fmtValue(total)}</span>}
            <span style={{
              minWidth: 18, height: 18, borderRadius: 5, padding: '0 4px',
              background: stage.color + '18', color: stage.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, border: `1px solid ${stage.color}33`,
            }}>{colLeads.length}</span>
          </div>
        </div>

        <div style={{
          display: 'flex', flexDirection: 'column', gap: 6, minHeight: 60, borderRadius: 7,
          border: isOver ? `2px dashed ${stage.color}` : '2px dashed transparent',
          background: isOver ? stage.color + '08' : 'transparent',
          padding: isOver ? 4 : 0, transition: 'all 0.15s',
        }}>
          {colLeads.map(lead => (
            <KanbanCard
              key={lead.id} lead={lead} color={stage.color}
              isDragging={dragId === lead.id}
              onDragStart={() => setDragId(lead.id)}
              onDragEnd={() => { setDragId(null); setOverZone(null) }}
              onEdit={() => onEdit(lead)}
              onDelete={() => onDelete(lead)}
            />
          ))}
          {colLeads.length === 0 && (
            <div style={{
              padding: '14px 0', textAlign: 'center', fontSize: 11,
              color: isOver ? stage.color : 'var(--gray3)',
              border: `1.5px dashed ${isOver ? stage.color : 'var(--gray3)'}`,
              borderRadius: 7, transition: 'all 0.15s',
            }}>{isOver ? 'Soltar aqui' : 'Sem leads'}</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`, gap: 8, alignItems: 'start' }}>
        {activeStages.map(s => renderCol(s, leads.filter(l => l.funnel_stage === s.id)))}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0' }}>
        <div style={{ flex: 1, height: 1, background: 'var(--gray3)' }} />
        <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Perdidos</span>
        <div style={{ flex: 1, height: 1, background: 'var(--gray3)' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`, gap: 8 }}>
        {renderCol(lostStage, leads.filter(l => l.funnel_stage === 'perdido'), true)}
      </div>
    </div>
  )
}

// ── Table view ────────────────────────────────────────────────────────────────

const TABLE_COLS: { key: keyof Lead | 'actions'; label: string; width: number; sticky?: boolean }[] = [
  { key: 'company',            label: 'Empresa',          width: 160, sticky: true },
  { key: 'name',               label: 'Contato',          width: 140 },
  { key: 'funnel_stage',       label: 'Etapa',            width: 140 },
  { key: 'propensity',         label: 'Propensão',        width: 90  },
  { key: 'estimated_value',    label: 'Valor',            width: 90  },
  { key: 'segment',            label: 'Segmento',         width: 110 },
  { key: 'project_types',      label: 'Tipo de Projeto',  width: 160 },
  { key: 'commercial_origin',  label: 'Origem',           width: 110 },
  { key: 'acquisition_channel',label: 'Canal',            width: 100 },
  { key: 'email',              label: 'E-mail',           width: 160 },
  { key: 'phone',              label: 'Telefone',         width: 120 },
  { key: 'first_contact_date', label: 'Primeiro Contato', width: 120 },
  { key: 'referred_by',        label: 'Indicado por',     width: 120 },
  { key: 'notes',              label: 'Observações',      width: 180 },
  { key: 'actions',            label: '',                 width: 60  },
]

function TableView({
  leads, onEdit, onDelete, onFieldChange,
}: {
  leads: Lead[]
  onEdit: (l: Lead) => void
  onDelete: (l: Lead) => void
  onFieldChange: (id: string, field: keyof Lead, value: unknown) => void
}) {
  const [editCell, setEditCell] = useState<{ rowId: string; col: string } | null>(null)

  function CellContent({ lead, col }: { lead: Lead; col: typeof TABLE_COLS[number] }) {
    const isEditing = editCell?.rowId === lead.id && editCell?.col === col.key
    const val = lead[col.key as keyof Lead]

    if (col.key === 'actions') {
      return (
        <div style={{ display: 'flex', gap: 4, justifyContent: 'center' }}>
          <button onClick={() => onEdit(lead)} style={{
            width: 24, height: 24, borderRadius: 5, border: '1px solid var(--gray3)',
            background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
              <path d="M8 2L10 4L4 10H2V8L8 2Z" stroke="var(--gray2)" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <button onClick={() => onDelete(lead)}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.10)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.5)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.04)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.2)' }}
            style={{
              width: 24, height: 24, borderRadius: 5, border: '1px solid rgba(220,38,38,0.2)',
              background: 'rgba(220,38,38,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s',
            }}>
            <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.6 7h3.8l.6-7" stroke="#DC2626" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )
    }

    if (col.key === 'funnel_stage') {
      if (isEditing) {
        return (
          <select
            autoFocus
            value={lead.funnel_stage}
            onChange={e => { onFieldChange(lead.id, 'funnel_stage', e.target.value); setEditCell(null) }}
            onBlur={() => setEditCell(null)}
            style={{ fontSize: 11, border: '1px solid var(--primary)', borderRadius: 4, padding: '2px 4px', outline: 'none', background: 'var(--white)' }}
          >
            {STAGES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        )
      }
      const stage = getStage(lead.funnel_stage)
      return (
        <span
          onClick={() => setEditCell({ rowId: lead.id, col: col.key })}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, cursor: 'pointer',
            fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 100,
            background: stage.bg, color: stage.color,
          }}
        >
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: stage.color }} />
          {stage.short}
        </span>
      )
    }

    if (col.key === 'propensity') {
      if (isEditing) {
        return (
          <select
            autoFocus
            value={lead.propensity ?? ''}
            onChange={e => { onFieldChange(lead.id, 'propensity', e.target.value || null); setEditCell(null) }}
            onBlur={() => setEditCell(null)}
            style={{ fontSize: 11, border: '1px solid var(--primary)', borderRadius: 4, padding: '2px 4px', outline: 'none', background: 'var(--white)' }}
          >
            <option value="">—</option>
            <option value="frio">Frio</option>
            <option value="morno">Morno</option>
            <option value="quente">Quente 🔥</option>
          </select>
        )
      }
      return (
        <span onClick={() => setEditCell({ rowId: lead.id, col: col.key })} style={{ cursor: 'pointer' }}>
          <PropensityBadge p={lead.propensity} />
          {!lead.propensity && <span style={{ fontSize: 10, color: 'var(--gray3)' }}>—</span>}
        </span>
      )
    }

    if (col.key === 'project_types') {
      return <TypeChips types={lead.project_types ?? []} />
    }

    if (col.key === 'estimated_value') {
      return <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)' }}>{fmtValue(lead.estimated_value)}</span>
    }

    if (col.key === 'first_contact_date' && val) {
      return (
        <span style={{ fontSize: 11, color: 'var(--gray2)' }}>
          {new Date(String(val) + 'T12:00:00').toLocaleDateString('pt-BR')}
        </span>
      )
    }

    const strVal = val != null ? String(val) : ''
    return (
      <span style={{
        fontSize: 12, color: strVal ? 'var(--black)' : 'var(--gray3)',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
        maxWidth: col.width - 16,
      }}>
        {strVal || '—'}
      </span>
    )
  }

  return (
    <div style={{ overflowX: 'auto', borderRadius: 10, border: '1px solid var(--gray3)' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
        <thead>
          <tr style={{ background: 'var(--bg)' }}>
            {TABLE_COLS.map((col, i) => (
              <th
                key={col.key}
                style={{
                  padding: '10px 12px', textAlign: 'left', whiteSpace: 'nowrap',
                  fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
                  textTransform: 'uppercase', letterSpacing: '0.07em',
                  borderBottom: '1px solid var(--gray3)',
                  width: col.width, minWidth: col.width,
                  ...(col.sticky ? {
                    position: 'sticky', left: 0, zIndex: 1,
                    background: 'var(--bg)', boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                  } : {}),
                }}
              >{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead, ri) => (
            <tr
              key={lead.id}
              style={{ background: ri % 2 === 0 ? 'var(--white)' : 'var(--bg)' }}
            >
              {TABLE_COLS.map(col => (
                <td
                  key={col.key}
                  style={{
                    padding: '8px 12px', borderBottom: '1px solid var(--gray3)',
                    verticalAlign: 'middle',
                    ...(col.sticky ? {
                      position: 'sticky', left: 0, zIndex: 1,
                      background: ri % 2 === 0 ? 'var(--white)' : 'var(--bg)',
                      boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                      fontWeight: 700,
                    } : {}),
                  }}
                >
                  <CellContent lead={lead} col={col} />
                </td>
              ))}
            </tr>
          ))}
          {leads.length === 0 && (
            <tr>
              <td colSpan={TABLE_COLS.length} style={{ padding: '32px', textAlign: 'center', color: 'var(--gray2)', fontSize: 13 }}>
                Nenhum lead encontrado
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

// ── LinkedIn banner ───────────────────────────────────────────────────────────

function LinkedInBanner({ onConnect }: { onConnect: () => void }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
      padding: '10px 16px', borderRadius: 8,
      background: 'rgba(0,119,181,0.06)', border: '1px solid rgba(0,119,181,0.25)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#0077B5' }}>
          LinkedIn não conectado — conecte para importar leads de formulários automaticamente.
        </span>
      </div>
      <button
        onClick={onConnect}
        style={{
          padding: '5px 12px', borderRadius: 6, border: '1px solid rgba(0,119,181,0.4)',
          background: '#0077B5', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
        }}
      >Conectar LinkedIn</button>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function LeadsView() {
  const [leads,         setLeads]         = useState<Lead[]>([])
  const [loading,       setLoading]       = useState(true)
  const [view,          setView]          = useState<'kanban' | 'table'>('kanban')
  const [showForm,      setShowForm]      = useState(false)
  const [editingLead,   setEditingLead]   = useState<Lead | null>(null)
  const [deletingLead,  setDeletingLead]  = useState<Lead | null>(null)
  const [linkedInConn,  setLinkedInConn]  = useState<boolean | null>(null)
  const [syncing,       setSyncing]       = useState(false)
  const [hovNewLead,    setHovNewLead]    = useState(false)

  // ── Load leads ──
  const loadLeads = useCallback(async () => {
    try {
      const res = await fetch('/api/leads')
      const data = await res.json() as Lead[]
      setLeads(Array.isArray(data) ? data : [])
    } catch { toast.error('Erro ao carregar leads') }
    finally { setLoading(false) }
  }, [])

  // ── Check LinkedIn status ──
  const checkLinkedIn = useCallback(async () => {
    try {
      const res  = await fetch('/api/integrations')
      const data = await res.json() as Array<{ id: string; extra: Record<string, unknown>; has_key: boolean }>
      const li   = data.find(i => i.id === 'linkedin')
      setLinkedInConn(!!(li?.extra?.access_token))
    } catch { setLinkedInConn(false) }
  }, [])

  useEffect(() => { loadLeads(); checkLinkedIn() }, [loadLeads, checkLinkedIn])

  // ── Handle URL params from LinkedIn callback ──
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('linkedin_connected') === '1') {
      toast.success('LinkedIn conectado com sucesso!')
      setLinkedInConn(true)
      window.history.replaceState({}, '', window.location.pathname)
    }
    if (params.get('linkedin_error')) {
      const code = params.get('linkedin_error')
      const msg =
        code === 'client_id_missing'     ? 'Salve o Client ID antes de conectar (Integrações → LinkedIn).' :
        code === 'client_secret_missing' ? 'Salve o Client Secret antes de conectar (Integrações → LinkedIn).' :
        code === 'not_configured'        ? 'Configure as credenciais LinkedIn em Integrações primeiro.' :
        code === 'invalid_state'         ? 'Sessão OAuth expirada. Tente conectar novamente.' :
        `Erro LinkedIn: ${code}`
      toast.error(msg)
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  // ── KPIs ──
  const activeLeads     = leads.filter(l => !['venda_realizada', 'perdido'].includes(l.funnel_stage))
  const negotiating     = leads.filter(l => ['negociacao', 'fechamento'].includes(l.funnel_stage))
  const totalPipeline   = activeLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0)
  const wonValue        = leads.filter(l => l.funnel_stage === 'venda_realizada').reduce((s, l) => s + (l.estimated_value ?? 0), 0)

  const KPIS = [
    { label: 'Leads ativos',   value: activeLeads.length,    color: '#6366F1' },
    { label: 'Em negociação',  value: negotiating.length,    color: '#EA580C' },
    { label: 'Pipeline total', value: fmtValue(totalPipeline), color: '#0891B2' },
    { label: 'Vendas',         value: fmtValue(wonValue),      color: '#1E8A3E' },
  ]

  // ── Create / Update ──
  const handleSave = async (data: Omit<Lead, 'id' | 'created_at'>) => {
    if (editingLead) {
      // Update
      const res = await fetch(`/api/leads/${editingLead.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error('Erro ao atualizar lead'); return }
      const updated = await res.json() as Lead
      setLeads(prev => prev.map(l => l.id === editingLead.id ? updated : l))
      toast.success('Lead atualizado!')
    } else {
      // Create
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error('Erro ao criar lead'); return }
      const created = await res.json() as Lead
      setLeads(prev => [created, ...prev])
      toast.success('Lead criado!')
    }
    setShowForm(false)
    setEditingLead(null)
  }

  // ── Delete ──
  const handleDelete = async (lead: Lead) => {
    const res = await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Erro ao remover lead'); return }
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    setDeletingLead(null)
    toast.success('Lead removido.')
  }

  // ── Stage change (kanban drag) ──
  const handleStageChange = async (id: string, stage: LeadFunnelStage) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, funnel_stage: stage } : l))
    const res = await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funnel_stage: stage }),
    })
    if (!res.ok) toast.error('Erro ao mover lead')
  }

  // ── Field change (table inline) ──
  const handleFieldChange = async (id: string, field: keyof Lead, value: unknown) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l))
    await fetch(`/api/leads/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value }),
    })
  }



  // ── LinkedIn sync ──
  const handleLinkedInSync = async () => {
    setSyncing(true)
    try {
      const res  = await fetch('/api/integrations/linkedin/sync', { method: 'POST' })
      const data = await res.json() as { imported?: number; skipped?: number; error?: string }
      if (data.error) { toast.error(data.error); return }
      toast.success(`LinkedIn: ${data.imported} importado(s), ${data.skipped} ignorado(s)`)
      await loadLeads()
    } catch { toast.error('Erro ao sincronizar LinkedIn') }
    finally { setSyncing(false) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* LinkedIn banner */}
      {linkedInConn === false && (
        <LinkedInBanner onConnect={() => { window.location.href = '/api/integrations/linkedin/auth' }} />
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--black)', margin: 0, letterSpacing: '-0.3px' }}>
            Pipeline de Leads
          </h1>
          <p style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 3, lineHeight: 1.5 }}>
            Funil comercial — do primeiro contato até a conversão em cliente
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* View toggle — sliding pill */}
          <div style={{ position: 'relative', display: 'flex', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 8, padding: 2 }}>
            <div style={{
              position: 'absolute', top: 2, bottom: 2,
              width: 'calc(50% - 2px)',
              left: view === 'kanban' ? 2 : 'calc(50%)',
              background: 'var(--white)', borderRadius: 6,
              boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
              transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
              pointerEvents: 'none',
            }} />
            {(['kanban', 'table'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  position: 'relative', zIndex: 1,
                  width: 56, padding: '4px 0',
                  borderRadius: 6, border: 'none', cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, textAlign: 'center',
                  background: 'transparent',
                  color: view === v ? 'var(--black)' : 'var(--gray2)',
                  transition: 'color 0.2s ease',
                }}
              >{v === 'kanban' ? 'Kanban' : 'Tabela'}</button>
            ))}
          </div>

          {/* LinkedIn sync */}
          {linkedInConn && (
            <button
              onClick={handleLinkedInSync}
              disabled={syncing}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 100,
                border: '1px solid rgba(0,119,181,0.35)',
                background: syncing ? 'var(--gray3)' : 'rgba(0,119,181,0.08)',
                color: syncing ? 'var(--gray2)' : '#0077B5',
                fontSize: 11, fontWeight: 700, cursor: syncing ? 'wait' : 'pointer', opacity: syncing ? 0.7 : 1,
                transition: 'opacity .15s',
              }}
            >
              {syncing
                ? <><div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid #0077B540', borderTopColor: '#0077B5', animation: 'spin-slow 0.7s linear infinite' }} />Sincronizando…</>
                : <><svg viewBox="0 0 24 24" width="11" height="11" fill="#0077B5"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>Sync LinkedIn</>
              }
            </button>
          )}

          {/* Add lead */}
          <button
            onClick={() => { setEditingLead(null); setShowForm(true) }}
            onMouseEnter={() => setHovNewLead(true)}
            onMouseLeave={() => setHovNewLead(false)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 800, color: '#fff',
              background: 'var(--primary)', border: 'none',
              padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
              boxShadow: hovNewLead ? '0 3px 10px rgba(99,102,241,0.35)' : 'none',
              transform: hovNewLead ? 'translateY(-1px)' : 'translateY(0)',
              opacity: hovNewLead ? 0.88 : 1,
              transition: 'all 0.2s ease',
              letterSpacing: '0.01em',
            }}
          >
            <span style={{
              fontSize: 16, lineHeight: 1, fontWeight: 400,
              display: 'inline-block',
              transform: hovNewLead ? 'rotate(90deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}>+</span>
            Novo Lead
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {KPIS.map(kpi => (
          <div key={kpi.label} style={{
            background: 'var(--white)', border: '1px solid var(--gray3)',
            borderLeft: `4px solid ${kpi.color}`, borderRadius: 12,
            padding: '16px 18px', boxShadow: 'var(--shadow)',
          }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{kpi.label}</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: kpi.color, marginTop: 6 }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Board / Table */}
      {loading ? (
        <Skeleton />
      ) : view === 'kanban' ? (
        <KanbanView
          leads={leads}
          onEdit={l => { setEditingLead(l); setShowForm(true) }}
          onDelete={l => setDeletingLead(l)}
          onStageChange={handleStageChange}
        />
      ) : (
        <TableView
          leads={leads}
          onEdit={l => { setEditingLead(l); setShowForm(true) }}
          onDelete={l => setDeletingLead(l)}
          onFieldChange={handleFieldChange}
        />
      )}

      {/* Modals */}
      {showForm && (
        <LeadFormModal
          initial={editingLead}
          onClose={() => { setShowForm(false); setEditingLead(null) }}
          onSave={handleSave}
        />
      )}
      {deletingLead && (
        <DeleteModal
          lead={deletingLead}
          onConfirm={() => handleDelete(deletingLead)}
          onClose={() => setDeletingLead(null)}
        />
      )}
    </div>
  )
}
