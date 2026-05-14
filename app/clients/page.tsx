'use client'
import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import type { Client, ClientStatus, Project } from '@/lib/types'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { AppCombobox } from '@/components/ui/AppCombobox'
import { toast } from '@/stores/toastStore'
import { useCreateStore } from '@/stores/createStore'

// ── Config ────────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#84CC16','#6366F1','#F59E0B','#EC4899','#14B8A6',
  '#8B5CF6','#3B82F6','#D93025','#1E8A3E','#F97316',
]

const CLIENT_STATUS: Record<ClientStatus, { label: string; color: string; bg: string; border: string }> = {
  active:    { label: 'Ativo',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)',  border: 'rgba(30,138,62,0.25)'  },
  inactive:  { label: 'Inativo',    color: '#666666', bg: 'rgba(18,19,22,0.06)',   border: 'var(--gray3)'          },
  paused:    { label: 'Pausado',    color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.25)' },
  cancelled: { label: 'Encerrado', color: '#D93025', bg: 'rgba(217,48,37,0.10)',  border: 'rgba(217,48,37,0.25)'  },
}

function fmt(date?: string | null) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function newEmptyClient(): Client {
  return {
    id: crypto.randomUUID(),
    name: '',
    contact_name: '',
    contact_email: '',
    created_at: new Date().toISOString().split('T')[0],
    data_entrada: new Date().toISOString().split('T')[0],
    color_hex: '#84CC16',
  }
}

// ── Edit Drawer ───────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--gray3)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--black)', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  boxSizing: 'border-box',
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.1em', borderBottom: '1px solid var(--gray3)', paddingBottom: 6, marginBottom: 2 }}>
      {children}
    </div>
  )
}

function EditDrawer({ client, onSave, onClose, onDelete, isNew }: {
  client: Client
  onSave: (c: Client) => void
  onClose: () => void
  onDelete?: () => void
  isNew: boolean
}) {
  const [form, setForm] = useState<Client>({ color_hex: '#84CC16', ...client })
  const [focused, setFocused] = useState<string | null>(null)

  // Opções dos comboboxes (persistem durante a sessão do drawer)
  const [segmentoOpts,    setSegmentoOpts]    = useState(['Financeiro','Marketing','Alimentação','Produtos','Saúde','Franquias','Advocacia','Mineradora','Diesel','Madeira','Contabilidade','Pet','TI','Educação','Varejo'])
  const [subSegmentoOpts, setSubSegmentoOpts] = useState(['Plano de benefícios','Crédito consignado','Gestão de frotas'])
  const [origemOpts,      setOrigemOpts]      = useState(['Indicação','Prospecção ativa','Inbound','Evento','Parceria','LinkedIn','Instagram','Google','Site'])
  const [canalOpts,       setCanalOpts]       = useState(['WhatsApp','E-mail','Telefone','Reunião presencial','LinkedIn','Instagram','Indicação direta'])

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focused === field ? 'var(--primary)' : 'var(--gray3)',
    boxShadow: focused === field ? '0 0 0 3px var(--primary-dim)' : 'none',
  })

  const set = (key: keyof Client, val: string | undefined) => setForm(f => ({ ...f, [key]: val || undefined }))
  const canSave = form.name.trim().length > 0

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 3000,
          background: 'rgba(18,19,22,0.22)', backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.18s ease both',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        zIndex: 3001, background: 'var(--white)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        animation: 'panelSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: (form.color_hex ?? '#84CC16') + '20', border: `1.5px solid ${form.color_hex ?? '#84CC16'}40`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 800, color: form.color_hex ?? '#84CC16',
            transition: 'background 0.2s, border-color 0.2s, color 0.2s',
          }}>
            {form.name.charAt(0).toUpperCase() || '?'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', marginBottom: 2 }}>
              {isNew ? 'Novo cliente' : 'Editar cliente'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.name || 'Sem nome'}
            </div>
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
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          <SectionTitle>Identificação</SectionTitle>
          <Field label="Nome do cliente *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onFocus={() => setFocused('name')}
              onBlur={() => setFocused(null)}
              placeholder="Ex: Nexum Digital"
              style={focusStyle('name')}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Status">
              <AppSelect
                value={form.status ?? ''}
                onChange={v => setForm(f => ({ ...f, status: (v as ClientStatus) || undefined }))}
                options={[
                  { value: '', label: '— Sem status —' },
                  ...Object.entries(CLIENT_STATUS).map(([k, v]) => ({
                    value: k, label: v.label, color: v.color, bg: v.bg, border: v.border,
                  })),
                ]}
              />
            </Field>
            <Field label="CNPJ / CPF">
              <input
                value={form.cnpj_cpf ?? ''}
                onChange={e => set('cnpj_cpf', e.target.value)}
                onFocus={() => setFocused('cnpj_cpf')}
                onBlur={() => setFocused(null)}
                placeholder="00.000.000/0001-00"
                style={focusStyle('cnpj_cpf')}
              />
            </Field>
          </div>

          <Field label="Cor do cliente">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map(color => (
                <button
                  key={color}
                  onClick={() => setForm(f => ({ ...f, color_hex: color }))}
                  title={color}
                  style={{
                    width: 26, height: 26, borderRadius: 8, border: 'none',
                    background: color, cursor: 'pointer', flexShrink: 0,
                    boxShadow: form.color_hex === color
                      ? `0 0 0 2px var(--white), 0 0 0 4px ${color}`
                      : 'inset 0 0 0 1px rgba(0,0,0,0.12)',
                    transition: 'box-shadow 0.15s',
                  }}
                />
              ))}
              <input
                type="color"
                value={form.color_hex ?? '#84CC16'}
                onChange={e => setForm(f => ({ ...f, color_hex: e.target.value }))}
                title="Cor personalizada"
                style={{
                  width: 26, height: 26, borderRadius: 8, border: '1px solid var(--gray3)',
                  background: 'var(--bg)', padding: 2, cursor: 'pointer', flexShrink: 0,
                }}
              />
            </div>
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Segmento">
              <AppCombobox
                value={form.segmento ?? ''}
                onChange={v => set('segmento', v)}
                options={segmentoOpts}
                onAddOption={v => setSegmentoOpts(p => [...p, v])}
                placeholder="Ex: Financeiro"
              />
            </Field>
            <Field label="Sub-segmento">
              <AppCombobox
                value={form.sub_segmento ?? ''}
                onChange={v => set('sub_segmento', v)}
                options={subSegmentoOpts}
                onAddOption={v => setSubSegmentoOpts(p => [...p, v])}
                placeholder="Ex: Plano de benefícios"
              />
            </Field>
          </div>

          <SectionTitle>Datas</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Data de entrada">
              <AppDatePicker
                value={form.data_entrada ?? ''}
                onChange={v => set('data_entrada', v)}
              />
            </Field>
            <Field label="Data de saída">
              <AppDatePicker
                value={form.data_saida ?? ''}
                onChange={v => set('data_saida', v)}
              />
            </Field>
          </div>

          <SectionTitle>Aquisição</SectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Origem comercial">
              <AppCombobox
                value={form.origem_comercial ?? ''}
                onChange={v => set('origem_comercial', v)}
                options={origemOpts}
                onAddOption={v => setOrigemOpts(p => [...p, v])}
                placeholder="Ex: Indicação"
              />
            </Field>
            <Field label="Canal de aquisição">
              <AppCombobox
                value={form.canal_aquisicao ?? ''}
                onChange={v => set('canal_aquisicao', v)}
                options={canalOpts}
                onAddOption={v => setCanalOpts(p => [...p, v])}
                placeholder="Ex: WhatsApp"
              />
            </Field>
          </div>

          <SectionTitle>Localização e Contato</SectionTitle>
          <Field label="Cidade / Estado">
            <input
              value={form.cidade_estado ?? ''}
              onChange={e => set('cidade_estado', e.target.value)}
              onFocus={() => setFocused('cidade_estado')}
              onBlur={() => setFocused(null)}
              placeholder="Ex: Belo Horizonte - MG"
              style={focusStyle('cidade_estado')}
            />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Nome do contato">
              <input
                value={form.contact_name ?? ''}
                onChange={e => set('contact_name', e.target.value)}
                onFocus={() => setFocused('contact_name')}
                onBlur={() => setFocused(null)}
                placeholder="Ex: Rafael Lima"
                style={focusStyle('contact_name')}
              />
            </Field>
            <Field label="E-mail do contato">
              <input
                type="email"
                value={form.contact_email ?? ''}
                onChange={e => set('contact_email', e.target.value)}
                onFocus={() => setFocused('contact_email')}
                onBlur={() => setFocused(null)}
                placeholder="email@empresa.com"
                style={focusStyle('contact_email')}
              />
            </Field>
          </div>
          <Field label="Link da pasta (Drive, Notion…)">
            <input
              value={form.pasta ?? ''}
              onChange={e => set('pasta', e.target.value)}
              onFocus={() => setFocused('pasta')}
              onBlur={() => setFocused(null)}
              placeholder="https://..."
              style={focusStyle('pasta')}
            />
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--gray3)',
          display: 'flex', gap: 10, alignItems: 'center', flexShrink: 0,
        }}>
          {/* Delete — só aparece na edição */}
          {!isNew && onDelete && (
            <button
              onClick={onDelete}
              title="Excluir cliente"
              style={{
                width: 34, height: 34, borderRadius: 8, border: '1px solid var(--gray3)',
                background: 'transparent', cursor: 'pointer', flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'var(--gray2)', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = 'rgba(217,48,37,0.35)'; e.currentTarget.style.color = '#D93025' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
            >
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <path d="M1.75 3.5h10.5M5.25 3.5V2.333A.583.583 0 015.833 1.75h2.334a.583.583 0 01.583.583V3.5M3.5 3.5l.875 8.167a.583.583 0 00.583.583h4.084a.583.583 0 00.583-.583L10.5 3.5M5.833 6.417v3.5M8.167 6.417v3.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}

          <div style={{ flex: 1 }} />

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
            Cancelar
          </button>
          <button
            onClick={() => canSave && onSave(form)}
            disabled={!canSave}
            style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: canSave ? 'var(--primary)' : 'var(--gray3)',
              fontSize: 13, fontWeight: 700,
              color: canSave ? 'var(--primary-text)' : 'var(--gray2)',
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              boxShadow: canSave ? '0 2px 8px var(--primary-mid)' : 'none',
            }}
          >
            {isNew ? 'Criar cliente' : 'Salvar alterações'}
          </button>
        </div>
      </div>
    </>
  )
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────

function DeleteModal({ client, onConfirm, onClose }: {
  client: ClientWithStats
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 4000,
          background: 'rgba(18,19,22,0.35)', backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.15s ease both',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          width: 400,
          background: 'var(--white)', borderRadius: 16,
          boxShadow: '0 20px 60px rgba(0,0,0,0.20)',
          animation: 'modalSlideUp 0.2s ease both',
          overflow: 'hidden',
        }}>
        {/* Red top bar */}
        <div style={{ height: 4, background: '#D93025' }} />

        <div style={{ padding: '24px 24px 20px' }}>
          {/* Icon + title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 10, flexShrink: 0,
              background: 'rgba(217,48,37,0.10)', border: '1px solid rgba(217,48,37,0.20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
                <path d="M2 4.5h14M6.5 4.5V3a1 1 0 011-1h3a1 1 0 011 1v1.5M7.5 8v5M10.5 8v5M3.5 4.5l1 10a1 1 0 001 .9h7a1 1 0 001-.9l1-10" stroke="#D93025" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', marginBottom: 4 }}>
                Excluir cliente
              </div>
              <div style={{ fontSize: 13, color: 'var(--gray)', lineHeight: 1.5 }}>
                Tem certeza que deseja excluir{' '}
                <strong style={{ color: 'var(--black)' }}>{client.name}</strong>?
                Esta ação não pode ser desfeita.
              </div>
            </div>
          </div>

          {/* Warning if has projects */}
          {client.projs > 0 && (
            <div style={{
              padding: '10px 12px', borderRadius: 8,
              background: 'rgba(217,48,37,0.06)', border: '1px solid rgba(217,48,37,0.18)',
              fontSize: 12, color: '#D93025', lineHeight: 1.5, marginBottom: 4,
            }}>
              ⚠️ Este cliente possui <strong>{client.projs} projeto{client.projs !== 1 ? 's' : ''}</strong> associado{client.projs !== 1 ? 's' : ''}. Os projetos também serão removidos.
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0 24px 20px', display: 'flex', gap: 10, justifyContent: 'flex-end',
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
            onMouseEnter={e => { e.currentTarget.style.background = '#b5261e'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(217,48,37,0.50)' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#D93025'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(217,48,37,0.35)' }}
          >
            Excluir
          </button>
        </div>
      </div>
      </div>
    </>
  )
}

// ── Clients Table ─────────────────────────────────────────────────────────────

type ClientWithStats = Client & { projs: number; active: number; completed: number; color: string }

const STATUS_BADGE_OPTIONS = [
  { value: '', label: '—' },
  ...Object.entries(CLIENT_STATUS).map(([k, v]) => ({
    value: k, label: v.label, color: v.color, bg: v.bg, border: v.border,
  })),
]

function StatusPicker({ status, onChange }: {
  status?: ClientStatus | null
  onChange: (s: ClientStatus | undefined) => void
}) {
  return (
    <AppSelect
      value={status ?? ''}
      onChange={v => onChange(v ? v as ClientStatus : undefined)}
      options={STATUS_BADGE_OPTIONS}
      mode="badge"
      placeholder="—"
      onClick={e => e.stopPropagation()}
    />
  )
}

function ClientTable({ clients, onEdit, onDelete, onStatusChange }: {
  clients: ClientWithStats[]
  onEdit: (c: ClientWithStats) => void
  onDelete: (c: ClientWithStats) => void
  onStatusChange: (id: string, status: ClientStatus | undefined) => void
}) {
  const [hovRow, setHovRow] = useState<string | null>(null)

  const COL_STYLE: React.CSSProperties = {
    flexShrink: 0, padding: '11px 10px 11px 0',
    fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
    textTransform: 'uppercase', letterSpacing: '0.07em',
  }
  const CELL: React.CSSProperties = { flexShrink: 0, padding: '0 10px 0 0', fontSize: 12, color: 'var(--gray)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }

  return (
    <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      <div style={{ overflowX: 'auto' }}>
        {/* Head */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)', minWidth: 900 }}>
          <div style={{ width: 4, marginRight: 14, flexShrink: 0 }} />
          <div style={{ ...COL_STYLE, width: 200 }}>Cliente</div>
          <div style={{ ...COL_STYLE, width: 120 }}>Status</div>
          <div style={{ ...COL_STYLE, width: 100 }}>Entrada</div>
          <div style={{ ...COL_STYLE, width: 130 }}>Segmento</div>
          <div style={{ ...COL_STYLE, width: 120 }}>Origem</div>
          <div style={{ ...COL_STYLE, width: 110 }}>Canal</div>
          <div style={{ ...COL_STYLE, width: 150 }}>Cidade/Estado</div>
          <div style={{ ...COL_STYLE, width: 80  }}>Projetos</div>
          <div style={{ flex: 1 }} />
        </div>

        {/* Rows */}
        {clients.length === 0 ? (
          <div style={{ padding: '48px 0', textAlign: 'center', fontSize: 13, color: 'var(--gray2)', minWidth: 900 }}>
            Nenhum cliente encontrado.
          </div>
        ) : clients.map((c, i) => {
          const isHov = hovRow === c.id
          return (
            <div
              key={c.id}
              onClick={() => onEdit(c)}
              onMouseEnter={() => setHovRow(c.id)}
              onMouseLeave={() => setHovRow(null)}
              className="animate-slide-up"
              style={{
                display: 'flex', alignItems: 'center', padding: '0 20px',
                borderBottom: i < clients.length - 1 ? '1px solid var(--gray3)' : 'none',
                background: isHov ? `${c.color}06` : 'var(--white)',
                cursor: 'pointer', transition: 'background 0.15s',
                animationDelay: `${i * 0.03}s`, minWidth: 900,
              }}
            >
              <div style={{ width: 4, height: 40, borderRadius: 2, background: c.color, marginRight: 14, flexShrink: 0, opacity: isHov ? 1 : 0.6, transition: 'opacity 0.15s' }} />

              {/* Nome */}
              <div style={{ width: 200, flexShrink: 0, padding: '12px 10px 12px 0', minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: 7, flexShrink: 0,
                    background: c.color + '18', border: `1px solid ${c.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 11, fontWeight: 800, color: c.color,
                  }}>
                    {c.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.name}
                    </div>
                    {c.sub_segmento && (
                      <div style={{ fontSize: 10, color: 'var(--gray2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.sub_segmento}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status — inline picker, não clipado */}
              <div style={{ width: 120, flexShrink: 0, padding: '0 10px 0 0' }}>
                <StatusPicker status={c.status} onChange={s => onStatusChange(c.id, s)} />
              </div>

              <div style={{ width: 100, ...CELL }}>{fmt(c.data_entrada)}</div>
              <div style={{ width: 130, ...CELL, fontWeight: c.segmento ? 600 : 400, color: c.segmento ? 'var(--black)' : 'var(--gray2)' }}>{c.segmento || '—'}</div>
              <div style={{ width: 120, ...CELL }}>{c.origem_comercial || '—'}</div>
              <div style={{ width: 110, ...CELL }}>{c.canal_aquisicao || '—'}</div>
              <div style={{ width: 150, ...CELL }}>{c.cidade_estado || '—'}</div>

              {/* Projetos */}
              <div style={{ width: 80, flexShrink: 0, padding: '0 10px 0 0' }}>
                {c.projs > 0 ? (
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)' }}>
                    {c.projs}
                  </span>
                ) : <span style={{ fontSize: 12, color: 'var(--gray2)' }}>—</span>}
              </div>

              {/* Actions */}
              <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                {/* Edit */}
                <div style={{
                  width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isHov ? c.color + '15' : 'transparent',
                  border: isHov ? `1px solid ${c.color}35` : '1px solid transparent',
                  color: isHov ? c.color : 'transparent',
                  transition: 'all 0.15s', flexShrink: 0,
                }}>
                  <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                    <path d="M8.5 1.5a1.5 1.5 0 012.12 2.12L4 10.25H1.75V8L8.5 1.5z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
                  </svg>
                </div>
                {/* Delete */}
                <div
                  onClick={e => { e.stopPropagation(); onDelete(c) }}
                  style={{
                    width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isHov ? 'rgba(217,48,37,0.08)' : 'transparent',
                    border: isHov ? '1px solid rgba(217,48,37,0.22)' : '1px solid transparent',
                    color: isHov ? '#D93025' : 'transparent',
                    transition: 'all 0.15s', flexShrink: 0, cursor: 'pointer',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.14)'; e.currentTarget.style.borderColor = 'rgba(217,48,37,0.40)' }}
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

type FilterKey = '' | 'ativos' | 'com_projetos' | 'sem_projetos'

export default function ClientsPage() {
  return <Suspense><ClientsPageInner /></Suspense>
}

function ClientsPageInner() {
  const searchParams  = useSearchParams()
  const [clients,     setClients]     = useState<Client[]>([])
  const [rawProjects, setRawProjects] = useState<Project[]>([])
  const [filter,      setFilter]      = useState<FilterKey>('')
  const [editing,     setEditing]     = useState<Client | null>(null)
  const [isNew,       setIsNew]       = useState(false)
  const [deleting,    setDeleting]    = useState<ClientWithStats | null>(null)
  const [loading,     setLoading]     = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([c, p]: [Client[], Project[]]) => {
      setClients(c)
      setRawProjects(p)

      // Auto-open edit drawer when ?open=<id> is present
      const openId = searchParams.get('open')
      if (openId) {
        const found = c.find((cl: Client) => cl.id === openId)
        if (found) { setEditing(found); setIsNew(false) }
      }
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Open new client drawer from Quick Search (createStore)
  const pendingCreate = useCreateStore(s => s.pendingCreate)
  const consumeCreate = useCreateStore(s => s.consumeCreate)
  useEffect(() => {
    if (pendingCreate !== 'client') return
    setEditing(newEmptyClient())
    setIsNew(true)
    consumeCreate()
  }, [pendingCreate, consumeCreate])

  const withStats: ClientWithStats[] = clients.map((c, i) => {
    const projs     = rawProjects.filter(p => p.client_id === c.id)
    const active    = projs.filter(p => p.status === 'active').length
    const completed = projs.filter(p => p.status === 'completed').length
    return { ...c, projs: projs.length, active, completed, color: c.color_hex ?? COLOR_PRESETS[i % COLOR_PRESETS.length] }
  })

  const filtered = withStats.filter(c => {
    if (filter === 'ativos'       && c.status !== 'active') return false
    if (filter === 'com_projetos' && c.projs === 0)         return false
    if (filter === 'sem_projetos' && c.projs > 0)           return false
    return true
  })

  const handleSave = async (updated: Client) => {
    if (isNew) {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        toast.error('Erro ao criar cliente', data?.error ?? `HTTP ${res.status}`)
        return
      }
      setClients(prev => [...prev, data])
      toast.success('Cliente criado!', `"${data.name}" foi adicionado com sucesso.`)
    } else {
      const res = await fetch(`/api/clients/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      })
      const data = await res.json()
      if (!res.ok || data?.error) {
        toast.error('Erro ao salvar cliente', data?.error ?? `HTTP ${res.status}`)
        return
      }
      setClients(prev => prev.map(c => c.id === updated.id ? data : c))
      toast.success('Cliente atualizado!', `"${data.name}" foi salvo.`)
    }
    setEditing(null)
    setIsNew(false)
  }

  const handleStatusChange = async (id: string, status: ClientStatus | undefined) => {
    const client = clients.find(c => c.id === id)
    if (!client) return
    const updated = { ...client, status }
    setClients(prev => prev.map(c => c.id === id ? updated : c))
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    })
    if (!res.ok) {
      setClients(prev => prev.map(c => c.id === id ? client : c))
      toast.error('Erro ao atualizar status')
    }
  }

  const handleDelete = async () => {
    if (!deleting) return
    const name = deleting.name
    const res = await fetch(`/api/clients/${deleting.id}`, { method: 'DELETE' })
    if (!res.ok) {
      toast.error('Erro ao excluir cliente', 'Tente novamente.')
      setDeleting(null)
      return
    }
    setClients(prev => prev.filter(c => c.id !== deleting.id))
    setDeleting(null)
    toast.success('Cliente excluído', `"${name}" foi removido.`)
  }

  const handleNew = () => {
    setEditing(newEmptyClient())
    setIsNew(true)
  }


  const FILTER_PILLS: { key: FilterKey; label: string }[] = [
    { key: '',              label: 'Todos'          },
    { key: 'ativos',        label: 'Ativos'         },
    { key: 'com_projetos',  label: 'Com projetos'   },
    { key: 'sem_projetos',  label: 'Sem projetos'   },
  ]

  if (loading) return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div className="shimmer-bar" style={{ width: 100, height: 22, borderRadius: 6, background: 'var(--gray3)', marginBottom: 8 }} />
        <div className="shimmer-bar" style={{ width: 160, height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
      </div>
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '4px 44px 1fr 100px 120px 80px', gap: 16, padding: '10px 20px', borderBottom: '1px solid var(--gray3)', background: 'var(--bg)' }}>
          {[4, 44, 120, 80, 100, 60].map((w, i) => (
            <div key={i} className="shimmer-bar" style={{ height: 10, width: w, borderRadius: 4, background: 'var(--gray3)' }} />
          ))}
        </div>
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="shimmer-bar" style={{
            display: 'grid', gridTemplateColumns: '4px 44px 1fr 100px 120px 80px',
            alignItems: 'center', gap: 16, padding: '14px 20px',
            borderBottom: i < 7 ? '1px solid var(--gray3)' : 'none',
            animationDelay: `${i * 0.06}s`,
          }}>
            <div style={{ width: 4, height: 36, borderRadius: 2, background: 'var(--gray3)' }} />
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--gray3)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ width: '55%', height: 12, borderRadius: 4, background: 'var(--gray3)' }} />
              <div style={{ width: '35%', height: 10, borderRadius: 4, background: 'var(--gray3)' }} />
            </div>
            <div style={{ width: 70, height: 22, borderRadius: 100, background: 'var(--gray3)' }} />
            <div style={{ width: 90, height: 22, borderRadius: 100, background: 'var(--gray3)' }} />
            <div style={{ width: 50, height: 11, borderRadius: 4, background: 'var(--gray3)' }} />
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
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Clientes</h1>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
            {clients.length} cliente{clients.length !== 1 ? 's' : ''} cadastrados
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {FILTER_PILLS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              style={{
                padding: '5px 12px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                border: `1px solid ${filter === key ? 'var(--primary)' : 'var(--gray3)'}`,
                background: filter === key ? 'var(--primary-dim)' : 'transparent',
                color: filter === key ? 'var(--primary-text)' : 'var(--gray2)',
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          ))}
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
            + Novo cliente
          </button>
        </div>
      </div>

      <ClientTable
        clients={filtered}
        onEdit={c => { setEditing(c); setIsNew(false) }}
        onDelete={c => setDeleting(c)}
        onStatusChange={handleStatusChange}
      />

      {editing && (
        <EditDrawer
          client={editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setIsNew(false) }}
          onDelete={!isNew ? () => {
            const stats = withStats.find(c => c.id === editing.id)
            if (stats) { setEditing(null); setIsNew(false); setDeleting(stats) }
          } : undefined}
          isNew={isNew}
        />
      )}

      {deleting && (
        <DeleteModal
          client={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
