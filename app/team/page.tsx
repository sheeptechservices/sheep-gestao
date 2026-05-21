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
  active:   { label: 'Ativo',   color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)',  border: 'rgba(30,138,62,0.25)'  },
  inactive: { label: 'Inativo', color: '#666666', bg: 'rgba(100,100,100,0.08)', border: 'var(--gray3)'          },
  vacation: { label: 'Férias',  color: '#7C3AED', bg: 'rgba(124,58,237,0.10)', border: 'rgba(124,58,237,0.25)' },
}

const CARGOS = [
  'Dev', 'Designer', 'PO / PM', 'QA', 'DevOps',
  'Comercial', 'Marketing', 'Jurídico', 'Secretaria', 'Outro',
]

// ── Shared styles ─────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--gray3)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--black)', fontFamily: 'inherit',
  outline: 'none', boxSizing: 'border-box',
}

const selectStyle: React.CSSProperties = {
  ...inputStyle, cursor: 'pointer', appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10'%3E%3Cpath d='M2 3.5l3 3 3-3' fill='none' stroke='%23999' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: 28,
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

// ── Edit Drawer ───────────────────────────────────────────────────────────────

function MemberDrawer({ member, onClose }: { member: TeamMember | null; onClose: () => void }) {
  const { addMember, updateMember, uploadPhoto } = useTeamStore()
  const [form, setForm] = useState<Partial<TeamMember>>(member ?? {
    name: '', cargo: '', email: '', joined_at: new Date().toISOString().split('T')[0],
    status: 'active', color_hex: '#84CC16',
  })
  const [saving, setSaving] = useState(false)
  const isNew = !member

  function set<K extends keyof TeamMember>(k: K, v: TeamMember[K]) {
    setForm(f => ({ ...f, [k]: v }))
  }

  async function handleSave() {
    if (!form.name?.trim()) return
    setSaving(true)
    if (isNew) {
      await addMember({ name: form.name!, cargo: form.cargo ?? '', email: form.email,
        joined_at: form.joined_at, status: form.status ?? 'active',
        color_hex: form.color_hex ?? '#84CC16', photo_url: undefined })
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
        width: 400, maxWidth: '100vw', background: 'var(--white)',
        borderLeft: '1px solid var(--gray3)', display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)', animation: 'panelSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both',
      }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--black)' }}>
            {isNew ? 'Novo membro' : 'Editar membro'}
          </h2>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', padding: 4 }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isNew && member && (
            <Field label="Foto">
              <PhotoUpload member={{ ...member, ...form } as TeamMember} onUpload={f => uploadPhoto(member.id, f)} />
            </Field>
          )}

          <Field label="Cor">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {COLOR_PRESETS.map(c => (
                <button key={c} type="button" onClick={() => set('color_hex', c)} style={{
                  width: 26, height: 26, borderRadius: '50%', background: c,
                  border: form.color_hex === c ? '3px solid var(--black)' : '2px solid transparent',
                  cursor: 'pointer', boxSizing: 'border-box',
                }} />
              ))}
              <input type="color" value={form.color_hex ?? '#84CC16'} onChange={e => set('color_hex', e.target.value)}
                style={{ width: 26, height: 26, padding: 0, border: '2px solid var(--gray3)', borderRadius: '50%', cursor: 'pointer', background: 'none' }} />
            </div>
          </Field>

          <Field label="Nome *">
            <input style={inputStyle} value={form.name ?? ''} onChange={e => set('name', e.target.value)} placeholder="Nome completo" />
          </Field>

          <Field label="Cargo">
            <select style={selectStyle} value={form.cargo ?? ''} onChange={e => set('cargo', e.target.value)}>
              <option value="">— Selecione —</option>
              {CARGOS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>

          <Field label="E-mail">
            <input style={inputStyle} type="email" value={form.email ?? ''} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
          </Field>

          <Field label="Entrada na equipe">
            <input style={inputStyle} type="date" value={form.joined_at ?? ''} onChange={e => set('joined_at', e.target.value)} />
          </Field>

          <Field label="Status">
            <select style={selectStyle} value={form.status ?? 'active'} onChange={e => set('status', e.target.value as MemberStatus)}>
              <option value="active">Ativo</option>
              <option value="inactive">Inativo</option>
              <option value="vacation">Férias</option>
            </select>
          </Field>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray3)', display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--black)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !form.name?.trim()} style={{
            padding: '8px 18px', borderRadius: 8, fontSize: 13, fontWeight: 700,
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

function TeamTable({ members, onEdit, onDelete }: {
  members: TeamMember[]
  onEdit: (m: TeamMember) => void
  onDelete: (m: TeamMember) => void
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
          const s = STATUS_CONFIG[m.status]
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

              {/* Status badge */}
              <div style={{ width: 110, flexShrink: 0, padding: '0 10px 0 0' }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 9px', borderRadius: 100, color: s.color, background: s.bg, border: `1px solid ${s.border}` }}>
                  {s.label}
                </span>
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
  const { members, loading, fetchMembers, deleteMember } = useTeamStore()
  const [drawerMember, setDrawerMember] = useState<TeamMember | 'new' | null>(null)
  const [toDelete,     setToDelete]     = useState<TeamMember | null>(null)
  const [filterStatus, setFilterStatus] = useState<MemberStatus | 'all'>('all')

  useEffect(() => { fetchMembers() }, [fetchMembers])

  const filtered = members
    .filter(m => filterStatus === 'all' || m.status === filterStatus)

  const PILLS: { key: MemberStatus | 'all'; label: string }[] = [
    { key: 'all',      label: 'Todos'   },
    { key: 'active',   label: 'Ativos'  },
    { key: 'vacation', label: 'Férias'  },
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
