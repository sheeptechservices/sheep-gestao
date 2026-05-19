'use client'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type LeadStage = 'contato' | 'qualificacao' | 'proposta' | 'negociacao' | 'contrato' | 'ganho' | 'perdido'

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
  avatar?: string
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  // Contato
  {
    id: '1', company: 'NovaPay Fintech', contact: 'Renata Souza',
    segment: 'Fintech', value: 18000, source: 'Indicação',
    tags: ['IA', 'SaaS'], stage: 'contato',
    createdAt: '2026-05-14', note: 'Interesse em automação de atendimento ao cliente via IA.',
  },
  {
    id: '2', company: 'Grupo Alvorada', contact: 'Felipe Tavares',
    segment: 'Varejo', value: null, source: 'Outbound',
    tags: ['BI'], stage: 'contato',
    createdAt: '2026-05-16',
  },
  {
    id: '3', company: 'MedCare Saúde', contact: 'Dra. Carla Lima',
    segment: 'Saúde', value: 32000, source: 'LinkedIn',
    tags: ['IA', 'TaaS'], stage: 'contato',
    createdAt: '2026-05-18', note: 'Quer triagem automatizada de pacientes.',
  },

  // Qualificação
  {
    id: '4', company: 'LogiTrans Brasil', contact: 'Marco Henrique',
    segment: 'Logística', value: 24000, source: 'Evento',
    tags: ['SaaS'], stage: 'qualificacao',
    createdAt: '2026-05-08', note: 'Reunião de discovery agendada para quinta.',
  },
  {
    id: '5', company: 'EduFlex', contact: 'Patrícia Nunes',
    segment: 'Edtech', value: 12000, source: 'Indicação',
    tags: ['IA'], stage: 'qualificacao',
    createdAt: '2026-05-10',
  },

  // Proposta
  {
    id: '6', company: 'IndusTech S.A.', contact: 'Ricardo Campos',
    segment: 'Indústria', value: 58000, source: 'Inbound',
    tags: ['BI', 'TaaS'], stage: 'proposta',
    createdAt: '2026-04-28', note: 'Proposta enviada em 12/05. Aguardando retorno do jurídico.',
  },
  {
    id: '7', company: 'Supermercados Boa', contact: 'Cleusa Ramos',
    segment: 'Varejo', value: 21000, source: 'Indicação',
    tags: ['BI'], stage: 'proposta',
    createdAt: '2026-04-30',
  },

  // Negociação
  {
    id: '8', company: 'StartupHub', contact: 'André Leal',
    segment: 'Tech', value: 42000, source: 'Inbound',
    tags: ['IA', 'SaaS'], stage: 'negociacao',
    createdAt: '2026-04-15', note: 'Ajuste no escopo — cliente quer incluir app mobile.',
  },
  {
    id: '9', company: 'Banco Meridian', contact: 'Tatiana Borges',
    segment: 'Financeiro', value: 120000, source: 'Evento',
    tags: ['IA', 'TaaS'], stage: 'negociacao',
    createdAt: '2026-04-10', note: 'Revisão de cláusula de SLA pendente.',
  },

  // Contrato
  {
    id: '10', company: 'AgroSmart', contact: 'Bruno Carvalho',
    segment: 'Agro', value: 36000, source: 'Indicação',
    tags: ['SaaS'], stage: 'contrato',
    createdAt: '2026-03-20', note: 'Contrato enviado. Aguardando assinatura digital.',
  },

  // Ganho
  {
    id: '11', company: 'Clínica Vita', contact: 'Dr. Paulo Melo',
    segment: 'Saúde', value: 28000, source: 'LinkedIn',
    tags: ['IA'], stage: 'ganho',
    createdAt: '2026-03-05',
  },
  {
    id: '12', company: 'RetailMax', contact: 'Simone Ferreira',
    segment: 'Varejo', value: 45000, source: 'Evento',
    tags: ['BI', 'SaaS'], stage: 'ganho',
    createdAt: '2026-02-18',
  },

  // Perdido
  {
    id: '13', company: 'OldTech Ltda', contact: 'Jorge Mendes',
    segment: 'Indústria', value: 15000, source: 'Outbound',
    tags: ['BI'], stage: 'perdido',
    createdAt: '2026-03-01', note: 'Optou por solução interna.',
  },
]

// ── Stage config ──────────────────────────────────────────────────────────────

const STAGES: { id: LeadStage; label: string; color: string; bg: string; icon: string }[] = [
  { id: 'contato',      label: 'Contato',      color: '#6366F1', bg: 'rgba(99,102,241,0.08)',   icon: '📞' },
  { id: 'qualificacao', label: 'Qualificação',  color: '#0891B2', bg: 'rgba(8,145,178,0.08)',    icon: '🔍' },
  { id: 'proposta',     label: 'Proposta',      color: '#D97706', bg: 'rgba(217,119,6,0.08)',    icon: '📄' },
  { id: 'negociacao',   label: 'Negociação',    color: '#B45309', bg: 'rgba(180,83,9,0.08)',     icon: '🤝' },
  { id: 'contrato',     label: 'Contrato',      color: '#7C3AED', bg: 'rgba(124,58,237,0.08)',   icon: '✍️' },
  { id: 'ganho',        label: 'Ganho ✓',       color: '#1E8A3E', bg: 'rgba(30,138,62,0.08)',    icon: '🏆' },
  { id: 'perdido',      label: 'Perdido',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)',  icon: '❌' },
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

function fmt(v: number) {
  return v >= 1000 ? `R$ ${(v / 1000).toFixed(0)}k` : `R$ ${v}`
}

function initials(name: string) {
  return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({ lead, onOpen }: { lead: Lead; onOpen: () => void }) {
  const [hov, setHov] = useState(false)

  return (
    <div
      onClick={onOpen}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--gray3)',
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        boxShadow: hov ? '0 4px 16px rgba(0,0,0,0.09)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      {/* Company + avatar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8, flexShrink: 0,
          background: 'var(--primary-dim)', border: '1.5px solid var(--primary)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: 'var(--primary)',
        }}>
          {initials(lead.company)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {lead.company}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1 }}>{lead.contact}</div>
        </div>
      </div>

      {/* Note preview */}
      {lead.note && (
        <div style={{ fontSize: 11, color: 'var(--gray)', lineHeight: 1.45, marginBottom: 9, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {lead.note}
        </div>
      )}

      {/* Tags */}
      {lead.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 9 }}>
          {lead.tags.map(tag => {
            const tc = TAG_COLORS[tag] ?? { color: 'var(--gray2)', bg: 'var(--bg)' }
            return (
              <span key={tag} style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: tc.bg, color: tc.color }}>
                {tag}
              </span>
            )
          })}
          <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 20, background: 'var(--bg)', color: SOURCE_COLORS[lead.source] ?? 'var(--gray2)', border: '1px solid var(--gray3)' }}>
            {lead.source}
          </span>
        </div>
      )}

      {/* Value + segment */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: 'var(--gray2)', fontWeight: 500 }}>{lead.segment}</span>
        {lead.value != null && (
          <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)' }}>{fmt(lead.value)}</span>
        )}
      </div>
    </div>
  )
}

// ── Lead detail modal ─────────────────────────────────────────────────────────

function LeadModal({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const stage = STAGES.find(s => s.id === lead.stage)!

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease both' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: 'var(--white)', borderRadius: 16, width: 480, padding: '28px 28px 24px', boxShadow: '0 24px 60px rgba(0,0,0,0.2)', animation: 'modalSlideUp 0.2s ease both', display: 'flex', flexDirection: 'column', gap: 16 }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--primary-dim)', border: '2px solid var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--primary)', flexShrink: 0 }}>
              {initials(lead.company)}
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--black)' }}>{lead.company}</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 1 }}>{lead.contact} · {lead.segment}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: '50%', border: 'none', background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', fontSize: 16, flexShrink: 0 }}>×</button>
        </div>

        {/* Stage badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Etapa</span>
          <span style={{ fontSize: 12, fontWeight: 700, padding: '4px 12px', borderRadius: 20, background: stage.bg, color: stage.color }}>
            {stage.icon} {stage.label}
          </span>
        </div>

        {/* Info grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Valor estimado', value: lead.value != null ? fmt(lead.value) : '—' },
            { label: 'Origem', value: lead.source },
            { label: 'Entrada', value: new Date(lead.createdAt).toLocaleDateString('pt-BR') },
            { label: 'Segmento', value: lead.segment },
          ].map(({ label, value }) => (
            <div key={label} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Tags */}
        {lead.tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {lead.tags.map(tag => {
              const tc = TAG_COLORS[tag] ?? { color: 'var(--gray2)', bg: 'var(--bg)' }
              return <span key={tag} style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: tc.bg, color: tc.color }}>{tag}</span>
            })}
          </div>
        )}

        {/* Note */}
        {lead.note && (
          <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Observação</div>
            <div style={{ fontSize: 13, color: 'var(--black)', lineHeight: 1.55 }}>{lead.note}</div>
          </div>
        )}

        {/* Footer notice */}
        <div style={{ fontSize: 11, color: 'var(--gray2)', borderTop: '1px solid var(--gray3)', paddingTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/><path d="M6 5.5v3M6 4h.01" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
          Funcionalidade em desenvolvimento — dados mockados para validação
        </div>
      </div>
    </div>
  )
}

// ── Main view ─────────────────────────────────────────────────────────────────

export function LeadsView() {
  const [openLead, setOpenLead] = useState<Lead | null>(null)
  const [filter, setFilter]     = useState<'all' | LeadStage>('all')

  const activeStages = STAGES.filter(s => s.id !== 'ganho' && s.id !== 'perdido')
  const closedStages = STAGES.filter(s => s.id === 'ganho' || s.id === 'perdido')

  const totalValue = MOCK_LEADS
    .filter(l => l.stage !== 'perdido' && l.stage !== 'ganho' && l.value)
    .reduce((s, l) => s + (l.value ?? 0), 0)

  const wonValue = MOCK_LEADS
    .filter(l => l.stage === 'ganho' && l.value)
    .reduce((s, l) => s + (l.value ?? 0), 0)

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--black)', margin: 0 }}>Pipeline de Leads</h1>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 4, lineHeight: 1.5 }}>
              Acompanhamento do funil comercial — do primeiro contato até a conversão em cliente.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 20, background: 'var(--primary-dim)', border: '1px solid var(--primary)', opacity: 0.8 }}>
              <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><circle cx="6" cy="6" r="5" stroke="var(--primary)" strokeWidth="1.3"/><path d="M6 5.5v3M6 4h.01" stroke="var(--primary)" strokeWidth="1.3" strokeLinecap="round"/></svg>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--primary)' }}>Dados mockados — em desenvolvimento</span>
            </div>
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
          {[
            { label: 'Leads ativos', value: MOCK_LEADS.filter(l => !['ganho','perdido'].includes(l.stage)).length, color: '#6366F1' },
            { label: 'Em negociação', value: MOCK_LEADS.filter(l => ['negociacao','contrato'].includes(l.stage)).length, color: '#D97706' },
            { label: 'Pipeline total', value: `R$ ${(totalValue/1000).toFixed(0)}k`, color: '#0891B2' },
            { label: 'Ganhos (mês)', value: `R$ ${(wonValue/1000).toFixed(0)}k`, color: '#1E8A3E' },
          ].map(kpi => (
            <div key={kpi.label} style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 10, padding: '12px 18px', minWidth: 130, flex: '1 1 130px', maxWidth: 200 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{kpi.label}</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban board */}
      <div style={{ overflowX: 'auto', paddingBottom: 20 }}>
        <div style={{ display: 'flex', gap: 12, minWidth: 'max-content', alignItems: 'flex-start' }}>
          {activeStages.map(stage => {
            const leads = MOCK_LEADS.filter(l => l.stage === stage.id)
            const stageValue = leads.filter(l => l.value).reduce((s, l) => s + (l.value ?? 0), 0)

            return (
              <div key={stage.id} style={{ width: 240, flexShrink: 0 }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '8px 12px', background: stage.bg, borderRadius: 10, border: `1px solid ${stage.color}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 14 }}>{stage.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {stageValue > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, opacity: 0.8 }}>
                        {fmt(stageValue)}
                      </span>
                    )}
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: stage.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: stage.color }}>
                      {leads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 80 }}>
                  {leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onOpen={() => setOpenLead(lead)} />
                  ))}
                  {leads.length === 0 && (
                    <div style={{ padding: '20px 12px', textAlign: 'center', color: 'var(--gray2)', fontSize: 12, border: '1.5px dashed var(--gray3)', borderRadius: 10 }}>
                      Nenhum lead
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {/* Separator */}
          <div style={{ width: 1, background: 'var(--gray3)', alignSelf: 'stretch', margin: '0 4px', borderRadius: 1 }} />

          {/* Closed stages (Ganho + Perdido) — more compact */}
          {closedStages.map(stage => {
            const leads = MOCK_LEADS.filter(l => l.stage === stage.id)
            const stageValue = leads.filter(l => l.value).reduce((s, l) => s + (l.value ?? 0), 0)
            return (
              <div key={stage.id} style={{ width: 200, flexShrink: 0, opacity: stage.id === 'perdido' ? 0.75 : 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, padding: '8px 12px', background: stage.bg, borderRadius: 10, border: `1px solid ${stage.color}22` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 13 }}>{stage.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    {stageValue > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: stage.color, opacity: 0.8 }}>{fmt(stageValue)}</span>
                    )}
                    <span style={{ width: 20, height: 20, borderRadius: 6, background: stage.color + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: stage.color }}>
                      {leads.length}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} onOpen={() => setOpenLead(lead)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Lead detail modal */}
      {openLead && <LeadModal lead={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  )
}
