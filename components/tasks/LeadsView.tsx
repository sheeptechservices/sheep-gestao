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
}

// ── Mock data ─────────────────────────────────────────────────────────────────

const MOCK_LEADS: Lead[] = [
  { id: '1',  company: 'NovaPay Fintech',      contact: 'Renata Souza',    segment: 'Fintech',    value: 18000,  source: 'Indicação', tags: ['IA', 'SaaS'],    stage: 'contato',      createdAt: '2026-05-14', note: 'Interesse em automação de atendimento ao cliente via IA.' },
  { id: '2',  company: 'Grupo Alvorada',        contact: 'Felipe Tavares',  segment: 'Varejo',     value: null,   source: 'Outbound',  tags: ['BI'],            stage: 'contato',      createdAt: '2026-05-16' },
  { id: '3',  company: 'MedCare Saúde',         contact: 'Dra. Carla Lima', segment: 'Saúde',      value: 32000,  source: 'LinkedIn',  tags: ['IA', 'TaaS'],    stage: 'contato',      createdAt: '2026-05-18', note: 'Quer triagem automatizada de pacientes.' },
  { id: '4',  company: 'LogiTrans Brasil',       contact: 'Marco Henrique',  segment: 'Logística',  value: 24000,  source: 'Evento',    tags: ['SaaS'],          stage: 'qualificacao', createdAt: '2026-05-08', note: 'Reunião de discovery agendada para quinta.' },
  { id: '5',  company: 'EduFlex',               contact: 'Patrícia Nunes',  segment: 'Edtech',     value: 12000,  source: 'Indicação', tags: ['IA'],            stage: 'qualificacao', createdAt: '2026-05-10' },
  { id: '6',  company: 'IndusTech S.A.',         contact: 'Ricardo Campos',  segment: 'Indústria',  value: 58000,  source: 'Inbound',   tags: ['BI', 'TaaS'],    stage: 'proposta',     createdAt: '2026-04-28', note: 'Proposta enviada em 12/05. Aguardando retorno do jurídico.' },
  { id: '7',  company: 'Supermercados Boa',      contact: 'Cleusa Ramos',    segment: 'Varejo',     value: 21000,  source: 'Indicação', tags: ['BI'],            stage: 'proposta',     createdAt: '2026-04-30' },
  { id: '8',  company: 'StartupHub',             contact: 'André Leal',      segment: 'Tech',       value: 42000,  source: 'Inbound',   tags: ['IA', 'SaaS'],    stage: 'negociacao',   createdAt: '2026-04-15', note: 'Ajuste no escopo — cliente quer incluir app mobile.' },
  { id: '9',  company: 'Banco Meridian',         contact: 'Tatiana Borges',  segment: 'Financeiro', value: 120000, source: 'Evento',    tags: ['IA', 'TaaS'],    stage: 'negociacao',   createdAt: '2026-04-10', note: 'Revisão de cláusula de SLA pendente.' },
  { id: '10', company: 'AgroSmart',              contact: 'Bruno Carvalho',  segment: 'Agro',       value: 36000,  source: 'Indicação', tags: ['SaaS'],          stage: 'contrato',     createdAt: '2026-03-20', note: 'Contrato enviado. Aguardando assinatura digital.' },
  { id: '11', company: 'Clínica Vita',           contact: 'Dr. Paulo Melo',  segment: 'Saúde',      value: 28000,  source: 'LinkedIn',  tags: ['IA'],            stage: 'ganho',        createdAt: '2026-03-05' },
  { id: '12', company: 'RetailMax',              contact: 'Simone Ferreira', segment: 'Varejo',     value: 45000,  source: 'Evento',    tags: ['BI', 'SaaS'],    stage: 'ganho',        createdAt: '2026-02-18' },
  { id: '13', company: 'OldTech Ltda',           contact: 'Jorge Mendes',    segment: 'Indústria',  value: 15000,  source: 'Outbound',  tags: ['BI'],            stage: 'perdido',      createdAt: '2026-03-01', note: 'Optou por solução interna.' },
]

// ── Config ────────────────────────────────────────────────────────────────────

const STAGES: { id: LeadStage; label: string; color: string; bg: string }[] = [
  { id: 'contato',      label: 'Contato',      color: '#6366F1', bg: 'rgba(99,102,241,0.07)'  },
  { id: 'qualificacao', label: 'Qualificação',  color: '#0891B2', bg: 'rgba(8,145,178,0.07)'   },
  { id: 'proposta',     label: 'Proposta',      color: '#D97706', bg: 'rgba(217,119,6,0.07)'   },
  { id: 'negociacao',   label: 'Negociação',    color: '#EA580C', bg: 'rgba(234,88,12,0.07)'   },
  { id: 'contrato',     label: 'Contrato',      color: '#7C3AED', bg: 'rgba(124,58,237,0.07)'  },
  { id: 'ganho',        label: 'Ganho',         color: '#1E8A3E', bg: 'rgba(30,138,62,0.07)'   },
  { id: 'perdido',      label: 'Perdido',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.07)' },
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

// ── Lead card ─────────────────────────────────────────────────────────────────

function LeadCard({ lead, color, onOpen }: { lead: Lead; color: string; onOpen: () => void }) {
  return (
    <div
      onClick={onOpen}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'var(--shadow)'
      }}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--gray3)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        cursor: 'pointer',
        transition: 'transform .2s, box-shadow .2s',
        position: 'relative',
      }}
    >
      {/* Top color bar — identical to ProjectCard */}
      <div style={{ height: 3, background: color }} />

      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Header: company + value */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: color + '14', border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800, color,
          }}>
            {initials(lead.company)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)', marginBottom: 2 }}>
              {lead.contact}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {lead.company}
            </div>
          </div>
          {lead.value != null && (
            <div style={{ fontSize: 13, fontWeight: 800, color, flexShrink: 0, lineHeight: 1 }}>
              {fmtK(lead.value)}
            </div>
          )}
        </div>

        {/* Note preview */}
        {lead.note && (
          <div style={{
            fontSize: 11, color: 'var(--gray)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical', overflow: 'hidden',
          }}>
            {lead.note}
          </div>
        )}

        {/* Badges */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {lead.tags.map(tag => {
              const tc = TAG_COLORS[tag] ?? { color: 'var(--gray2)', bg: 'var(--gray3)' }
              return (
                <span key={tag} style={{
                  fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
                  background: tc.bg, color: tc.color,
                  border: `1px solid ${tc.color}33`,
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
        {/* Color bar top */}
        <div style={{ height: 4, background: `linear-gradient(90deg, ${stage.color}, ${stage.color}88)` }} />

        <div style={{ padding: '24px 28px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Header */}
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
                transition: 'all 0.15s',
              }}
            >×</button>
          </div>

          {/* Stage pill */}
          <div>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 20,
              background: stage.bg, color: stage.color,
              border: `1px solid ${stage.color}30`,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: stage.color }} />
              {stage.label}
            </span>
          </div>

          {/* Info grid */}
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

          {/* Tags */}
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

          {/* Note */}
          {lead.note && (
            <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '12px 14px', borderLeft: `3px solid ${stage.color}66` }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>Observação</div>
              <div style={{ fontSize: 13, color: 'var(--black)', lineHeight: 1.6 }}>{lead.note}</div>
            </div>
          )}

          {/* Footer */}
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
  const [openLead, setOpenLead] = useState<Lead | null>(null)

  const activeStages = STAGES.filter(s => s.id !== 'ganho' && s.id !== 'perdido')
  const closedStages = STAGES.filter(s => s.id === 'ganho' || s.id === 'perdido')

  const totalValue = MOCK_LEADS
    .filter(l => !['ganho', 'perdido'].includes(l.stage) && l.value)
    .reduce((s, l) => s + (l.value ?? 0), 0)
  const wonValue = MOCK_LEADS
    .filter(l => l.stage === 'ganho' && l.value)
    .reduce((s, l) => s + (l.value ?? 0), 0)
  const activeCount = MOCK_LEADS.filter(l => !['ganho', 'perdido'].includes(l.stage)).length
  const negotiatingCount = MOCK_LEADS.filter(l => ['negociacao', 'contrato'].includes(l.stage)).length

  const KPIS = [
    { label: 'Leads ativos',   value: activeCount,                         color: '#6366F1', icon: 'M4 17V7l8-4 8 4v10M12 17V7' },
    { label: 'Em negociação',  value: negotiatingCount,                     color: '#EA580C', icon: 'M17 20H7M12 4v16M4 9l8-5 8 5' },
    { label: 'Pipeline total', value: `R$ ${(totalValue/1000).toFixed(0)}k`, color: '#0891B2', icon: 'M12 20V10M6 20V16M18 20V4' },
    { label: 'Ganhos (mês)',   value: `R$ ${(wonValue/1000).toFixed(0)}k`,   color: '#1E8A3E', icon: 'M20 6L9 17l-5-5' },
  ]

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

        {/* Active stages — full-width grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${activeStages.length}, 1fr)`,
          gap: 8,
          alignItems: 'start',
        }}>
          {activeStages.map(stage => {
            const leads = MOCK_LEADS.filter(l => l.stage === stage.id)
            const stageValue = leads.filter(l => l.value).reduce((s, l) => s + (l.value ?? 0), 0)

            return (
              <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      {leads.length}
                    </span>
                  </div>
                </div>

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 80 }}>
                  {leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} color={stage.color} onOpen={() => setOpenLead(lead)} />
                  ))}
                  {leads.length === 0 && (
                    <div style={{
                      padding: '18px 0', textAlign: 'center',
                      color: 'var(--gray3)', fontSize: 11,
                      border: '1.5px dashed var(--gray3)', borderRadius: 7,
                    }}>
                      Sem leads
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--gray3)' }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
            Encerrados
          </span>
          <div style={{ flex: 1, height: 1, background: 'var(--gray3)' }} />
        </div>

        {/* Closed stages — full-width grid, 2 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
          alignItems: 'start',
        }}>
          {closedStages.map(stage => {
            const leads = MOCK_LEADS.filter(l => l.stage === stage.id)
            const stageValue = leads.filter(l => l.value).reduce((s, l) => s + (l.value ?? 0), 0)
            const isLost = stage.id === 'perdido'

            return (
              <div key={stage.id} style={{ display: 'flex', flexDirection: 'column', gap: 6, opacity: isLost ? 0.7 : 1 }}>
                {/* Column header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 12px',
                  background: stage.bg,
                  borderRadius: 8,
                  borderBottom: `2px solid ${stage.color}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: 800, color: stage.color }}>{stage.label}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {stageValue > 0 && (
                      <span style={{ fontSize: 9, fontWeight: 700, color: stage.color, opacity: 0.75 }}>{fmtK(stageValue)}</span>
                    )}
                    <span style={{
                      minWidth: 18, height: 18, borderRadius: 6,
                      background: stage.color, color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, fontWeight: 800, padding: '0 4px',
                    }}>
                      {leads.length}
                    </span>
                  </div>
                </div>

                {/* Compact cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {leads.map(lead => (
                    <LeadCard key={lead.id} lead={lead} color={stage.color} onOpen={() => setOpenLead(lead)} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Detail modal */}
      {openLead && <LeadModal lead={openLead} onClose={() => setOpenLead(null)} />}
    </div>
  )
}
