'use client'
import { useState } from 'react'
import { createPortal } from 'react-dom'

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStage = 'contato_inicial' | 'apresentacao_proposta' | 'negociacao' | 'assinatura_contrato' | 'venda_realizada' | 'perdido'

interface Lead {
  id: string
  company: string
  contact: string
  segment: string
  value: number | null
  source: string
  tags: string[]
  stage: LeadStage
  createdAt: string
  note?: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const INITIAL_LEADS: Lead[] = [
  { id: '1',  company: 'NovaPay Fintech',    contact: 'Renata Souza',    segment: 'Fintech',    value: 18000,  source: 'Indicação', tags: ['IA', 'SaaS'], stage: 'contato_inicial',       createdAt: '2026-05-14', note: 'Interesse em automação de atendimento ao cliente via IA.' },
  { id: '2',  company: 'Grupo Alvorada',     contact: 'Felipe Tavares',  segment: 'Varejo',     value: null,   source: 'Outbound',  tags: ['BI'],         stage: 'contato_inicial',       createdAt: '2026-05-16' },
  { id: '3',  company: 'MedCare Saúde',      contact: 'Dra. Carla Lima', segment: 'Saúde',      value: 32000,  source: 'LinkedIn',  tags: ['IA', 'TaaS'], stage: 'contato_inicial',       createdAt: '2026-05-18', note: 'Quer triagem automatizada de pacientes.' },
  { id: '4',  company: 'LogiTrans Brasil',   contact: 'Marco Henrique',  segment: 'Logística',  value: 24000,  source: 'Evento',    tags: ['SaaS'],       stage: 'apresentacao_proposta', createdAt: '2026-05-08', note: 'Reunião de apresentação agendada para quinta.' },
  { id: '5',  company: 'EduFlex',            contact: 'Patrícia Nunes',  segment: 'Edtech',     value: 12000,  source: 'Indicação', tags: ['IA'],         stage: 'apresentacao_proposta', createdAt: '2026-05-10', note: 'Proposta enviada, aguardando retorno.' },
  { id: '6',  company: 'IndusTech S.A.',     contact: 'Ricardo Campos',  segment: 'Indústria',  value: 58000,  source: 'Inbound',   tags: ['BI', 'TaaS'], stage: 'negociacao',            createdAt: '2026-04-28', note: 'Ajuste de escopo e revisão de valores em andamento.' },
  { id: '7',  company: 'Supermercados Boa',  contact: 'Cleusa Ramos',    segment: 'Varejo',     value: 21000,  source: 'Indicação', tags: ['BI'],         stage: 'negociacao',            createdAt: '2026-04-30', note: 'Cliente quer incluir módulo de relatórios extras.' },
  { id: '8',  company: 'StartupHub',         contact: 'André Leal',      segment: 'Tech',       value: 42000,  source: 'Inbound',   tags: ['IA', 'SaaS'], stage: 'negociacao',            createdAt: '2026-04-15', note: 'Ajuste no escopo — cliente quer incluir app mobile.' },
  { id: '9',  company: 'Banco Meridian',     contact: 'Tatiana Borges',  segment: 'Financeiro', value: 120000, source: 'Evento',    tags: ['IA', 'TaaS'], stage: 'assinatura_contrato',   createdAt: '2026-04-10', note: 'Revisão de cláusula de SLA pendente. Contrato quase fechado.' },
  { id: '10', company: 'AgroSmart',          contact: 'Bruno Carvalho',  segment: 'Agro',       value: 36000,  source: 'Indicação', tags: ['SaaS'],       stage: 'assinatura_contrato',   createdAt: '2026-03-20', note: 'Contrato enviado. Aguardando assinatura digital.' },
  { id: '11', company: 'Clínica Vita',       contact: 'Dr. Paulo Melo',  segment: 'Saúde',      value: 28000,  source: 'LinkedIn',  tags: ['IA'],         stage: 'venda_realizada',       createdAt: '2026-03-05' },
  { id: '12', company: 'RetailMax',          contact: 'Simone Ferreira', segment: 'Varejo',     value: 45000,  source: 'Evento',    tags: ['BI', 'SaaS'], stage: 'venda_realizada',       createdAt: '2026-02-18' },
  { id: '13', company: 'OldTech Ltda',       contact: 'Jorge Mendes',    segment: 'Indústria',  value: 15000,  source: 'Outbound',  tags: ['BI'],         stage: 'perdido',               createdAt: '2026-03-01', note: 'Optou por solução interna.' },
]

// ── Config ────────────────────────────────────────────────────────────────────

const STAGES: { id: LeadStage; label: string; color: string; bg: string }[] = [
  { id: 'contato_inicial',       label: 'Contato Inicial',       color: '#6366F1', bg: 'rgba(99,102,241,0.07)'  },
  { id: 'apresentacao_proposta', label: 'Apresentação Proposta', color: '#0891B2', bg: 'rgba(8,145,178,0.07)'   },
  { id: 'negociacao',            label: 'Negociação',            color: '#EA580C', bg: 'rgba(234,88,12,0.07)'   },
  { id: 'assinatura_contrato',   label: 'Assinatura Contrato',   color: '#7C3AED', bg: 'rgba(124,58,237,0.07)'  },
  { id: 'venda_realizada',       label: 'Venda Realizada',       color: '#1E8A3E', bg: 'rgba(30,138,62,0.07)'   },
  { id: 'perdido',               label: 'Perdido',               color: '#9CA3AF', bg: 'rgba(156,163,175,0.07)' },
]

const TAG_COLORS: Record<string, { color: string; bg: string }> = {
  IA:   { color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  SaaS: { color: '#0891B2', bg: 'rgba(8,145,178,0.10)'  },
  BI:   { color: '#D97706', bg: 'rgba(217,119,6,0.10)'  },
  TaaS: { color: '#059669', bg: 'rgba(5,150,105,0.10)'  },
}

const SOURCE_COLORS: Record<string, string> = {
  Indicação: '#1E8A3E', Inbound: '#0891B2', Outbound: '#D97706', LinkedIn: '#0077B5', Evento: '#7C3AED',
}

function fmtK(v: number) {
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

function daysAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
  if (diff === 0) return 'Hoje'
  if (diff === 1) return '1d'
  return `${diff}d`
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function LeadDeleteModal({ lead, onConfirm, onClose }: {
  lead: Lead
  onConfirm: () => void
  onClose: () => void
}) {
  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2100,
        background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--white)', borderRadius: 16,
        padding: '28px 32px 24px',
        width: 'min(400px, calc(100vw - 32px))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'modalSlideUp 0.22s ease both',
        display: 'flex', flexDirection: 'column', gap: 16,
        margin: '0 16px',
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(220,38,38,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--black)', marginBottom: 6 }}>
            Remover lead?
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray2)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--black)' }}>{lead.company}</strong> será removido do pipeline.
            Esta ação não pode ser desfeita.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
              background: 'var(--white)', fontSize: 13, fontWeight: 600,
              color: 'var(--gray)', cursor: 'pointer',
            }}
          >Cancelar</button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 18px', borderRadius: 8, border: 'none',
              background: '#DC2626', fontSize: 13, fontWeight: 700,
              color: '#fff', cursor: 'pointer',
            }}
          >Remover</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({
  lead, color, isDragging,
  onDragStart, onDragEnd, onOpen, onDelete,
}: {
  lead: Lead
  color: string
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onOpen: () => void
  onDelete: () => void
}) {
  const [hov, setHov] = useState(false)

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
      onClick={() => { if (!isDragging) onOpen() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isDragging ? color + '12' : hov ? 'var(--white)' : 'var(--bg)',
        borderRadius: 10,
        border: `1px solid ${isDragging ? color + '55' : hov ? color + '44' : 'var(--gray3)'}`,
        borderLeft: `3px solid ${isDragging ? color : hov ? color : 'var(--gray3)'}`,
        boxShadow: isDragging
          ? `0 12px 32px ${color}40`
          : hov ? `0 4px 14px rgba(0,0,0,0.09), 0 0 0 0px ${color}22`
          : 'none',
        cursor: isDragging ? 'grabbing' : 'grab',
        transition: 'all 0.18s ease',
        transform: isDragging
          ? 'rotate(2deg) scale(1.04)'
          : hov ? 'translateY(-2px)' : 'none',
        opacity: isDragging ? 0.5 : 1,
        position: 'relative',
        userSelect: 'none',
        padding: '10px 12px 10px 10px',
        display: 'flex', flexDirection: 'column', gap: 8,
      }}
    >
        {/* Header: avatar + company + value */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
          <div style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: color + '18', border: `1px solid ${color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color,
          }}>
            {initials(lead.company)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--gray2)', marginBottom: 1 }}>
              {lead.contact}
            </div>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--black)', lineHeight: 1.3,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              paddingRight: hov ? 26 : 0, transition: 'padding 0.15s',
            }}>
              {lead.company}
            </div>
          </div>
          {lead.value != null && (
            <div style={{ fontSize: 12, fontWeight: 800, color, flexShrink: 0, lineHeight: 1, marginTop: 1 }}>
              {fmtK(lead.value)}
            </div>
          )}
        </div>

        {/* Note preview */}
        {lead.note && (
          <div style={{
            fontSize: 11, color: 'var(--gray2)', lineHeight: 1.45,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {lead.note}
          </div>
        )}

        {/* Badges row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {lead.tags.map(tag => {
              const tc = TAG_COLORS[tag] ?? { color: 'var(--gray2)', bg: 'var(--gray3)' }
              return (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                  background: tc.bg, color: tc.color, border: `1px solid ${tc.color}33`,
                }}>
                  {tag}
                </span>
              )
            })}
            <span style={{
              fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
              background: 'var(--bg)', color: SOURCE_COLORS[lead.source] ?? 'var(--gray2)',
              border: '1px solid var(--gray3)',
            }}>
              {lead.source}
            </span>
          </div>
          <span style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500, flexShrink: 0 }}>
            {daysAgo(lead.createdAt)}
          </span>
        </div>

      {/* Hover action buttons */}
      {hov && !isDragging && (
        <div style={{
          position: 'absolute', top: 10, right: 10,
          display: 'flex', gap: 4,
          animation: 'fadeIn 0.12s ease both',
        }}>
          <div
            onClick={e => { e.stopPropagation(); onDelete() }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(220,38,38,0.08)'
              e.currentTarget.style.borderColor = '#DC2626'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--white)'
              e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)'
            }}
            style={{
              width: 20, height: 20, borderRadius: 5,
              background: 'var(--white)', border: '1px solid rgba(220,38,38,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
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

// ── Lead detail modal ─────────────────────────────────────────────────────────

function LeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const stage = STAGES.find(s => s.id === lead.stage)!

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(18,19,22,0.45)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 16,
          width: 'min(520px, calc(100vw - 32px))',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          animation: 'modalSlideUp 0.22s ease both',
          overflow: 'hidden',
        }}
      >
        <div style={{ height: 4, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }} />

        <div style={{ padding: '24px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 10,
                background: stage.color + '14', border: `2px solid ${stage.color}44`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 800, color: stage.color, flexShrink: 0,
              }}>
                {initials(lead.company)}
              </div>
              <div>
                <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--black)' }}>{lead.company}</div>
                <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>{lead.contact} · {lead.segment}</div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: 8, border: '1px solid var(--gray3)',
                background: 'var(--bg)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--gray2)', fontSize: 14, flexShrink: 0,
              }}
            >×</button>
          </div>

          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
              background: stage.bg, color: stage.color, border: `1px solid ${stage.color}30`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color }} />
              {stage.label}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Valor estimado', value: lead.value != null ? fmtK(lead.value) : '—', highlight: !!lead.value },
              { label: 'Origem', value: lead.source },
              { label: 'Entrada', value: new Date(lead.createdAt + 'T12:00:00').toLocaleDateString('pt-BR') },
              { label: 'Segmento', value: lead.segment },
            ].map(({ label, value, highlight }) => (
              <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: highlight ? 800 : 600, color: highlight ? stage.color : 'var(--black)' }}>{value}</div>
              </div>
            ))}
          </div>

          {lead.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {lead.tags.map(tag => {
                const tc = TAG_COLORS[tag] ?? { color: 'var(--gray2)', bg: 'var(--bg)' }
                return (
                  <span key={tag} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: tc.bg, color: tc.color }}>
                    {tag}
                  </span>
                )
              })}
            </div>
          )}

          {lead.note && (
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${stage.color}66` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Observação</div>
              <div style={{ fontSize: 13, color: 'var(--black)', lineHeight: 1.6 }}>{lead.note}</div>
            </div>
          )}

          <div style={{
            fontSize: 10, color: 'var(--gray2)', borderTop: '1px solid var(--gray3)',
            paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 5.5v3M6 4h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            Dados mockados — funcionalidade em desenvolvimento
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function LeadsView() {
  const [leads,        setLeads]        = useState<Lead[]>(INITIAL_LEADS)
  const [openLead,     setOpenLead]     = useState<Lead | null>(null)
  const [deletingLead, setDeletingLead] = useState<Lead | null>(null)
  const [dragId,       setDragId]       = useState<string | null>(null)
  const [overZone,     setOverZone]     = useState<LeadStage | null>(null)

  const activeStages = STAGES.filter(s => s.id !== 'perdido')
  const lostStage    = STAGES.find(s => s.id === 'perdido')!

  // ── Derived KPIs ──
  const totalValue = leads
    .filter(l => !['venda_realizada', 'perdido'].includes(l.stage) && l.value)
    .reduce((s, l) => s + (l.value ?? 0), 0)
  const wonValue = leads
    .filter(l => l.stage === 'venda_realizada' && l.value)
    .reduce((s, l) => s + (l.value ?? 0), 0)
  const activeCount      = leads.filter(l => !['venda_realizada', 'perdido'].includes(l.stage)).length
  const negotiatingCount = leads.filter(l => ['negociacao', 'assinatura_contrato'].includes(l.stage)).length

  const KPIS = [
    { label: 'Leads ativos',   value: activeCount,                          color: '#6366F1' },
    { label: 'Em negociação',  value: negotiatingCount,                     color: '#EA580C' },
    { label: 'Pipeline total', value: `R$ ${(totalValue / 1000).toFixed(0)}k`, color: '#0891B2' },
    { label: 'Vendas (mês)',   value: `R$ ${(wonValue / 1000).toFixed(0)}k`,   color: '#1E8A3E' },
  ]

  // ── Drag helpers ──
  function dropZoneProps(stageId: LeadStage) {
    const draggedLead = leads.find(l => l.id === dragId)
    const curStage    = draggedLead?.stage
    const canDrop     = dragId !== null && curStage !== stageId

    return {
      onDragOver: (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (canDrop) setOverZone(stageId)
      },
      onDragLeave: (e: React.DragEvent) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverZone(null)
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault()
        if (canDrop && dragId) {
          setLeads(prev => prev.map(l => l.id === dragId ? { ...l, stage: stageId } : l))
        }
        setOverZone(null)
        setDragId(null)
      },
      isOver: overZone === stageId && canDrop,
    }
  }

  function handleDelete(lead: Lead) {
    setLeads(prev => prev.filter(l => l.id !== lead.id))
    setDeletingLead(null)
  }

  // ── Column renderer (shared for active + lost) ──
  function renderColumn(
    stage: typeof STAGES[number],
    columnLeads: Lead[],
    opts?: { dimmed?: boolean; gridSpan?: number }
  ) {
    const { onDragOver, onDragLeave, onDrop, isOver } = dropZoneProps(stage.id)
    const stageValue = columnLeads.filter(l => l.value).reduce((s, l) => s + (l.value ?? 0), 0)

    return (
      <div
        key={stage.id}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        style={{
          display: 'flex', flexDirection: 'column', gap: 6,
          opacity: opts?.dimmed ? 0.7 : 1,
          gridColumn: opts?.gridSpan ? `span ${opts.gridSpan}` : undefined,
        }}
      >
        {/* Column header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 4px', marginBottom: 2,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
              {stage.label}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {stageValue > 0 && (
              <span style={{ fontSize: 10, fontWeight: 700, color: stage.color }}>
                {fmtK(stageValue)}
              </span>
            )}
            <span style={{
              minWidth: 18, height: 18, borderRadius: 6,
              background: stage.color + '18', color: stage.color,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10, fontWeight: 800, padding: '0 4px',
              border: `1px solid ${stage.color}33`,
            }}>
              {columnLeads.length}
            </span>
          </div>
        </div>

        {/* Drop zone area */}
        <div
          style={{
            display: 'flex', flexDirection: 'column', gap: 6,
            minHeight: 80,
            borderRadius: 8,
            border: isOver ? `2px dashed ${stage.color}` : '2px dashed transparent',
            background: isOver ? stage.color + '08' : 'transparent',
            padding: isOver ? '4px' : '0',
            transition: 'all 0.15s ease',
          }}
        >
          {columnLeads.map(lead => (
            <LeadCard
              key={lead.id}
              lead={lead}
              color={stage.color}
              isDragging={dragId === lead.id}
              onDragStart={() => setDragId(lead.id)}
              onDragEnd={() => { setDragId(null); setOverZone(null) }}
              onOpen={() => setOpenLead(lead)}
              onDelete={() => setDeletingLead(lead)}
            />
          ))}
          {columnLeads.length === 0 && (
            <div style={{
              padding: '18px 0', textAlign: 'center',
              color: isOver ? stage.color : 'var(--gray3)',
              fontSize: 11, fontWeight: isOver ? 600 : 400,
              border: `1.5px dashed ${isOver ? stage.color : 'var(--gray3)'}`,
              borderRadius: 7,
              transition: 'all 0.15s',
            }}>
              {isOver ? 'Soltar aqui' : 'Sem leads'}
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 900, color: 'var(--black)', margin: 0, letterSpacing: '-0.3px' }}>
            Pipeline de Leads
          </h1>
          <p style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 3, lineHeight: 1.5 }}>
            Funil comercial — do primeiro contato até a conversão em cliente
          </p>
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 12px', borderRadius: 20,
          background: 'var(--primary-dim)', border: '1px solid var(--primary)',
        }}>
          <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
            <circle cx="6" cy="6" r="5" stroke="var(--primary)" strokeWidth="1.3"/>
            <path d="M6 5.5v3M6 4h.01" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--primary)' }}>Dados mockados</span>
        </div>
      </div>

      {/* ── KPIs — StatCard style ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {KPIS.map(kpi => (
          <div
            key={kpi.label}
            onMouseEnter={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(-4px) scale(1.01)'
              el.style.boxShadow = `0 10px 28px rgba(0,0,0,0.10), inset 0 0 0 1px ${kpi.color}30`
            }}
            onMouseLeave={e => {
              const el = e.currentTarget as HTMLDivElement
              el.style.transform = 'translateY(0) scale(1)'
              el.style.boxShadow = 'var(--shadow)'
            }}
            style={{
              background: 'var(--white)',
              border: '1px solid var(--gray3)',
              borderLeft: `4px solid ${kpi.color}`,
              borderRadius: 12,
              padding: '18px 20px',
              display: 'flex', flexDirection: 'column', gap: 6,
              boxShadow: 'var(--shadow)',
              transition: 'transform 0.22s ease, box-shadow 0.22s ease',
              cursor: 'default',
            }}
          >
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {kpi.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, lineHeight: 1, letterSpacing: '-0.02em' }}>
              {kpi.value}
            </div>
          </div>
        ))}
      </div>

      {/* ── Board ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        {/* Active stages */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`,
          gap: 8,
          alignItems: 'start',
        }}>
          {activeStages.map(stage =>
            renderColumn(stage, leads.filter(l => l.stage === stage.id))
          )}
        </div>

        {/* Divider — Perdidos */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--gray3)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            Perdidos
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--gray3)' }} />
        </div>

        {/* Perdido row — same grid width */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`,
          gap: 8,
          alignItems: 'start',
        }}>
          {renderColumn(lostStage, leads.filter(l => l.stage === 'perdido'), { dimmed: true })}
        </div>

      </div>

      {/* Detail modal */}
      {openLead && <LeadModal lead={openLead} onClose={() => setOpenLead(null)} />}

      {/* Delete confirmation */}
      {deletingLead && (
        <LeadDeleteModal
          lead={deletingLead}
          onConfirm={() => handleDelete(deletingLead)}
          onClose={() => setDeletingLead(null)}
        />
      )}
    </div>
  )
}
