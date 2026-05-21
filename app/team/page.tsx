'use client'
import { useState, useEffect, useRef } from 'react'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatar } from '@/components/ui/MemberAvatar'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import type { TeamMember, MemberStatus } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#84CC16','#6366F1','#F59E0B','#EC4899','#14B8A6',
  '#8B5CF6','#3B82F6','#D93025','#1E8A3E','#F97316',
]

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: 'Ativo',   color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)',   border: 'rgba(30,138,62,0.25)'  },
  inactive: { label: 'Inativo', color: '#666666', bg: 'rgba(100,100,100,0.08)', border: 'var(--gray3)'          },
}

const CARGOS = [
  'Dev', 'Designer', 'PO / PM', 'QA', 'DevOps',
  'Comercial', 'Marketing', 'Jurídico', 'Secretaria', 'Outro',
]

const PAPEIS = [
  'Dev Full Stack', 'Dev Front-end', 'Dev Back-end', 'Dev Mobile',
  'Designer UI/UX', 'Designer Gráfico', 'PO / PM', 'QA / Tester',
  'DevOps / Cloud', 'Data Analyst', 'Data Scientist', 'AI Engineer',
  'Comercial', 'Marketing', 'Jurídico', 'Secretaria', 'Outro',
]

const SENIORIDADE_OPTS = [
  { value: 'junior',      label: 'Júnior'      },
  { value: 'pleno',       label: 'Pleno'        },
  { value: 'senior',      label: 'Sênior'       },
  { value: 'especialista',label: 'Especialista' },
  { value: 'lideranca',   label: 'Liderança'    },
]

const EXP_OPTS = [
  { value: 'menos1', label: '< 1 ano'    },
  { value: '1a2',    label: '1 – 2 anos' },
  { value: '3a5',    label: '3 – 5 anos' },
  { value: '5a10',   label: '5 – 10 anos'},
  { value: 'mais10', label: '10+ anos'   },
]

const INGLES_OPTS = [
  { value: 'nenhum',        label: 'Nenhum'       },
  { value: 'basico',        label: 'Básico'        },
  { value: 'intermediario', label: 'Intermediário' },
  { value: 'avancado',      label: 'Avançado'      },
  { value: 'fluente',       label: 'Fluente'       },
]

const REGIME_OPTS = [
  { value: 'mei',            label: 'MEI'               },
  { value: 'me',             label: 'ME'                },
  { value: 'simples',        label: 'Simples Nacional'  },
  { value: 'lucro_presumido',label: 'Lucro Presumido'   },
  { value: 'outro',          label: 'Outro'             },
]

const SEXO_OPTS = [
  { value: 'masculino',    label: 'Masculino'            },
  { value: 'feminino',     label: 'Feminino'             },
  { value: 'outro',        label: 'Outro'                },
  { value: 'nao_informado',label: 'Prefiro não informar' },
]

const ESTADOS_BR = [
  'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
  'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--gray3)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--black)', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s, box-shadow 0.15s',
}

function focusStyle(focused: string | null, field: string): React.CSSProperties {
  return {
    ...inputStyle,
    borderColor: focused === field ? 'var(--primary)' : 'var(--gray3)',
    boxShadow:   focused === field ? '0 0 0 3px var(--primary-dim)' : 'none',
  }
}

const COL: React.CSSProperties = {
  flexShrink: 0, padding: '11px 10px 11px 0',
  fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
  textTransform: 'uppercase', letterSpacing: '0.07em',
}

const CELL: React.CSSProperties = {
  flexShrink: 0, padding: '0 10px 0 0',
  fontSize: 12, color: 'var(--gray)', fontWeight: 500,
  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
}

function Field({ label, children, span }: { label: string; children: React.ReactNode; span?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, gridColumn: span ? '1 / -1' : undefined }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{
      fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase',
      letterSpacing: '0.09em', paddingBottom: 8, marginTop: 4,
      borderBottom: '1px solid var(--gray3)', gridColumn: '1 / -1',
    }}>
      {title}
    </div>
  )
}

// ── Photo Upload ──────────────────────────────────────────────────────────────

function PhotoUpload({ member, onUpload }: { member: TeamMember; onUpload: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { deletePhoto } = useTeamStore()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <MemberAvatar member={member} size={52} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button type="button" onClick={() => inputRef.current?.click()}
          style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: '1px solid var(--gray3)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--black)' }}>
          {member.photo_url ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {member.photo_url && (
          <button type="button" onClick={() => deletePhoto(member.id)}
            style={{ padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', color: '#D93025' }}>
            Remover foto
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }} />
    </div>
  )
}

// ── CV Upload ─────────────────────────────────────────────────────────────────

function CvUpload({ memberId, curriculo_url }: { memberId: string; curriculo_url?: string }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadCv, deleteCv } = useTeamStore()
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button type="button" onClick={() => inputRef.current?.click()}
        style={{ padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 600, border: '1px solid var(--gray3)', background: 'var(--bg)', cursor: 'pointer', color: 'var(--black)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={12} height={12} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M6 8V2M3 5l3-3 3 3" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M1 9v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V9" strokeLinecap="round"/>
        </svg>
        {curriculo_url ? 'Substituir currículo' : 'Enviar currículo'}
      </button>
      {curriculo_url && (
        <>
          <a href={curriculo_url} target="_blank" rel="noopener noreferrer"
            style={{ fontSize: 12, color: 'var(--primary-text)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
            <svg width={11} height={11} viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4">
              <path d="M2 9l7-7M4 2h5v5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Ver arquivo
          </a>
          <button type="button" onClick={() => deleteCv(memberId)}
            style={{ fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', cursor: 'pointer', color: '#D93025', padding: 0 }}>
            Remover
          </button>
        </>
      )}
      <input ref={inputRef} type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) uploadCv(memberId, f); e.target.value = '' }} />
    </div>
  )
}

// ── Toggle / Checkbox ─────────────────────────────────────────────────────────

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10, flexShrink: 0,
          background: checked ? 'var(--primary)' : 'var(--gray3)',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer',
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: '50%', background: 'var(--white)',
          boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontSize: 13, color: 'var(--black)', fontWeight: 500 }}>{label}</span>
    </label>
  )
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 17, height: 17, borderRadius: 4, flexShrink: 0, marginTop: 1,
          border: checked ? '2px solid var(--primary-text)' : '1.5px solid var(--gray2)',
          background: checked ? 'var(--primary-text)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.12s', cursor: 'pointer',
        }}
      >
        {checked && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <path d="M1.5 5l2.5 2.5L8.5 2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
      <span style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>{label}</span>
    </label>
  )
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────

function MemberDrawer({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  const { addMember, updateMember, uploadPhoto } = useTeamStore()
  const [form, setForm] = useState<Partial<TeamMember>>(member ?? {
    name: '', cargo: '', email: '', joined_at: new Date().toISOString().split('T')[0],
    status: 'active', color_hex: '#84CC16',
    lgpd_consent: false, newsletter_consent: false, possui_cnpj: false,
  })
  const [focused, setFocused] = useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)
  const isNew = !member

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  function set<K extends keyof TeamMember>(k: K, v: TeamMember[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.name?.trim()) return
    setSaving(true)
    if (isNew) {
      await addMember({
        name: form.name!, cargo: form.cargo ?? '', email: form.email,
        joined_at: form.joined_at, status: form.status ?? 'active',
        color_hex: form.color_hex ?? '#84CC16', photo_url: undefined,
        sexo: form.sexo, data_nascimento: form.data_nascimento,
        whatsapp: form.whatsapp, linkedin: form.linkedin, github: form.github,
        indicacao_nome: form.indicacao_nome, indicacao_email: form.indicacao_email,
        estado: form.estado, cidade: form.cidade,
        resumo_profissional: form.resumo_profissional, papel_principal: form.papel_principal,
        senioridade: form.senioridade, tempo_experiencia: form.tempo_experiencia,
        nivel_ingles: form.nivel_ingles, outro_idioma: form.outro_idioma,
        possui_cnpj: form.possui_cnpj, regime_fiscal: form.regime_fiscal,
        lgpd_consent: form.lgpd_consent, newsletter_consent: form.newsletter_consent,
      })
    } else {
      await updateMember(member.id, form)
    }
    setSaving(false)
    onClose()
  }

  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 3000, background: 'rgba(18,19,22,0.22)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.18s ease both' }} />
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 3001,
        width: 480, maxWidth: '100vw', background: 'var(--white)',
        borderLeft: '1px solid var(--gray3)', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', animation: 'panelSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <MemberAvatar member={{ name: form.name || '?', color_hex: form.color_hex ?? '#84CC16', photo_url: member?.photo_url } as TeamMember} size={36} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', marginBottom: 2 }}>
              {isNew ? 'Novo membro' : 'Editar membro'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.name || 'Sem nome'}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>

          {/* ── IDENTIFICAÇÃO & CONTATO ─────────────────────────────────────── */}
          <SectionHeader title="Identificação & Contato" />

          {/* Foto — só ao editar */}
          {!isNew && member && (
            <Field label="Foto" span>
              <PhotoUpload member={{ ...member, ...form } as TeamMember} onUpload={f => uploadPhoto(member.id, f)} />
            </Field>
          )}

          {/* Cor */}
          <Field label="Cor" span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} type="button" onClick={() => set('color_hex', c)} style={{
                  width: 26, height: 26, borderRadius: 8, border: 'none',
                  background: c, cursor: 'pointer', flexShrink: 0,
                  boxShadow: form.color_hex === c
                    ? `0 0 0 2px var(--white), 0 0 0 4px ${c}`
                    : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                  transition: 'box-shadow 0.15s',
                }} />
              ))}
              <input type="color" value={form.color_hex ?? '#84CC16'} onChange={e => set('color_hex', e.target.value)}
                style={{ width: 26, height: 26, borderRadius: 8, border: '1px solid var(--gray3)', background: 'var(--bg)', padding: 2, cursor: 'pointer', flexShrink: 0 }} />
            </div>
          </Field>

          {/* Nome */}
          <Field label="Nome *" span>
            <input
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder="Nome completo"
              style={focusStyle(focused, 'name')}
            />
          </Field>

          {/* Sexo */}
          <Field label="Gênero">
            <AppSelect
              value={form.sexo ?? ''}
              onChange={v => set('sexo', v as TeamMember['sexo'])}
              options={[{ value: '', label: '— Selecione —' }, ...SEXO_OPTS]}
            />
          </Field>

          {/* Data de nascimento */}
          <Field label="Data de nascimento">
            <AppDatePicker value={form.data_nascimento ?? ''} onChange={v => set('data_nascimento', v)} />
          </Field>

          {/* Cargo + Status */}
          <Field label="Cargo">
            <AppSelect
              value={form.cargo ?? ''}
              onChange={v => set('cargo', v)}
              options={[{ value: '', label: '— Selecione —' }, ...CARGOS.map(c => ({ value: c, label: c }))]}
            />
          </Field>
          <Field label="Status">
            <AppSelect
              value={form.status ?? 'active'}
              onChange={v => set('status', v as MemberStatus)}
              options={Object.entries(STATUS_CONFIG).map(([k, s]) => ({
                value: k, label: s.label, color: s.color, bg: s.bg, border: s.border,
              }))}
            />
          </Field>

          {/* E-mail */}
          <Field label="E-mail" span>
            <input
              type="email"
              value={form.email ?? ''}
              onChange={e => set('email', e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              placeholder="email@empresa.com"
              style={focusStyle(focused, 'email')}
            />
          </Field>

          {/* WhatsApp */}
          <Field label="WhatsApp" span>
            <input
              value={form.whatsapp ?? ''}
              onChange={e => set('whatsapp', e.target.value)}
              onFocus={() => setFocused('whatsapp')}
              onBlur={() => setFocused(null)}
              placeholder="+55 (11) 9 0000-0000"
              style={focusStyle(focused, 'whatsapp')}
            />
          </Field>

          {/* LinkedIn */}
          <Field label="LinkedIn">
            <input
              value={form.linkedin ?? ''}
              onChange={e => set('linkedin', e.target.value)}
              onFocus={() => setFocused('linkedin')}
              onBlur={() => setFocused(null)}
              placeholder="linkedin.com/in/..."
              style={focusStyle(focused, 'linkedin')}
            />
          </Field>

          {/* GitHub */}
          <Field label="GitHub">
            <input
              value={form.github ?? ''}
              onChange={e => set('github', e.target.value)}
              onFocus={() => setFocused('github')}
              onBlur={() => setFocused(null)}
              placeholder="github.com/..."
              style={focusStyle(focused, 'github')}
            />
          </Field>

          {/* Indicação */}
          <Field label="Indicado por (nome)">
            <input
              value={form.indicacao_nome ?? ''}
              onChange={e => set('indicacao_nome', e.target.value)}
              onFocus={() => setFocused('indicacao_nome')}
              onBlur={() => setFocused(null)}
              placeholder="Nome do indicador"
              style={focusStyle(focused, 'indicacao_nome')}
            />
          </Field>
          <Field label="Indicado por (e-mail)">
            <input
              value={form.indicacao_email ?? ''}
              onChange={e => set('indicacao_email', e.target.value)}
              onFocus={() => setFocused('indicacao_email')}
              onBlur={() => setFocused(null)}
              placeholder="email@indicador.com"
              style={focusStyle(focused, 'indicacao_email')}
            />
          </Field>

          {/* Entrada */}
          <Field label="Na equipe desde">
            <AppDatePicker value={form.joined_at ?? ''} onChange={v => set('joined_at', v)} />
          </Field>

          {/* ── LOCALIZAÇÃO ──────────────────────────────────────────────────── */}
          <SectionHeader title="Localização" />

          <Field label="Estado">
            <AppSelect
              value={form.estado ?? ''}
              onChange={v => set('estado', v)}
              options={[{ value: '', label: '— UF —' }, ...ESTADOS_BR.map(uf => ({ value: uf, label: uf }))]}
            />
          </Field>

          <Field label="Cidade">
            <input
              value={form.cidade ?? ''}
              onChange={e => set('cidade', e.target.value)}
              onFocus={() => setFocused('cidade')}
              onBlur={() => setFocused(null)}
              placeholder="Cidade"
              style={focusStyle(focused, 'cidade')}
            />
          </Field>

          {/* ── PERFIL PROFISSIONAL ───────────────────────────────────────────── */}
          <SectionHeader title="Perfil Profissional" />

          <Field label="Resumo profissional" span>
            <textarea
              value={form.resumo_profissional ?? ''}
              onChange={e => set('resumo_profissional', e.target.value)}
              onFocus={() => setFocused('resumo')}
              onBlur={() => setFocused(null)}
              placeholder="Descreva brevemente o perfil e as principais habilidades..."
              rows={3}
              style={{
                ...focusStyle(focused, 'resumo'),
                resize: 'vertical', minHeight: 72,
              }}
            />
          </Field>

          <Field label="Papel principal">
            <AppSelect
              value={form.papel_principal ?? ''}
              onChange={v => set('papel_principal', v)}
              options={[{ value: '', label: '— Selecione —' }, ...PAPEIS.map(p => ({ value: p, label: p }))]}
            />
          </Field>

          <Field label="Senioridade">
            <AppSelect
              value={form.senioridade ?? ''}
              onChange={v => set('senioridade', v as TeamMember['senioridade'])}
              options={[{ value: '', label: '— Selecione —' }, ...SENIORIDADE_OPTS]}
            />
          </Field>

          <Field label="Tempo de experiência">
            <AppSelect
              value={form.tempo_experiencia ?? ''}
              onChange={v => set('tempo_experiencia', v as TeamMember['tempo_experiencia'])}
              options={[{ value: '', label: '— Selecione —' }, ...EXP_OPTS]}
            />
          </Field>

          <Field label="Inglês">
            <AppSelect
              value={form.nivel_ingles ?? ''}
              onChange={v => set('nivel_ingles', v as TeamMember['nivel_ingles'])}
              options={[{ value: '', label: '— Selecione —' }, ...INGLES_OPTS]}
            />
          </Field>

          <Field label="Outros idiomas" span>
            <input
              value={form.outro_idioma ?? ''}
              onChange={e => set('outro_idioma', e.target.value)}
              onFocus={() => setFocused('outro_idioma')}
              onBlur={() => setFocused(null)}
              placeholder="Ex: Espanhol (intermediário), Francês (básico)"
              style={focusStyle(focused, 'outro_idioma')}
            />
          </Field>

          {/* ── SITUAÇÃO FISCAL ────────────────────────────────────────────────── */}
          <SectionHeader title="Situação Fiscal" />

          <Field label="Possui CNPJ?" span>
            <Toggle
              checked={!!form.possui_cnpj}
              onChange={v => set('possui_cnpj', v)}
              label={form.possui_cnpj ? 'Sim' : 'Não'}
            />
          </Field>

          {form.possui_cnpj && (
            <Field label="Regime fiscal" span>
              <AppSelect
                value={form.regime_fiscal ?? ''}
                onChange={v => set('regime_fiscal', v as TeamMember['regime_fiscal'])}
                options={[{ value: '', label: '— Selecione —' }, ...REGIME_OPTS]}
              />
            </Field>
          )}

          {/* ── DOCUMENTOS & LGPD ──────────────────────────────────────────────── */}
          <SectionHeader title="Documentos & LGPD" />

          {/* CV — só no modo edição (precisa de ID) */}
          {!isNew && member && (
            <Field label="Currículo (PDF / DOC / DOCX, máx. 5 MB)" span>
              <CvUpload memberId={member.id} curriculo_url={member.curriculo_url} />
            </Field>
          )}

          <Field label="Consentimentos" span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Checkbox
                checked={!!form.lgpd_consent}
                onChange={v => set('lgpd_consent', v)}
                label="Declaro que li e aceito a Política de Privacidade e autorizo o tratamento dos meus dados pessoais conforme a LGPD."
              />
              <Checkbox
                checked={!!form.newsletter_consent}
                onChange={v => set('newsletter_consent', v)}
                label="Aceito receber comunicações, novidades e atualizações da Sheep por e-mail."
              />
            </div>
          </Field>

        </div>

        {/* Footer */}
        <div style={{ padding: '14px 24px', borderTop: '1px solid var(--gray3)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--black)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !form.name?.trim()} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            border: 'none', background: 'var(--primary)', color: 'var(--primary-text)',
            cursor: saving ? 'not-allowed' : 'pointer', opacity: saving || !form.name?.trim() ? 0.6 : 1,
          }}>
            {saving ? 'Salvando…' : isNew ? 'Criar membro' : 'Salvar'}
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Delete Modal ──────────────────────────────────────────────────────────────

function DeleteModal({ member, onConfirm, onClose }: { member: TeamMember; onConfirm: () => void; onClose: () => void }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1101, background: 'var(--white)', border: '1px solid var(--gray3)',
        borderRadius: 14, padding: '24px 28px', width: 340, maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(217,48,37,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D93025' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 5.5h12M6 5.5V4h6v1.5M4 5.5l.8 9h8.4l.8-9" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, color: 'var(--black)' }}>Remover membro?</div>
            <div style={{ fontSize: 13, color: 'var(--gray)' }}>
              <strong>{member.name}</strong> será removido da equipe. Os entregáveis associados não serão excluídos, mas perderão o responsável.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--black)' }}>
              Cancelar
            </button>
            <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700, border: 'none', background: '#D93025', cursor: 'pointer', color: '#fff' }}>
              Remover
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────

const STATUS_OPTIONS = Object.entries(STATUS_CONFIG).map(([k, s]) => ({
  value: k, label: s.label, color: s.color, bg: s.bg, border: s.border,
}))

function TeamTable({ members, onEdit, onDelete, onStatusChange }: {
  members: TeamMember[]
  onEdit: (m: TeamMember) => void
  onDelete: (m: TeamMember) => void
  onStatusChange: (id: string, status: MemberStatus) => void
}) {
  const [hovRow, setHovRow] = useState<string | null>(null)

  if (members.length === 0) {
    return (
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '56px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>👥</div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--black)', marginBottom: 4 }}>Nenhum membro encontrado</div>
          <div style={{ fontSize: 13, color: 'var(--gray2)' }}>Clique em "Novo membro" para começar.</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      <div style={{ overflowX: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)', minWidth: 640 }}>
          <div style={{ width: 4, marginRight: 14, flexShrink: 0 }} />
          <div style={{ ...COL, width: 220 }}>Membro</div>
          <div style={{ ...COL, width: 110 }}>Status</div>
          <div style={{ ...COL, width: 130 }}>Cargo</div>
          <div style={{ ...COL, width: 200 }}>E-mail</div>
          <div style={{ ...COL, width: 110 }}>Na equipe desde</div>
          <div style={{ flex: 1 }} />
        </div>

        {/* Rows */}
        {members.map((m, i) => {
          const isHov = hovRow === m.id
          return (
            <div
              key={m.id}
              onClick={() => onEdit(m)}
              onMouseEnter={() => setHovRow(m.id)}
              onMouseLeave={() => setHovRow(null)}
              style={{
                display: 'flex', alignItems: 'center', padding: '0 20px',
                borderBottom: i < members.length - 1 ? '1px solid var(--gray3)' : 'none',
                background: isHov ? `${m.color_hex}08` : 'var(--white)',
                cursor: 'pointer', transition: 'background 0.15s', minWidth: 640,
              }}
            >
              {/* Accent bar */}
              <div style={{ width: 4, height: 40, borderRadius: 2, background: m.color_hex, marginRight: 14, flexShrink: 0, opacity: isHov ? 1 : 0.55, transition: 'opacity 0.15s' }} />

              {/* Avatar + nome */}
              <div style={{ width: 220, flexShrink: 0, padding: '10px 10px 10px 0', display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                <MemberAvatar member={m} size={30} />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </span>
              </div>

              {/* Status — inline picker */}
              <div style={{ width: 110, flexShrink: 0, padding: '0 10px 0 0' }}>
                <AppSelect
                  value={m.status}
                  onChange={v => onStatusChange(m.id, v as MemberStatus)}
                  options={STATUS_OPTIONS}
                  mode="badge"
                  onClick={e => e.stopPropagation()}
                />
              </div>

              {/* Cargo */}
              <div style={{ width: 130, ...CELL, color: m.cargo ? 'var(--black)' : 'var(--gray2)', fontWeight: m.cargo ? 600 : 400 }}>
                {m.cargo || '—'}
              </div>

              {/* E-mail */}
              <div style={{ width: 200, ...CELL }}>
                {m.email
                  ? <a href={`mailto:${m.email}`} onClick={e => e.stopPropagation()} style={{ color: 'var(--gray)', textDecoration: 'none' }}>{m.email}</a>
                  : '—'}
              </div>

              {/* Entrada */}
              <div style={{ width: 110, ...CELL }}>
                {m.joined_at ? m.joined_at.split('-').reverse().join('/') : '—'}
              </div>

              {/* Actions */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isHov ? m.color_hex + '18' : 'transparent',
                  border: isHov ? `1px solid ${m.color_hex}40` : '1px solid transparent',
                  color: isHov ? m.color_hex : 'transparent', transition: 'all 0.15s', flexShrink: 0,
                }}>
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12L4 10.25H1.75V8L8.5 1.5z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
                  </svg>
                </div>
                <div
                  onClick={e => { e.stopPropagation(); onDelete(m) }}
                  style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isHov ? 'rgba(217,48,37,0.08)' : 'transparent',
                    border: isHov ? '1px solid rgba(217,48,37,0.22)' : '1px solid transparent',
                    color: isHov ? '#D93025' : 'transparent', transition: 'all 0.15s', flexShrink: 0, cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.14)'; e.currentTarget.style.borderColor = 'rgba(217,48,37,0.4)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = isHov ? 'rgba(217,48,37,0.08)' : 'transparent'; e.currentTarget.style.borderColor = isHov ? 'rgba(217,48,37,0.22)' : 'transparent' }}
                >
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M1.5 3h9M4.5 3V2a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M2.5 3l.75 7a.5.5 0 00.5.45h4.5a.5.5 0 00.5-.45L9.5 3M5 5.5v3M7 5.5v3" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { members, loading, fetchMembers, deleteMember, updateMember } = useTeamStore()
  const [drawerMember, setDrawerMember] = useState<TeamMember | 'new' | null>(null)
  const [toDelete,     setToDelete]     = useState<TeamMember | null>(null)
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all')

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const filtered = members
    .filter(m => filterStatus === 'all' || m.status === filterStatus)

  const PILLS: { key: MemberStatus | 'all'; label: string }[] = [
    { key: 'all',      label: 'Todos'   },
    { key: 'active',   label: 'Ativos'  },
    { key: 'inactive', label: 'Inativos'},
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)', margin: 0 }}>Equipe</h1>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2, marginBottom: 0 }}>
            {members.filter(m => m.status === 'active').length} membros ativos
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {PILLS.map(({ key, label }) => (
            <button key={key} onClick={() => setFilterStatus(key)} style={{
              padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer',
              border: `1px solid ${filterStatus === key ? 'var(--primary)' : 'var(--gray3)'}`,
              background: filterStatus === key ? 'var(--primary-dim)' : 'transparent',
              color: filterStatus === key ? 'var(--primary-text)' : 'var(--gray2)',
              transition: 'all 0.15s',
            }}>{label}</button>
          ))}
          <button
            onClick={() => setDrawerMember('new')}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: 'var(--primary-text)', background: 'var(--primary-dim)', border: '1px solid var(--primary-mid)', padding: '6px 14px', borderRadius: 100, cursor: 'pointer', transition: 'opacity .15s' }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >
            + Novo membro
          </button>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="shimmer-bar" style={{
              display: 'flex', alignItems: 'center', gap: 16, padding: '14px 20px',
              borderBottom: i < 4 ? '1px solid var(--gray3)' : 'none', animationDelay: `${i * 0.06}s`,
            }}>
              <div style={{ width: 4, height: 36, borderRadius: 2, background: 'var(--gray3)' }} />
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--gray3)' }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ width: '30%', height: 12, borderRadius: 4, background: 'var(--gray3)' }} />
                <div style={{ width: '18%', height: 10, borderRadius: 4, background: 'var(--gray3)' }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <TeamTable
          members={filtered}
          onEdit={m => setDrawerMember(m)}
          onDelete={m => setToDelete(m)}
          onStatusChange={(id, status) => updateMember(id, { status })}
        />
      )}

      {/* Drawer */}
      {drawerMember !== null && (
        <MemberDrawer
          member={drawerMember === 'new' ? null : drawerMember}
          onClose={() => setDrawerMember(null)}
        />
      )}

      {/* Delete confirm */}
      {toDelete && (
        <DeleteModal
          member={toDelete}
          onClose={() => setToDelete(null)}
          onConfirm={async () => { await deleteMember(toDelete.id); setToDelete(null) }}
        />
      )}
    </div>
  )
}
