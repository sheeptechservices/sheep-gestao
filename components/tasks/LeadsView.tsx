'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '@/stores/toastStore'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useBreakpoint } from '@/hooks/useBreakpoint'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatarTip } from '@/components/ui/MemberAvatarTip'
import { MemberAvatar } from '@/components/ui/MemberAvatar'
import { MemberPicker } from '@/components/ui/MemberPicker'
import type { Lead, LeadFunnelStage, LeadPropensity } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const STAGES: { id: LeadFunnelStage; label: string; short: string; color: string; bg: string }[] = [
  { id: 'novo_lead',        label: '1. Novo Lead',        short: 'Novo Lead',    color: '#8B5CF6', bg: 'rgba(139,92,246,0.07)'  },
  { id: 'contato_inicial',  label: '2. Contato Inicial',  short: 'Contato',      color: '#6366F1', bg: 'rgba(99,102,241,0.07)'  },
  { id: 'proposta',         label: '3. Proposta',         short: 'Proposta',     color: '#7C3AED', bg: 'rgba(124,58,237,0.07)'  },
  { id: 'negociacao',       label: '4. Negociação',       short: 'Negociação',   color: '#EA580C', bg: 'rgba(234,88,12,0.07)'   },
  { id: 'venda_realizada',  label: 'Venda Realizada',     short: 'Venda',        color: '#1E8A3E', bg: 'rgba(30,138,62,0.07)'   },
  { id: 'perdido',          label: 'Perdido',             short: 'Perdido',      color: '#9CA3AF', bg: 'rgba(156,163,175,0.07)' },
]

const SEGMENT_OPTIONS = [
  { value: '',                       label: '— Sem segmento —'      },
  { value: 'Marketing & Publicidade', label: 'Marketing & Publicidade' },
  { value: 'Eventos',                label: 'Eventos'               },
  { value: 'Produção Audiovisual',   label: 'Produção Audiovisual'  },
  { value: 'Consultoria',            label: 'Consultoria'           },
  { value: 'Logística',              label: 'Logística'             },
  { value: 'Gamer',                  label: 'Gamer'                 },
  { value: 'Indústria',              label: 'Indústria'             },
  { value: 'Contabilidade',          label: 'Contabilidade'         },
  { value: 'Veterinário',            label: 'Veterinário'           },
  { value: 'Agronegócio',            label: 'Agronegócio'           },
  { value: 'Construção Civil',       label: 'Construção Civil'      },
  { value: 'Educação',               label: 'Educação'              },
  { value: 'Financeiro',             label: 'Financeiro'            },
  { value: 'Jurídico',               label: 'Jurídico'              },
  { value: 'Óleo e Gás',             label: 'Óleo e Gás'            },
  { value: 'Saúde',                  label: 'Saúde'                 },
  { value: 'Tecnologia',             label: 'Tecnologia'            },
  { value: 'Varejo / E-commerce',    label: 'Varejo / E-commerce'   },
  { value: 'Outro',                  label: 'Outro'                 },
]

const SUB_SEGMENT_OPTIONS = [
  { value: '',                       label: '— Sem sub-segmento —'   },
  { value: 'Veículo de Mídia',       label: 'Veículo de Mídia'       },
  { value: 'Produção de Eventos',    label: 'Produção de Eventos'    },
  { value: 'Criador Individual',     label: 'Criador Individual'     },
  { value: 'Produção Audiovisual',   label: 'Produção Audiovisual'   },
  { value: 'Agência',                label: 'Agência'                },
  { value: 'Imprensa/PR',            label: 'Imprensa/PR'            },
  { value: 'Organização de Eventos', label: 'Organização de Eventos' },
  { value: 'Autônomo',               label: 'Autônomo'               },
  { value: 'Produção Cultural',      label: 'Produção Cultural'      },
  { value: 'Agência de Atores',      label: 'Agência de Atores'      },
  { value: 'Consultoria Estratégica', label: 'Consultoria Estratégica' },
  { value: 'Logística',              label: 'Logística'              },
  { value: 'Infra de Eventos',       label: 'Infra de Eventos'       },
  { value: 'E-sports',               label: 'E-sports'               },
  { value: 'Aço',                    label: 'Aço'                    },
  { value: 'Plano de Benefícios',    label: 'Plano de Benefícios'    },
  { value: 'Outro',                  label: 'Outro'                  },
]

const COMMERCIAL_ORIGIN_OPTIONS = [
  { value: '',               label: '— Sem origem —'       },
  { value: 'Indicação',      label: 'Indicação'             },
  { value: 'LinkedIn',       label: 'LinkedIn'              },
  { value: 'Evento',         label: 'Evento'                },
  { value: 'Site / Blog',    label: 'Site / Blog'           },
  { value: 'Cold Outreach',  label: 'Cold Outreach'         },
  { value: 'Parceria',       label: 'Parceria'              },
  { value: 'Rede Social',    label: 'Rede Social'           },
  { value: 'Prospecção Ativa', label: 'Prospecção Ativa'    },
  { value: 'Outro',          label: 'Outro'                 },
]

const ACQUISITION_CHANNEL_OPTIONS = [
  { value: '',          label: '— Sem canal —'  },
  { value: 'Inbound',   label: 'Inbound'        },
  { value: 'Outbound',  label: 'Outbound'       },
  { value: 'Indicação', label: 'Indicação'      },
  { value: 'LinkedIn',  label: 'LinkedIn'       },
  { value: 'E-mail',    label: 'E-mail'         },
  { value: 'WhatsApp',  label: 'WhatsApp'       },
  { value: 'Evento',    label: 'Evento'         },
  { value: 'Instagram', label: 'Instagram'      },
  { value: 'Outro',     label: 'Outro'          },
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

function ShimBar({ w, h, r = 6, mb = 0, style }: { w: number | string; h: number; r?: number; mb?: number; style?: React.CSSProperties }) {
  return (
    <div className="shimmer-bar" style={{
      width: w, height: h, borderRadius: r, marginBottom: mb,
      flexShrink: 0, ...style,
    }} />
  )
}

function Skeleton() {
  const { isMobile } = useBreakpoint()
  const colCount = isMobile ? 3 : STAGES.length   // show 3 cols on mobile

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

      {/* Header shimmer */}
      <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'flex-start' : 'flex-start', justifyContent: 'space-between', gap: isMobile ? 12 : 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <ShimBar w={isMobile ? 160 : 200} h={22} r={7} />
          <ShimBar w={isMobile ? 220 : 300} h={13} r={5} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ShimBar w={120} h={30} r={8} />
          <ShimBar w={isMobile ? 90 : 110} h={30} r={100} />
        </div>
      </div>

      {/* KPI cards shimmer — 2×2 on mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: 10 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="shimmer-bar" style={{
            borderRadius: 12, height: isMobile ? 72 : 80,
            border: '1px solid var(--gray3)',
          }} />
        ))}
      </div>

      {/* Kanban board shimmer — horizontal scroll on mobile */}
      <div style={{ overflowX: isMobile ? 'auto' : 'visible', margin: isMobile ? '0 -2px' : 0 }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? `repeat(${colCount}, 172px)` : `repeat(${STAGES.length}, 1fr)`,
          gap: 8, alignItems: 'start',
          minWidth: isMobile ? `${colCount * 180}px` : undefined,
        }}>
          {STAGES.slice(0, colCount).map((s, ci) => (
            <div key={s.id}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 4px', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--gray3)' }} />
                  <ShimBar w={50} h={10} r={4} />
                </div>
                <ShimBar w={22} h={18} r={5} />
              </div>
              {[1, 2, ci % 2 === 0 ? 3 : 0].filter(Boolean).map(i => (
                <div key={i} className="shimmer-bar" style={{
                  height: i === 3 ? 68 : 80,
                  borderRadius: 10, marginBottom: 6,
                  border: '1px solid var(--gray3)',
                }} />
              ))}
            </div>
          ))}
        </div>
      </div>

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

// ── Lead attachment type ──────────────────────────────────────────────────────

interface LeadAttachment {
  id: string
  lead_id: string
  filename: string
  url: string
  size: number
  mime_type: string
  created_at: string
}

// ── Lead form modal ───────────────────────────────────────────────────────────

const EMPTY_FORM: Omit<Lead, 'id' | 'created_at'> = {
  name: '', company: '', context: '', email: '', phone: '',
  first_contact_date: '', funnel_stage: 'novo_lead', propensity: null,
  project_types: [], project_name: '', estimated_value: null,
  segment: '', sub_segment: '', commercial_origin: '', acquisition_channel: '',
  referred_by: '', notes: '', linkedin_id: '', owner_id: '',
}

function LeadFormModal({
  initial, defaultStage, onClose, onSave,
}: {
  initial?: Lead | null
  defaultStage?: LeadFunnelStage
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
          linkedin_id: initial.linkedin_id ?? '', owner_id: initial.owner_id ?? '',
        }
      : { ...EMPTY_FORM, funnel_stage: defaultStage ?? EMPTY_FORM.funnel_stage }
  )
  const [saving,          setSaving]          = useState(false)
  const [attachments,     setAttachments]     = useState<LeadAttachment[]>([])
  const [attFetching,     setAttFetching]     = useState(false)
  const [attUploading,    setAttUploading]    = useState(false)
  const [attLoading,      setAttLoading]      = useState(false)
  const [attHover,        setAttHover]        = useState(false)
  const [dragOver,        setDragOver]        = useState(false)
  const [attHoverId,      setAttHoverId]      = useState<string | null>(null)
  const [attToDelete,     setAttToDelete]     = useState<LeadAttachment | null>(null)
  const [previewAtt,      setPreviewAtt]      = useState<LeadAttachment | null>(null)
  const [previewLoading,  setPreviewLoading]  = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const leadId = initial?.id ?? null

  // Load existing attachments when editing
  useEffect(() => {
    if (!leadId) return
    setAttFetching(true)
    fetch(`/api/lead-attachments?lead_id=${leadId}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAttachments(data as LeadAttachment[]) })
      .catch(() => {})
      .finally(() => setAttFetching(false))
  }, [leadId])

  async function handleAttachFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !leadId) return
    setAttUploading(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('lead_id', leadId)
      try {
        const res  = await fetch('/api/lead-attachments', { method: 'POST', body: fd })
        const data = await res.json() as LeadAttachment & { error?: string }
        if (data.error) { toast.error(data.error); continue }
        setAttachments(prev => [...prev, data])
      } catch {
        toast.error('Erro ao fazer upload do arquivo')
      }
    }
    setAttUploading(false)
    e.target.value = ''
  }

  async function handleDeleteAttachment(att: LeadAttachment) {
    setAttLoading(true)
    try {
      await fetch(`/api/lead-attachments/${att.id}`, { method: 'DELETE' })
      setAttachments(prev => prev.filter(a => a.id !== att.id))
    } catch {
      toast.error('Erro ao remover anexo')
    } finally {
      setAttLoading(false)
    }
  }

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

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', fontSize: 12, fontWeight: 500,
    border: '1px solid var(--gray3)', borderRadius: 8,
    background: 'var(--bg)', color: 'var(--black)', outline: 'none',
    boxSizing: 'border-box', fontFamily: 'inherit',
  }

  const label = (text: string) => (
    <label style={{
      fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
      textTransform: 'uppercase' as const, letterSpacing: '0.06em',
      display: 'block', marginBottom: 6,
    }}>{text}</label>
  )

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(18,19,22,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 16,
          width: 'min(600px, 100%)',
          maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          animation: 'modalSlideUp 0.22s ease both',
          display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '22px 28px 18px', borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1,
          borderRadius: '16px 16px 0 0',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', margin: 0 }}>
            {initial ? 'Editar Lead' : 'Novo Lead'}
          </h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--bg)', cursor: 'pointer', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
          }}>×</button>
        </div>

        <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Row: name + company */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('Nome')}
              <input style={inputStyle} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Nome do contato" />
            </div>
            <div>
              {label('Empresa')}
              <input style={inputStyle} value={form.company ?? ''} onChange={e => set('company', e.target.value)} placeholder="Nome da empresa" />
            </div>
          </div>

          {/* Row: email + phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('E-mail')}
              <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="contato@empresa.com" />
            </div>
            <div>
              {label('Telefone')}
              <input style={inputStyle} value={form.phone ?? ''} onChange={e => set('phone', e.target.value)} placeholder="+55 11 9xxxx-xxxx" />
            </div>
          </div>

          {/* Row: funnel_stage + propensity */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('Etapa do Funil')}
              <AppSelect
                value={form.funnel_stage}
                onChange={v => set('funnel_stage', v as LeadFunnelStage)}
                options={STAGES.map(s => ({
                  value: s.id, label: s.label,
                  color: s.color, bg: s.bg,
                  border: s.color + '55',
                }))}
              />
            </div>
            <div>
              {label('Propensão')}
              <AppSelect
                value={form.propensity ?? ''}
                onChange={v => set('propensity', v || null)}
                options={[
                  { value: '', label: '— Sem propensão —' },
                  { value: 'frio',   label: 'Frio',      color: '#3B82F6', bg: 'rgba(59,130,246,0.10)'  },
                  { value: 'morno',  label: 'Morno',     color: '#EA580C', bg: 'rgba(234,88,12,0.10)'   },
                  { value: 'quente', label: 'Quente 🔥', color: '#DC2626', bg: 'rgba(220,38,38,0.10)'   },
                ]}
                placeholder="— Sem propensão —"
              />
            </div>
          </div>

          {/* Row: owner */}
          <div>
            {label('Responsável')}
            <MemberPicker
              value={form.owner_id ? [form.owner_id] : []}
              onChange={ids => set('owner_id', ids.length > 0 ? ids[ids.length - 1] : '')}
              placeholder="— Sem responsável —"
            />
          </div>

          {/* Row: segment + sub_segment */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('Segmento')}
              <AppSelect
                value={form.segment ?? ''}
                onChange={v => set('segment', v)}
                options={SEGMENT_OPTIONS}
                placeholder="— Sem segmento —"
              />
            </div>
            <div>
              {label('Sub-segmento')}
              <AppSelect
                value={form.sub_segment ?? ''}
                onChange={v => set('sub_segment', v)}
                options={SUB_SEGMENT_OPTIONS}
                placeholder="— Sem sub-segmento —"
              />
            </div>
          </div>

          {/* Row: commercial_origin + acquisition_channel */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('Origem Comercial')}
              <AppSelect
                value={form.commercial_origin ?? ''}
                onChange={v => set('commercial_origin', v)}
                options={COMMERCIAL_ORIGIN_OPTIONS}
                placeholder="— Sem origem —"
              />
            </div>
            <div>
              {label('Canal de Aquisição')}
              <AppSelect
                value={form.acquisition_channel ?? ''}
                onChange={v => set('acquisition_channel', v)}
                options={ACQUISITION_CHANNEL_OPTIONS}
                placeholder="— Sem canal —"
              />
            </div>
          </div>

          {/* Row: project_name + estimated_value */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('Nome do Projeto')}
              <input style={inputStyle} value={form.project_name ?? ''} onChange={e => set('project_name', e.target.value)} placeholder="Nome do projeto / solução" />
            </div>
            <div>
              {label('Valor Estimado (R$)')}
              <input
                style={inputStyle}
                type="text"
                inputMode="numeric"
                value={
                  form.estimated_value != null
                    ? 'R$ ' + form.estimated_value.toLocaleString('pt-BR')
                    : ''
                }
                onChange={e => {
                  const digits = e.target.value.replace(/\D/g, '')
                  set('estimated_value', digits ? Number(digits) : null)
                }}
                placeholder="R$ 0"
              />
            </div>
          </div>

          {/* Row: first_contact_date + referred_by */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {label('Data do Primeiro Contato')}
              <AppDatePicker
                value={form.first_contact_date ?? ''}
                onChange={v => set('first_contact_date', v)}
                placeholder="DD/MM/AAAA"
                clearable
              />
            </div>
            <div>
              {label('Indicado por')}
              <input style={inputStyle} value={form.referred_by ?? ''} onChange={e => set('referred_by', e.target.value)} placeholder="Nome de quem indicou" />
            </div>
          </div>

          {/* Tipos de Projeto */}
          <div>
            {label('Tipos de Projeto')}
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
                      padding: '4px 11px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                      border: `1px solid ${sel ? c.color + '88' : 'var(--gray3)'}`,
                      background: sel ? c.bg : 'transparent',
                      color: sel ? c.color : 'var(--gray2)',
                      cursor: 'pointer', transition: 'all 0.13s',
                      fontFamily: 'inherit',
                    }}
                  >{t}</button>
                )
              })}
            </div>
          </div>

          {/* Contexto */}
          <div>
            {label('Contexto')}
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={form.context ?? ''}
              onChange={e => set('context', e.target.value)}
              placeholder="Breve contexto do lead…"
            />
          </div>

          {/* Observações */}
          <div>
            {label('Observações')}
            <textarea
              style={{ ...inputStyle, minHeight: 64, resize: 'vertical' }}
              value={form.notes ?? ''}
              onChange={e => set('notes', e.target.value)}
              placeholder="Notas internas…"
            />
          </div>

          {/* Attachments */}
          <div>
            <label style={{
              fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
              textTransform: 'uppercase', letterSpacing: '0.06em',
              display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8,
            }}>
              Anexos
              {attFetching
                ? <span style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid var(--gray3)', borderTopColor: 'var(--gray2)', display: 'inline-block', animation: 'spin-slow 0.7s linear infinite', flexShrink: 0 }} />
                : attachments.length > 0 && <span style={{ fontWeight: 600, textTransform: 'none', color: 'var(--gray2)' }}>({attachments.length})</span>
              }
            </label>

            {/* Drop zone */}
            <div
              onClick={() => leadId && !attUploading && fileRef.current?.click()}
              onMouseEnter={() => { if (leadId && !attUploading) setAttHover(true) }}
              onMouseLeave={() => setAttHover(false)}
              onDragOver={e => { e.preventDefault(); if (leadId) setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => {
                e.preventDefault(); setDragOver(false)
                if (!leadId || attUploading) return
                const synth = { target: { files: e.dataTransfer.files } } as unknown as React.ChangeEvent<HTMLInputElement>
                handleAttachFile(synth)
              }}
              style={{
                border: `1.5px dashed ${dragOver ? 'var(--primary)' : attHover ? 'var(--primary-mid)' : 'var(--gray3)'}`,
                borderRadius: 10,
                background: dragOver || attHover ? 'var(--primary-dim)' : 'var(--bg)',
                padding: '18px 16px',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                cursor: leadId && !attUploading ? 'pointer' : 'default',
                transition: 'border-color 0.15s, background 0.15s',
                opacity: !leadId ? 0.5 : 1,
                userSelect: 'none',
              }}
            >
              <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
                stroke={dragOver || attHover ? 'var(--primary)' : 'var(--gray2)'}
                strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
                style={{ transition: 'stroke 0.15s' }}
              >
                <path d="M12 3v13M7 8l5-5 5 5M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"/>
              </svg>
              {attUploading ? (
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray2)' }}>Enviando…</span>
              ) : !leadId ? (
                <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray2)' }}>
                  Salve o lead primeiro para adicionar anexos
                </span>
              ) : (
                <>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--gray)' }}>
                    Arraste arquivos ou{' '}
                    <span style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 3 }}>
                      clique para selecionar
                    </span>
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>
                    PDF · DOCX · XLSX · PNG · JPG — até 3 MB
                  </span>
                </>
              )}
            </div>
            <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleAttachFile} />

            {/* File list skeleton */}
            {attFetching && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {[0, 1].map(i => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'var(--white)', animation: `skeleton-pulse 1.5s ease-in-out ${i * 0.15}s infinite` }}>
                    <div style={{ width: 22, height: 22, borderRadius: 5, background: 'var(--gray3)', flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <div style={{ height: 10, borderRadius: 4, background: 'var(--gray3)', width: `${52 + i * 22}%` }} />
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--gray3)', width: '28%' }} />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* File list */}
            {!attFetching && attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 8 }}>
                {attachments.map(att => {
                  const isImg = att.mime_type.startsWith('image/')
                  const isPdf = att.mime_type === 'application/pdf'
                  const isDoc = att.mime_type.includes('word') || att.filename.endsWith('.docx') || att.filename.endsWith('.doc')
                  const isXls = att.mime_type.includes('spreadsheet') || att.filename.endsWith('.xlsx') || att.filename.endsWith('.xls')
                  const icon  = isImg ? '🖼' : isPdf ? '📄' : isDoc ? '📝' : isXls ? '📊' : '📎'
                  const kb    = att.size < 1024 * 1024
                    ? `${(att.size / 1024).toFixed(0)} KB`
                    : `${(att.size / 1024 / 1024).toFixed(1)} MB`
                  return (
                    <div
                      key={att.id}
                      onMouseEnter={() => setAttHoverId(att.id)}
                      onMouseLeave={() => setAttHoverId(null)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '7px 10px', borderRadius: 8,
                        border: `1px solid ${attHoverId === att.id ? 'var(--gray2)' : 'var(--gray3)'}`,
                        background: attHoverId === att.id ? 'var(--bg)' : 'var(--white)',
                        transition: 'background 0.15s, border-color 0.15s',
                      }}
                    >
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                      <div
                        onClick={e => { e.stopPropagation(); setPreviewLoading(true); setPreviewAtt(att) }}
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                        title="Pré-visualizar"
                      >
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: 2 }}>
                          {att.filename}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>{kb}</div>
                      </div>
                      {/* Download */}
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.filename}
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--gray2)', transition: 'color 0.12s', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray2)')}
                        title="Baixar arquivo"
                      >
                        <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                          <path d="M7 2v7m-3-2.5L7 9l3-2.5M2 11.5h10" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                      {/* Delete */}
                      <button
                        type="button"
                        disabled={attLoading}
                        onClick={e => { e.stopPropagation(); setAttToDelete(att) }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 22, height: 22, borderRadius: 6, border: 'none',
                          background: 'transparent', cursor: attLoading ? 'not-allowed' : 'pointer',
                          color: 'var(--gray2)', transition: 'all 0.12s', flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.10)'; e.currentTarget.style.color = '#D93025' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
                        title="Remover anexo"
                      >
                        <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Preview modal */}
          {previewAtt && createPortal(
            <div
              onClick={() => setPreviewAtt(null)}
              style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                padding: 24, animation: 'fadeIn 0.18s ease both',
              }}
            >
              <div onClick={e => e.stopPropagation()} style={{
                display: 'flex', flexDirection: 'column',
                width: '90vw', maxWidth: 900, maxHeight: '90vh',
                background: 'var(--white)', borderRadius: 16,
                boxShadow: '0 24px 80px rgba(0,0,0,0.45)', overflow: 'hidden',
              }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid var(--gray3)', flexShrink: 0 }}>
                  <span style={{ fontSize: 18 }}>
                    {previewAtt.mime_type.startsWith('image/') ? '🖼' : previewAtt.mime_type === 'application/pdf' ? '📄' : previewAtt.mime_type.includes('word') ? '📝' : previewAtt.mime_type.includes('spreadsheet') ? '📊' : '📎'}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{previewAtt.filename}</div>
                    <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>
                      {previewAtt.size < 1024 * 1024 ? `${(previewAtt.size / 1024).toFixed(0)} KB` : `${(previewAtt.size / 1024 / 1024).toFixed(1)} MB`}
                    </div>
                  </div>
                  <a
                    href={previewAtt.url}
                    download={previewAtt.filename}
                    onClick={e => e.stopPropagation()}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'var(--bg)', fontSize: 11, fontWeight: 700, color: 'var(--black)', textDecoration: 'none', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--black)' }}
                  >
                    <svg width={12} height={12} viewBox="0 0 14 14" fill="none"><path d="M7 2v7m-3-2.5L7 9l3-2.5M2 11.5h10" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Baixar
                  </a>
                  <button
                    onClick={() => setPreviewAtt(null)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0 }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--gray3)'; e.currentTarget.style.color = 'var(--black)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
                  >
                    <svg width={13} height={13} viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/></svg>
                  </button>
                </div>
                {/* Content */}
                <div style={{ flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', minHeight: 200, position: 'relative' }}>
                  {previewLoading && (
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, background: 'var(--bg)', zIndex: 2 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', border: '3px solid var(--gray3)', borderTopColor: 'var(--primary)', animation: 'spin-slow 0.7s linear infinite' }} />
                      <span style={{ fontSize: 12, color: 'var(--gray2)', fontWeight: 600 }}>Carregando…</span>
                    </div>
                  )}
                  {previewAtt.mime_type.startsWith('image/') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={`${previewAtt.url}?preview=1`} alt={previewAtt.filename}
                      onLoad={() => setPreviewLoading(false)}
                      style={{ maxWidth: '100%', maxHeight: '75vh', objectFit: 'contain', borderRadius: 4, display: 'block', opacity: previewLoading ? 0 : 1, transition: 'opacity 0.2s ease' }}
                    />
                  ) : previewAtt.mime_type === 'application/pdf' ? (
                    <iframe src={`${previewAtt.url}?preview=1`} onLoad={() => setPreviewLoading(false)}
                      style={{ width: '100%', height: '75vh', border: 'none', opacity: previewLoading ? 0 : 1, transition: 'opacity 0.2s ease' }}
                      title={previewAtt.filename}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                      <div style={{ fontSize: 48, marginBottom: 16 }}>{previewAtt.mime_type.includes('word') ? '📝' : previewAtt.mime_type.includes('spreadsheet') ? '📊' : '📎'}</div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--black)', marginBottom: 6 }}>Pré-visualização não disponível</div>
                      <div style={{ fontSize: 12, color: 'var(--gray2)', marginBottom: 20 }}>Este tipo de arquivo não pode ser visualizado no navegador.<br/>Faça o download para abrir.</div>
                      <a href={previewAtt.url} download={previewAtt.filename}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 18px', borderRadius: 10, background: 'var(--primary)', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}
                      >
                        <svg width={13} height={13} viewBox="0 0 14 14" fill="none"><path d="M7 2v7m-3-2.5L7 9l3-2.5M2 11.5h10" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Baixar {previewAtt.filename}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>,
            document.body
          )}

          {/* Confirm delete attachment */}
          {attToDelete && createPortal(
            <div
              onClick={() => setAttToDelete(null)}
              style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(18,19,22,0.45)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.15s ease both' }}
            >
              <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 14, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', padding: '24px 24px 20px', width: 340, maxWidth: 'calc(100vw - 32px)' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, marginBottom: 14, background: 'rgba(217,48,37,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width={18} height={18} viewBox="0 0 14 14" fill="none">
                    <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 8a.5.5 0 00.5.5h6.6a.5.5 0 00.5-.5l.7-8" stroke="#D93025" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', marginBottom: 6 }}>Remover anexo?</div>
                <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5, marginBottom: 20 }}>
                  O arquivo <span style={{ fontWeight: 700, color: 'var(--black)' }}>"{attToDelete.filename}"</span> será removido permanentemente.
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button onClick={() => setAttToDelete(null)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--gray3)', background: 'var(--white)', color: 'var(--gray)', cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gray2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--gray3)'}
                  >Cancelar</button>
                  <button onClick={() => { handleDeleteAttachment(attToDelete); setAttToDelete(null) }}
                    style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', background: '#D93025', color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#B91C1C'}
                    onMouseLeave={e => e.currentTarget.style.background = '#D93025'}
                  >Remover</button>
                </div>
              </div>
            </div>,
            document.body
          )}

        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 28px 22px', borderTop: '1px solid var(--gray3)',
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          position: 'sticky', bottom: 0, background: 'var(--white)',
          borderRadius: '0 0 16px 16px',
        }}>
          <button onClick={onClose} style={{
            padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
            background: 'transparent', fontSize: 12, fontWeight: 600,
            color: 'var(--gray2)', cursor: 'pointer', fontFamily: 'inherit',
          }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{
              padding: '8px 22px', borderRadius: 8, border: 'none',
              background: saving ? 'var(--gray3)' : 'var(--primary)',
              color: saving ? 'var(--gray2)' : '#fff',
              fontSize: 12, fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit', transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!saving) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
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

// ── Card owner picker ─────────────────────────────────────────────────────────

function CardOwnerPicker({ ownerId, onSelect }: {
  ownerId?: string | null
  onSelect: (id: string | null) => void
}) {
  const { members, fetchMembers } = useTeamStore()
  const [open,    setOpen]    = useState(false)
  const [pos,     setPos]     = useState<{ top?: number; bottom?: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { if (members.length === 0) fetchMembers() }, []) // eslint-disable-line

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const owner  = members.find(m => m.id === ownerId)
  const active = members.filter(m => m.status === 'active')

  function handleClick(e: React.MouseEvent) {
    e.stopPropagation()
    if (!open && ref.current) {
      const r      = ref.current.getBoundingClientRect()
      const dropH  = Math.min(active.length * 34 + (ownerId ? 34 : 0) + 12, 260)
      const below  = window.innerHeight - r.bottom - 8
      const above  = r.top - 8
      if (below >= dropH || below >= above) {
        setPos({ top: r.bottom + 4, left: r.left })
      } else {
        setPos({ bottom: window.innerHeight - r.top + 4, left: r.left })
      }
    }
    setOpen(o => !o)
  }

  const dropdown = mounted && open && pos ? createPortal(
    <div
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'fixed', top: pos.top, bottom: pos.bottom, left: pos.left,
        zIndex: 10000, background: 'var(--white)', border: '1px solid var(--gray3)',
        borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
        minWidth: 190, overflow: 'hidden', animation: 'panelUp 0.15s ease both',
      }}
    >
      {ownerId && (
        <div
          onClick={() => { onSelect(null); setOpen(false) }}
          style={{ padding: '7px 10px', fontSize: 11, color: 'var(--gray2)', cursor: 'pointer', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}
        >
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M2 2l6 6M8 2l-6 6"/></svg>
          Remover responsável
        </div>
      )}
      {active.map(m => (
        <div
          key={m.id}
          onClick={() => { onSelect(m.id); setOpen(false) }}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', cursor: 'pointer', background: m.id === ownerId ? 'var(--primary-dim)' : 'transparent' }}
          onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'var(--primary-dim)'}
          onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = m.id === ownerId ? 'var(--primary-dim)' : 'transparent'}
        >
          <MemberAvatar member={m} size={20} />
          <span style={{ fontSize: 12, fontWeight: m.id === ownerId ? 700 : 500, color: 'var(--black)', flex: 1 }}>{m.name}</span>
          {m.id === ownerId && (
            <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="var(--primary)" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M2 5l2.5 2.5 4-4"/></svg>
          )}
        </div>
      ))}
    </div>,
    document.body
  ) : null

  return (
    <div ref={ref} style={{ display: 'inline-flex', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
      {owner
        ? <div onClick={handleClick} style={{ cursor: 'pointer' }}><MemberAvatarTip member={owner} size={20} /></div>
        : (
          <div
            onClick={handleClick}
            title="Atribuir responsável"
            style={{
              width: 20, height: 20, borderRadius: '50%',
              border: '1.5px dashed var(--gray3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--gray3)', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { const el = e.currentTarget; el.style.borderColor = 'var(--gray)'; el.style.color = 'var(--gray)' }}
            onMouseLeave={e => { const el = e.currentTarget; el.style.borderColor = 'var(--gray3)'; el.style.color = 'var(--gray3)' }}
          >
            <svg width={8} height={8} viewBox="0 0 8 8" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"><path d="M4 1v6M1 4h6"/></svg>
          </div>
        )
      }
      {dropdown}
    </div>
  )
}

// ── Add-to-stage buttons ──────────────────────────────────────────────────────

function HeaderAddButton({ color, onClick }: { color: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title="Adicionar lead nesta etapa"
      style={{
        width: 18, height: 18, borderRadius: 5, border: 'none',
        background: hov ? color + '28' : 'transparent',
        color: hov ? color : 'var(--gray2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: 'pointer', flexShrink: 0, transition: 'all 0.15s',
        fontFamily: 'inherit', padding: 0,
      }}
    >
      <svg width={10} height={10} viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M5 1.5v7M1.5 5h7"/>
      </svg>
    </button>
  )
}

function AddToStageButton({ color, onClick }: { color: string; onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        padding: '6px 0', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit',
        border: `1.5px dashed ${hov ? color : 'var(--gray3)'}`,
        background: hov ? color + '0f' : 'transparent',
        color: hov ? color : 'var(--gray3)',
        fontSize: 11, fontWeight: 700,
        transition: 'all 0.15s',
      }}
    >
      <svg width={11} height={11} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M5.5 1.5v8M1.5 5.5h8"/>
      </svg>
      Adicionar Lead
    </button>
  )
}

// ── Kanban card ───────────────────────────────────────────────────────────────

function KanbanCard({
  lead, color, isDragging, onDragStart, onDragEnd, onEdit, onDelete, onOwnerChange,
}: {
  lead: Lead; color: string; isDragging: boolean
  onDragStart: () => void; onDragEnd: () => void
  onEdit: () => void; onDelete: () => void
  onOwnerChange: (id: string | null) => void
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
        background: isDragging ? color + '12' : 'var(--white)',
        borderRadius: 10,
        border: `1px solid ${isDragging ? color + '55' : 'var(--gray3)'}`,
        borderLeft: `3px solid ${isDragging ? color : hov ? color : 'var(--gray3)'}`,
        boxShadow: isDragging
          ? `0 8px 24px ${color}44`
          : hov
          ? `0 10px 28px rgba(0,0,0,0.10), inset 0 0 0 1px ${color}30`
          : 'var(--shadow)',
        cursor: isDragging ? 'grabbing' : 'pointer',
        transition: 'transform 0.22s ease, box-shadow 0.22s ease, border-left-color 0.22s ease',
        transform: isDragging
          ? 'rotate(2deg) scale(1.04) translateZ(0)'
          : hov ? 'translateY(-4px) scale(1.01) translateZ(0)' : 'translateZ(0)',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {lead.first_contact_date && (
            <span style={{ fontSize: 10, color: 'var(--gray2)' }}>
              {new Date(lead.first_contact_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
            </span>
          )}
          <CardOwnerPicker ownerId={lead.owner_id} onSelect={onOwnerChange} />
        </div>
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
  leads, onEdit, onDelete, onStageChange, onOwnerChange, onAdd,
}: {
  leads: Lead[]
  onEdit: (l: Lead) => void
  onDelete: (l: Lead) => void
  onStageChange: (id: string, stage: LeadFunnelStage) => void
  onOwnerChange: (id: string, ownerId: string | null) => void
  onAdd: (stage: LeadFunnelStage) => void
}) {
  const [dragId,   setDragId]   = useState<string | null>(null)
  const [overZone, setOverZone] = useState<LeadFunnelStage | null>(null)
  const { isMobile } = useBreakpoint()

  const COL_W = 188   // fixed column width on mobile

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
            {!dimmed && (
              <HeaderAddButton color={stage.color} onClick={() => onAdd(stage.id)} />
            )}
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
              onOwnerChange={id => onOwnerChange(lead.id, id)}
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

        {/* Add lead to this stage */}
        {!dimmed && (
          <AddToStageButton color={stage.color} onClick={() => onAdd(stage.id)} />
        )}
      </div>
    )
  }

  const gridStyle = (cols: number): React.CSSProperties => isMobile ? {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, ${COL_W}px)`,
    gap: 8, alignItems: 'start',
  } : {
    display: 'grid',
    gridTemplateColumns: `repeat(${cols}, 1fr)`,
    gap: 8, alignItems: 'start',
  }

  return (
    <div style={{ overflowX: isMobile ? 'auto' : 'visible', margin: isMobile ? '0 -2px' : 0, paddingBottom: isMobile ? 8 : 0 }}>
      <div style={{ minWidth: isMobile ? `${STAGES.length * (COL_W + 8)}px` : undefined }}>
        <div style={gridStyle(STAGES.length)}>
          {STAGES.map(s => renderCol(s, leads.filter(l => l.funnel_stage === s.id)))}
        </div>
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
  { key: 'owner_id',           label: 'Responsável',      width: 130 },
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

    if (col.key === 'owner_id') {
      return (
        <CardOwnerPicker
          ownerId={lead.owner_id}
          onSelect={id => onFieldChange(lead.id, 'owner_id', id)}
        />
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

// ── FilterPill ────────────────────────────────────────────────────────────────

function FilterPill({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const active   = value !== ''
  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: 8,
          border: `1px solid ${active ? 'var(--primary)' : 'var(--gray3)'}`,
          background: active ? 'var(--primary-dim)' : 'var(--white)',
          color: active ? 'var(--primary)' : 'var(--gray)',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {active ? selected?.label ?? label : label}
        {active && (
          <span
            onClick={e => { e.stopPropagation(); onChange('') }}
            style={{ marginLeft: 2, opacity: 0.6, fontWeight: 400, fontSize: 13, lineHeight: 1 }}
          >×</span>
        )}
        {!active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4l3 3 3-3"/>
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          minWidth: 160, overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                padding: '8px 12px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', color: opt.value === value ? 'var(--primary)' : 'var(--black)',
                background: opt.value === value ? 'var(--primary-dim)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
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
  const [filterStage,      setFilterStage]      = useState('')
  const [filterPropensity, setFilterPropensity] = useState('')
  const [filterOwner,      setFilterOwner]      = useState('')
  const [newLeadStage,     setNewLeadStage]     = useState<LeadFunnelStage | undefined>(undefined)
  const { isMobile } = useBreakpoint()
  const { members, fetchMembers } = useTeamStore()
  useEffect(() => { if (members.length === 0) fetchMembers() }, []) // eslint-disable-line

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
  const negotiating     = leads.filter(l => l.funnel_stage === 'negociacao')
  const totalPipeline   = activeLeads.reduce((s, l) => s + (l.estimated_value ?? 0), 0)
  const wonValue        = leads.filter(l => l.funnel_stage === 'venda_realizada').reduce((s, l) => s + (l.estimated_value ?? 0), 0)

  const KPIS = [
    { label: 'Leads ativos',   value: activeLeads.length,    color: '#6366F1' },
    { label: 'Em negociação',  value: negotiating.length,    color: '#EA580C' },
    { label: 'Pipeline total', value: fmtValue(totalPipeline), color: '#0891B2' },
    { label: 'Vendas',         value: fmtValue(wonValue),      color: '#1E8A3E' },
  ]

  // ── Filtered leads ──
  const filteredLeads = leads.filter(l => {
    if (filterStage      && l.funnel_stage !== filterStage)      return false
    if (filterPropensity && l.propensity   !== filterPropensity) return false
    if (filterOwner      && l.owner_id     !== filterOwner)      return false
    return true
  })

  const stageFilterOptions = [
    { value: '', label: 'Todas as etapas' },
    ...STAGES.map(s => ({ value: s.id, label: s.label })),
  ]

  const propensityFilterOptions = [
    { value: '',       label: 'Todas' },
    { value: 'frio',   label: 'Frio'   },
    { value: 'morno',  label: 'Morno'  },
    { value: 'quente', label: 'Quente 🔥' },
  ]

  const ownerFilterOptions = [
    { value: '', label: 'Todos' },
    ...members
      .filter(m => m.status === 'active')
      .map(m => ({ value: m.id, label: m.name })),
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
    setNewLeadStage(undefined)
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

      {/* LinkedIn banner — always visible (null = not yet checked, false = not connected) */}
      {linkedInConn === false && !isMobile && (
        <LinkedInBanner onConnect={() => { window.location.href = '/api/integrations/linkedin/auth' }} />
      )}

      {loading ? <Skeleton /> : (
        <>
          {/* Header */}
          <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'flex-start', justifyContent: 'space-between', gap: isMobile ? 10 : 16 }}>
            <div>
              <h1 style={{ fontSize: isMobile ? 18 : 20, fontWeight: 900, color: 'var(--black)', margin: 0, letterSpacing: '-0.3px' }}>
                Pipeline de Leads
              </h1>
              {!isMobile && (
                <p style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 3, lineHeight: 1.5 }}>
                  Funil comercial — do primeiro contato até a conversão em cliente
                </p>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: isMobile ? 'flex-end' : 'flex-end' }}>
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

          {/* Filter bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
              Filtrar
            </span>
            <FilterPill
              label="Etapa"
              value={filterStage}
              options={stageFilterOptions}
              onChange={setFilterStage}
            />
            <FilterPill
              label="Propensão"
              value={filterPropensity}
              options={propensityFilterOptions}
              onChange={setFilterPropensity}
            />
            <FilterPill
              label="Responsável"
              value={filterOwner}
              options={ownerFilterOptions}
              onChange={setFilterOwner}
            />
            {(filterStage || filterPropensity || filterOwner) && (
              <button
                onClick={() => { setFilterStage(''); setFilterPropensity(''); setFilterOwner('') }}
                style={{
                  fontSize: 11, fontWeight: 600, color: 'var(--gray2)',
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '4px 6px', borderRadius: 6,
                }}
              >
                Limpar filtros
              </button>
            )}
            {/* View toggle — sliding pill — pushed to the right */}
            <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 8, padding: 2 }}>
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
          </div>

          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 8 : 10 }}>
            {KPIS.map(kpi => (
              <div
                key={kpi.label}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
                  e.currentTarget.style.boxShadow = `0 10px 28px rgba(0,0,0,0.10), inset 0 0 0 1px ${kpi.color}30`
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)'
                  e.currentTarget.style.boxShadow = 'var(--shadow)'
                }}
                style={{
                  background: 'var(--white)', border: '1px solid var(--gray3)',
                  borderLeft: `4px solid ${kpi.color}`, borderRadius: 12,
                  padding: isMobile ? '12px 14px' : '16px 18px', boxShadow: 'var(--shadow)',
                  transition: 'transform 0.22s ease, box-shadow 0.22s ease',
                  cursor: 'default',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{kpi.label}</div>
                <div style={{ fontSize: isMobile ? 20 : 24, fontWeight: 800, color: kpi.color, marginTop: 5, lineHeight: 1.1 }}>{kpi.value}</div>
              </div>
            ))}
          </div>

          {/* Board / Table */}
          {view === 'kanban' ? (
            <KanbanView
              leads={filteredLeads}
              onEdit={l => { setEditingLead(l); setShowForm(true) }}
              onDelete={l => setDeletingLead(l)}
              onStageChange={handleStageChange}
              onOwnerChange={(id, ownerId) => handleFieldChange(id, 'owner_id', ownerId)}
              onAdd={stage => { setNewLeadStage(stage); setEditingLead(null); setShowForm(true) }}
            />
          ) : (
            <TableView
              leads={filteredLeads}
              onEdit={l => { setEditingLead(l); setShowForm(true) }}
              onDelete={l => setDeletingLead(l)}
              onFieldChange={handleFieldChange}
            />
          )}
        </>
      )}

      {/* Modals */}
      {showForm && (
        <LeadFormModal
          initial={editingLead}
          defaultStage={newLeadStage}
          onClose={() => { setShowForm(false); setEditingLead(null); setNewLeadStage(undefined) }}
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
