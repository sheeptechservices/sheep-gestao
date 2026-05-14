'use client'
import { useState, useEffect } from 'react'
import type { Project, ProjectStatus, ProjectType, Client } from '@/lib/types'
import { calcProgress } from '@/lib/utils'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useBreakpoint } from '@/hooks/useBreakpoint'

// ── Config ────────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:      { label: 'Em curso',        color: '#B45309', bg: 'rgba(251,191,36,0.13)' },
  negotiation: { label: 'Em negociação',   color: '#0284C7', bg: 'rgba(2,132,199,0.11)'  },
  completed:   { label: 'Finalizado',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.11)'  },
  paused:      { label: 'Pausado',         color: '#7C3AED', bg: 'rgba(124,58,237,0.11)' },
  cancelled:   { label: 'Cancelado',       color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
}

export const TYPE_LABEL: Record<ProjectType, string> = {
  AI: 'IA', SaaS: 'SaaS', TaaS: 'TaaS',
  BI: 'BI', PowerPlatform: 'Power Platform', Other: 'Outro',
}

export const ALL_STATUSES: ProjectStatus[] = ['active', 'negotiation', 'paused', 'completed', 'cancelled']

// ── Shared helpers ────────────────────────────────────────────────────────────

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--gray3)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--black)', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditProjectDrawer({ project, onSave, onClose, onDelete, isNew, clients }: {
  project: Project
  onSave: (p: Project) => void
  onClose: () => void
  onDelete?: () => void
  isNew: boolean
  clients: Client[]
}) {
  const [form, setForm] = useState<Project>({ ...project })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [teamInput, setTeamInput] = useState('')
  const { isMobile } = useBreakpoint()

  function addMember() {
    const name = teamInput.trim()
    if (!name) return
    if (form.team_members?.includes(name)) { setTeamInput(''); return }
    setForm(f => ({ ...f, team_members: [...(f.team_members ?? []), name] }))
    setTeamInput('')
  }

  function removeMember(name: string) {
    setForm(f => ({ ...f, team_members: (f.team_members ?? []).filter(m => m !== name) }))
  }

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const set = (key: keyof Project, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setForm(f => ({ ...f, client_id: clientId, client, color_hex: client?.color_hex ?? '#84CC16' }))
  }

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === field ? 'var(--primary)' : 'var(--gray3)',
    boxShadow: focusedField === field ? '0 0 0 3px var(--primary-dim)' : 'none',
  })

  const canSave = form.name.trim().length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(18,19,22,0.22)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.18s ease both',
        }}
      />

      {/* Drawer — slides from right on desktop, from bottom on mobile */}
      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, top: 'auto',
        height: '92vh', width: '100%',
        zIndex: 9001, background: 'var(--white)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        animation: 'panelUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both',
      } : {
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        zIndex: 9001, background: 'var(--white)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        animation: 'panelSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 10, height: 36, borderRadius: 4,
            background: form.color_hex, flexShrink: 0,
            transition: 'background 0.2s',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', marginBottom: 2 }}>
              {isNew ? 'Novo projeto' : 'Editar projeto'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.name || 'Sem nome'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid var(--gray3)',
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
            flexShrink: 0, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Nome */}
          <Field label="Nome do projeto *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: Portal SaaS de Gestão"
              style={focusStyle('name')}
            />
          </Field>

          {/* Cliente + Gestor */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Cliente">
              <AppSelect
                value={form.client_id}
                onChange={handleClientChange}
                options={clients.map(c => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <Field label="Gestor">
              <input
                value={form.gestor ?? ''}
                onChange={e => set('gestor', e.target.value)}
                onFocus={() => setFocusedField('gestor')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nome do gestor"
                style={focusStyle('gestor')}
              />
            </Field>
          </div>

          {/* Equipe técnica */}
          <Field label="Equipe técnica">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: (form.team_members?.length ?? 0) > 0 ? 8 : 0 }}>
              {form.team_members?.map(name => (
                <span key={name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 700, padding: '3px 8px 3px 10px', borderRadius: 20,
                  background: form.color_hex + '18', color: form.color_hex,
                  border: `1px solid ${form.color_hex}40`,
                }}>
                  {name}
                  <button
                    type="button"
                    onClick={() => removeMember(name)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 14, height: 14, borderRadius: '50%', border: 'none',
                      background: form.color_hex + '30', color: form.color_hex,
                      cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 11, fontWeight: 800,
                    }}
                  >×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={teamInput}
                onChange={e => setTeamInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
                onFocus={() => setFocusedField('team')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nome do dev / membro técnico..."
                style={{ ...focusStyle('team'), flex: 1 }}
              />
              <button
                type="button"
                onClick={addMember}
                disabled={!teamInput.trim()}
                style={{
                  padding: '0 14px', borderRadius: 8, border: 'none', fontSize: 18, fontWeight: 400,
                  background: teamInput.trim() ? form.color_hex : 'var(--gray3)',
                  color: teamInput.trim() ? '#fff' : 'var(--gray2)',
                  cursor: teamInput.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >+</button>
            </div>
          </Field>

          {/* Tipo + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Tipo">
              <AppSelect
                value={form.type}
                onChange={v => set('type', v as ProjectType)}
                options={(Object.keys(TYPE_LABEL) as ProjectType[]).map(t => ({
                  value: t, label: TYPE_LABEL[t],
                }))}
              />
            </Field>
            <Field label="Status">
              <AppSelect
                value={form.status}
                onChange={v => set('status', v as ProjectStatus)}
                options={ALL_STATUSES.map(s => ({
                  value: s, label: STATUS_CONFIG[s].label,
                  color: STATUS_CONFIG[s].color, bg: STATUS_CONFIG[s].bg,
                }))}
              />
            </Field>
          </div>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Descreva o escopo e objetivo do projeto…"
              rows={3}
              style={{ ...focusStyle('desc'), resize: 'vertical', minHeight: 72, lineHeight: 1.55 }}
            />
          </Field>

          {/* Início + Fim */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Data de início">
              <AppDatePicker
                value={form.start_date}
                onChange={v => set('start_date', v)}
                clearable={false}
              />
            </Field>
            <Field label="Fim previsto">
              <AppDatePicker
                value={form.end_date ?? ''}
                onChange={v => set('end_date', v)}
              />
            </Field>
          </div>

          {/* Observações */}
          <Field label="Observações do projeto">
            <textarea
              value={form.observacoes ?? ''}
              onChange={e => set('observacoes', e.target.value || undefined)}
              onFocus={() => setFocusedField('obs')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: cliente prefere reuniões quinzenais, exige aprovação prévia de layouts..."
              rows={4}
              style={{
                ...focusStyle('obs'),
                resize: 'vertical', minHeight: 90, lineHeight: 1.6, fontSize: 12,
              }}
            />
          </Field>

          {/* Pasta no Drive */}
          <Field label="Pasta no Drive">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                value={form.links ?? ''}
                onChange={e => set('links', e.target.value || undefined)}
                onFocus={() => setFocusedField('links')}
                onBlur={() => setFocusedField(null)}
                placeholder="https://drive.google.com/drive/folders/..."
                style={{ ...focusStyle('links'), paddingRight: form.links ? 32 : 11 }}
              />
              {form.links && (
                <a
                  href={form.links}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', right: 10,
                    color: 'var(--gray2)', display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray2)')}
                  title="Abrir pasta"
                >
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8.5M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
          </Field>

          {/* Progress preview */}
          {(() => {
            const prog = calcProgress(form.start_date, form.end_date)
            return (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--gray3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso calculado</span>
                    <span style={{ fontSize: 9, color: 'var(--gray2)', marginLeft: 6 }}>(automático por prazo)</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: form.color_hex }}>{prog}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog}%`, background: form.color_hex, borderRadius: 100, transition: 'width 0.3s ease' }} />
                </div>
                {!form.end_date && (
                  <p style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 6, fontStyle: 'italic' }}>
                    Defina o fim previsto para calcular o progresso automaticamente.
                  </p>
                )}
              </div>
            )
          })()}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--gray3)',
          display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          background: 'var(--white)',
        }}>
          <div>
            {!isNew && onDelete && (
              <button
                onClick={onDelete}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  border: '1px solid var(--gray3)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gray2)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
                title="Excluir projeto"
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 8a.5.5 0 00.5.5h6.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
              background: 'transparent', fontSize: 13, fontWeight: 600,
              color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' }}
            >
              Cancelar
            </button>
            <button onClick={() => canSave && onSave(form)} disabled={!canSave} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: canSave ? 'var(--primary)' : 'var(--gray3)',
              fontSize: 13, fontWeight: 700,
              color: canSave ? 'var(--primary-text)' : 'var(--gray2)',
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              boxShadow: canSave ? '0 2px 8px var(--primary-mid)' : 'none',
            }}
              onMouseEnter={e => { if (canSave) e.currentTarget.style.boxShadow = '0 4px 14px var(--primary-mid)' }}
              onMouseLeave={e => { if (canSave) e.currentTarget.style.boxShadow = '0 2px 8px var(--primary-mid)' }}
            >
              {isNew ? 'Criar projeto' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
