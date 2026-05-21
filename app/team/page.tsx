'use client'
import { useState, useEffect, useRef } from 'react'
import { useTeamStore } from '@/stores/teamStore'
import { MemberAvatar } from '@/components/ui/MemberAvatar'
import type { TeamMember, MemberStatus } from '@/lib/types'

// ── Constants ─────────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
  '#84CC16','#6366F1','#F59E0B','#EC4899','#14B8A6',
  '#8B5CF6','#3B82F6','#D93025','#1E8A3E','#F97316',
]

const STATUS_CONFIG: Record<MemberStatus, { label: string; color: string; bg: string; border: string }> = {
  active:   { label: 'Ativo',    color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)',  border: 'rgba(30,138,62,0.25)'  },
  inactive: { label: 'Inativo',  color: '#666666', bg: 'rgba(100,100,100,0.08)', border: 'var(--gray3)'         },
  vacation: { label: 'Férias',   color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.25)' },
}

const CARGOS = [
  'Dev', 'Designer', 'PO / PM', 'QA', 'DevOps',
  'Comercial', 'Marketing', 'Jurídico', 'Secretaria', 'Outro',
]

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--gray3)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--black)', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 3.5l3 3 3-3' fill='none' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
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

function emptyMember(): Partial<TeamMember> {
  return {
    name: '',
    cargo: '',
    email: '',
    joined_at: new Date().toISOString().split('T')[0],
    status: 'active',
    color_hex: '#84CC16',
  }
}

// ── Photo Upload Button ────────────────────────────────────────────────────────

function PhotoUpload({ member, onUpload }: { member: TeamMember; onUpload: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { deletePhoto } = useTeamStore()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <MemberAvatar member={member} size={56} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          style={{
            padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
            border: '1px solid var(--gray3)', background: 'var(--bg-card)',
            cursor: 'pointer', color: 'var(--text)',
          }}
        >
          {member.photo_url ? 'Trocar foto' : 'Adicionar foto'}
        </button>
        {member.photo_url && (
          <button
            type="button"
            onClick={() => deletePhoto(member.id)}
            style={{
              padding: '5px 12px', borderRadius: 7, fontSize: 12, fontWeight: 600,
              border: 'none', background: 'transparent',
              cursor: 'pointer', color: '#D93025',
            }}
          >
            Remover foto
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) onUpload(f); e.target.value = '' }}
      />
    </div>
  )
}

// ── Edit Drawer ────────────────────────────────────────────────────────────────

interface DrawerProps {
  member: TeamMember | null  // null = novo
  onClose: () => void
}

function MemberDrawer({ member, onClose }: DrawerProps) {
  const { addMember, updateMember, uploadPhoto } = useTeamStore()
  const [form, setForm] = useState<Partial<TeamMember>>(member ?? emptyMember())
  const [saving, setSaving] = useState(false)
  const isNew = !member

  function set<K extends keyof TeamMember>(k: K, v: TeamMember[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.name?.trim()) return
    setSaving(true)
    if (isNew) {
      await addMember({
        name: form.name!,
        cargo: form.cargo ?? '',
        email: form.email,
        joined_at: form.joined_at,
        status: form.status ?? 'active',
        color_hex: form.color_hex ?? '#84CC16',
        photo_url: undefined,
      })
    } else {
      await updateMember(member.id, form)
    }
    setSaving(false)
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.35)',
          backdropFilter: 'blur(2px)',
        }}
      />
      {/* Panel */}
      <aside style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1001,
        width: 380, maxWidth: '100vw',
        background: 'var(--bg-card)',
        borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 32px rgba(0,0,0,0.18)',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>
            {isNew ? 'Novo membro' : 'Editar membro'}
          </h2>
          <button
            onClick={onClose}
            style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', padding: 4 }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Photo (only when editing existing) */}
          {!isNew && member && (
            <Field label="Foto">
              <PhotoUpload
                member={{ ...member, ...form } as TeamMember}
                onUpload={(file) => uploadPhoto(member.id, file)}
              />
            </Field>
          )}

          {/* Color */}
          <Field label="Cor">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLOR_PRESETS.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color_hex', c)}
                  style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: c, border: form.color_hex === c ? '3px solid var(--text)' : '2px solid transparent',
                    cursor: 'pointer', boxSizing: 'border-box',
                  }}
                />
              ))}
              {/* Custom color */}
              <div style={{ position: 'relative', width: 26, height: 26 }}>
                <input
                  type="color"
                  value={form.color_hex ?? '#84CC16'}
                  onChange={e => set('color_hex', e.target.value)}
                  style={{
                    width: '100%', height: '100%', padding: 0, border: '2px solid var(--gray3)',
                    borderRadius: '50%', cursor: 'pointer', background: 'none',
                  }}
                />
              </div>
            </div>
          </Field>

          {/* Name */}
          <Field label="Nome *">
            <input
              style={inputStyle}
              value={form.name ?? ''}
              onChange={e => set('name', e.target.value)}
              placeholder="Nome completo"
            />
          </Field>

          {/* Cargo */}
          <Field label="Cargo">
            <select
              style={selectStyle}
              value={form.cargo ?? ''}
              onChange={e => set('cargo', e.target.value)}
            >
              <option value="">— Selecione —</option>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          {/* Email */}
          <Field label="E-mail">
            <input
              style={inputStyle}
              type="email"
              value={form.email ?? ''}
              onChange={e => set('email', e.target.value)}
              placeholder="email@empresa.com"
            />
          </Field>

          {/* joined_at */}
          <Field label="Entrada na equipe">
            <input
              style={inputStyle}
              type="date"
              value={form.joined_at ?? ''}
              onChange={e => set('joined_at', e.target.value)}
            />
          </Field>

          {/* Status */}
          <Field label="Status">
            <select
              style={selectStyle}
              value={form.status ?? 'active'}
              onChange={e => set('status', e.target.value as MemberStatus)}
            >
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="vacation">Férias</option>
            </select>
          </Field>
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 20px',
          borderTop: '1px solid var(--border)',
          display: 'flex', gap: 8, justifyContent: 'flex-end',
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600,
              border: '1px solid var(--gray3)', background: 'transparent',
              cursor: 'pointer', color: 'var(--text)',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !form.name?.trim()}
            style={{
              padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
              border: 'none', background: '#84CC16',
              cursor: saving ? 'not-allowed' : 'pointer', color: '#1a2e05',
              opacity: saving || !form.name?.trim() ? 0.6 : 1,
            }}
          >
            {saving ? 'Salvando…' : isNew ? 'Criar membro' : 'Salvar'}
          </button>
        </div>
      </aside>
    </>
  )
}

// ── Member Card ────────────────────────────────────────────────────────────────

function MemberCard({ member, onEdit, onDelete }: {
  member: TeamMember
  onEdit: () => void
  onDelete: () => void
}) {
  const s = STATUS_CONFIG[member.status]

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 12,
      padding: '16px',
      display: 'flex',
      gap: 14,
      alignItems: 'flex-start',
      transition: 'box-shadow 0.15s',
    }}>
      <MemberAvatar member={member} size={44} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: 14 }}>{member.name}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
            color: s.color, background: s.bg, border: `1px solid ${s.border}`,
          }}>{s.label}</span>
        </div>
        {member.cargo && (
          <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>{member.cargo}</div>
        )}
        {member.email && (
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            <a href={`mailto:${member.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>
              {member.email}
            </a>
          </div>
        )}
        {member.joined_at && (
          <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 4 }}>
            Na equipe desde {member.joined_at.split('-').reverse().join('/')}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
        <button
          onClick={onEdit}
          title="Editar"
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid var(--gray3)', background: 'var(--bg)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray2)',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M9.5 1.5l2 2L4 11H2v-2L9.5 1.5Z" strokeLinejoin="round"/>
          </svg>
        </button>
        <button
          onClick={onDelete}
          title="Remover"
          style={{
            width: 30, height: 30, borderRadius: 8,
            border: '1px solid rgba(217,48,37,0.25)', background: 'rgba(217,48,37,0.06)',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#D93025',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M2 4h9M4.5 4V2.5h4V4M5 6.5v3.5M8 6.5v3.5M3 4l.6 6.5h5.8L10 4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Delete Confirm ─────────────────────────────────────────────────────────────

function DeleteConfirm({ member, onConfirm, onCancel }: {
  member: TeamMember
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <>
      <div onClick={onCancel} style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }} />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
        zIndex: 1101, background: 'var(--bg-card)', border: '1px solid var(--border)',
        borderRadius: 14, padding: '24px 28px', width: 340, maxWidth: '90vw',
        boxShadow: '0 16px 48px rgba(0,0,0,0.22)',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: 'rgba(217,48,37,0.10)', display: 'flex', alignItems: 'center',
            justifyContent: 'center', color: '#D93025',
          }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.7">
              <path d="M3 5.5h12M6 5.5V4h6v1.5M4 5.5l.8 9h8.4l.8-9" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M7.5 8.5v3.5M10.5 8.5v3.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6 }}>Remover membro?</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              <strong>{member.name}</strong> será removido permanentemente da equipe. Os entregáveis associados não serão excluídos, mas perderão o responsável.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
            <button
              onClick={onCancel}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                border: '1px solid var(--gray3)', background: 'transparent',
                cursor: 'pointer', color: 'var(--text)',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              style={{
                padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                border: 'none', background: '#D93025',
                cursor: 'pointer', color: '#fff',
              }}
            >
              Remover
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TeamPage() {
  const { members, loading, fetchMembers, deleteMember } = useTeamStore()
  const [drawerMember, setDrawerMember] = useState<TeamMember | 'new' | null>(null)
  const [toDelete, setToDelete] = useState<TeamMember | null>(null)
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const filtered = members
    .filter(m => filterStatus === 'all' || m.status === filterStatus)
    .filter(m => !query || m.name.toLowerCase().includes(query.toLowerCase()) || m.cargo?.toLowerCase().includes(query.toLowerCase()))

  return (
    <div style={{ padding: '32px 28px', maxWidth: 900, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Equipe</h1>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-muted)' }}>
            {members.filter(m => m.status === 'active').length} membros ativos
          </p>
        </div>
        <button
          onClick={() => setDrawerMember('new')}
          style={{
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 16px', borderRadius: 9, fontSize: 13, fontWeight: 700,
            border: 'none', background: '#84CC16', color: '#1a2e05', cursor: 'pointer',
          }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6.5 1.5v10M1.5 6.5h10" strokeLinecap="round"/>
          </svg>
          Novo membro
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
          <svg
            width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5"
            style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}
          >
            <circle cx="5.5" cy="5.5" r="3.5"/>
            <path d="M8.5 8.5L11 11" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar membro..."
            style={{
              ...inputStyle,
              paddingLeft: 30,
              maxWidth: 260,
            }}
          />
        </div>

        {/* Status tabs */}
        <div style={{ display: 'flex', gap: 4 }}>
          {(['all', 'active', 'vacation', 'inactive'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                border: '1px solid var(--gray3)',
                background: filterStatus === s ? 'var(--text)' : 'var(--bg-card)',
                color: filterStatus === s ? 'var(--bg)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {s === 'all' ? 'Todos' : STATUS_CONFIG[s].label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading && (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-muted)', fontSize: 14 }}>
          Carregando…
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>👥</div>
          <div style={{ fontWeight: 600, fontSize: 15 }}>Nenhum membro encontrado</div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {members.length === 0 ? 'Clique em "Novo membro" para começar.' : 'Tente ajustar o filtro.'}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {filtered.map(m => (
          <MemberCard
            key={m.id}
            member={m}
            onEdit={() => setDrawerMember(m)}
            onDelete={() => setToDelete(m)}
          />
        ))}
      </div>

      {/* Drawer */}
      {drawerMember !== null && (
        <MemberDrawer
          member={drawerMember === 'new' ? null : drawerMember}
          onClose={() => setDrawerMember(null)}
        />
      )}

      {/* Delete confirm */}
      {toDelete && (
        <DeleteConfirm
          member={toDelete}
          onCancel={() => setToDelete(null)}
          onConfirm={async () => {
            await deleteMember(toDelete.id)
            setToDelete(null)
          }}
        />
      )}
    </div>
  )
}
