'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { toast } from '@/stores/toastStore'
import { ALL_PAGES, PROTECTED_MASTER_EMAIL } from '@/lib/auth'
import type { AppUser } from '@/lib/types'

// ── Helpers ───────────────────────────────────────────────────────────────────

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '9px 12px', fontSize: 13, fontWeight: 500,
  border: '1px solid var(--gray3)', borderRadius: 8, outline: 'none',
  background: 'var(--white)', color: 'var(--black)',
  transition: 'border-color .15s', fontFamily: 'inherit', boxSizing: 'border-box',
}

function labelStyle(text: string) {
  return (
    <label style={{
      display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--gray2)',
      textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6,
    }}>{text}</label>
  )
}

function RoleChip({ role }: { role: 'master' | 'user' }) {
  return (
    <span style={{
      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
      background: role === 'master' ? 'rgba(124,58,237,0.12)' : 'rgba(107,114,128,0.12)',
      color: role === 'master' ? '#7C3AED' : '#6B7280',
      textTransform: 'uppercase', letterSpacing: '0.06em',
    }}>{role === 'master' ? 'Master' : 'User'}</span>
  )
}

function initials(name: string) {
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

// ── User form modal ───────────────────────────────────────────────────────────

interface UserFormProps {
  existing?: AppUser | null
  selfId: string
  onClose: () => void
  onSaved: (u: AppUser) => void
}

function UserFormModal({ existing, selfId, onClose, onSaved }: UserFormProps) {
  const [name,          setName]         = useState(existing?.name ?? '')
  const [email,         setEmail]        = useState(existing?.email ?? '')
  const [password,      setPassword]     = useState('')
  const [showPass,      setShowPass]     = useState(false)
  const [role,          setRole]         = useState<'master' | 'user'>(existing?.role ?? 'user')
  const [active,        setActive]       = useState(existing?.active ?? true)
  const [pages,         setPages]        = useState<string[]>(existing?.allowed_pages ?? [])
  const [saving,        setSaving]       = useState(false)
  const isEdit = !!existing
  const isProtected = existing?.email === PROTECTED_MASTER_EMAIL

  function togglePage(slug: string) {
    setPages(prev => prev.includes(slug) ? prev.filter(s => s !== slug) : [...prev, slug])
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { toast.error('Nome é obrigatório.'); return }
    if (!isEdit && !password) { toast.error('Senha é obrigatória para novos usuários.'); return }

    setSaving(true)
    try {
      let res: Response
      if (isEdit) {
        const body: Record<string, unknown> = { name, role, allowed_pages: pages, active }
        if (password) body.new_password = password
        res = await fetch(`/api/users/${existing!.id}`, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch('/api/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role, allowed_pages: pages }),
        })
      }
      if (!res.ok) {
        const data = await res.json() as { error?: string }
        toast.error(data.error ?? 'Erro ao salvar.')
        return
      }
      const saved = await res.json() as AppUser
      onSaved(saved)
      toast.success(isEdit ? 'Usuário atualizado!' : 'Usuário criado!')
      onClose()
    } catch {
      toast.error('Erro de conexão.')
    } finally {
      setSaving(false)
    }
  }

  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 2000,
        background: 'rgba(18,19,22,0.35)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 16,
          width: 'min(520px, 100%)', maxHeight: '90vh', overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
          animation: 'modalSlideUp 0.22s ease both',
        }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px 16px', borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: 'var(--white)', zIndex: 1, borderRadius: '16px 16px 0 0',
        }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', margin: 0 }}>
            {isEdit ? 'Editar Usuário' : 'Novo Usuário'}
          </h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--bg)', cursor: 'pointer', fontSize: 16,
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
          }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Name + Email */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {labelStyle('Nome')}
              <input style={inputStyle} value={name} onChange={e => setName(e.target.value)}
                placeholder="Nome completo" required
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray3)'}
              />
            </div>
            <div>
              {labelStyle('E-mail')}
              <input style={{ ...inputStyle, background: isEdit ? 'var(--bg)' : 'var(--white)' }}
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="email@exemplo.com" required disabled={isEdit}
                onFocus={e => { if (!isEdit) e.target.style.borderColor = 'var(--primary)' }}
                onBlur={e => e.target.style.borderColor = 'var(--gray3)'}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            {labelStyle(isEdit ? 'Nova Senha (deixe em branco para manter)' : 'Senha')}
            <div style={{ position: 'relative' }}>
              <input
                style={{ ...inputStyle, paddingRight: 40 }}
                type={showPass ? 'text' : 'password'}
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Mínimo 6 caracteres'}
                required={!isEdit}
                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--gray3)'}
              />
              <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray2)' }}>
                {showPass
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </button>
            </div>
          </div>

          {/* Role + Active */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              {labelStyle('Nível de acesso')}
              {isProtected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(124,58,237,0.08)', border: '1.5px solid #7C3AED' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#7C3AED" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#7C3AED' }}>Master (fixo)</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  {(['user', 'master'] as const).map(r => (
                    <button
                      key={r} type="button"
                      onClick={() => setRole(r)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8, border: `1.5px solid ${role === r ? (r === 'master' ? '#7C3AED' : 'var(--primary)') : 'var(--gray3)'}`,
                        background: role === r ? (r === 'master' ? 'rgba(124,58,237,0.08)' : 'var(--primary-dim)') : 'transparent',
                        color: role === r ? (r === 'master' ? '#7C3AED' : 'var(--primary)') : 'var(--gray2)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >{r === 'master' ? 'Master' : 'User'}</button>
                  ))}
                </div>
              )}
            </div>
            <div>
              {labelStyle('Status')}
              {isProtected ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', borderRadius: 8, background: 'rgba(5,150,105,0.08)', border: '1.5px solid #059669' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Sempre ativo</span>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 8 }}>
                  {([true, false] as const).map(a => (
                    <button
                      key={String(a)} type="button"
                      disabled={isEdit && existing!.id === selfId && !a}
                      onClick={() => setActive(a)}
                      style={{
                        flex: 1, padding: '8px 0', borderRadius: 8,
                        border: `1.5px solid ${active === a ? (a ? '#059669' : '#DC2626') : 'var(--gray3)'}`,
                        background: active === a ? (a ? 'rgba(5,150,105,0.08)' : 'rgba(220,38,38,0.08)') : 'transparent',
                        color: active === a ? (a ? '#059669' : '#DC2626') : 'var(--gray2)',
                        fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                        opacity: isEdit && existing!.id === selfId && !a ? 0.4 : 1,
                      }}
                    >{a ? 'Ativo' : 'Inativo'}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Page permissions — only for 'user' role */}
          {role === 'user' && (
            <div>
              {labelStyle('Páginas liberadas')}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {ALL_PAGES.map(p => {
                  const on = pages.includes(p.slug)
                  return (
                    <button
                      key={p.slug} type="button"
                      onClick={() => togglePage(p.slug)}
                      style={{
                        padding: '7px 10px', borderRadius: 8, textAlign: 'left',
                        border: `1px solid ${on ? 'var(--primary)' : 'var(--gray3)'}`,
                        background: on ? 'var(--primary-dim)' : 'transparent',
                        color: on ? 'var(--primary)' : 'var(--gray2)',
                        fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.12s',
                      }}
                    >
                      <span style={{
                        width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                        border: on ? '2px solid var(--primary)' : '1.5px solid var(--gray2)',
                        background: on ? 'var(--primary)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {on && <svg width="7" height="7" viewBox="0 0 9 9" fill="none"><path d="M1.5 4.5l2 2L7.5 2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </span>
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 4 }}>
            <button type="button" onClick={onClose} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
              background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--gray2)', cursor: 'pointer', fontFamily: 'inherit',
            }}>Cancelar</button>
            <button type="submit" disabled={saving} style={{
              padding: '8px 22px', borderRadius: 8, border: 'none',
              background: saving ? 'var(--gray3)' : 'var(--primary)',
              color: saving ? 'var(--gray2)' : '#fff',
              fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}>{saving ? 'Salvando…' : isEdit ? 'Atualizar' : 'Criar Usuário'}</button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

// ── Delete confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({ user, onConfirm, onClose }: { user: AppUser; onConfirm: () => void; onClose: () => void }) {
  return createPortal(
    <div
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}
      style={{ position: 'fixed', inset: 0, zIndex: 2100, background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
    >
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 14, padding: '24px 24px 20px', width: 360, boxShadow: '0 24px 60px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', marginBottom: 8 }}>Remover usuário?</div>
        <div style={{ fontSize: 13, color: 'var(--gray2)', lineHeight: 1.5, marginBottom: 20 }}>
          <strong style={{ color: 'var(--black)' }}>{user.name}</strong> ({user.email}) será removido permanentemente.
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'var(--white)', fontSize: 13, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button onClick={onConfirm} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#DC2626', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>Remover</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function UsersTab({ selfId }: { selfId: string }) {
  const [users,    setUsers]    = useState<AppUser[]>([])
  const [loading,  setLoading]  = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing,  setEditing]  = useState<AppUser | null>(null)
  const [deleting, setDeleting] = useState<AppUser | null>(null)

  async function load() {
    try {
      const res = await fetch('/api/users')
      if (res.ok) setUsers(await res.json() as AppUser[])
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function handleDelete(user: AppUser) {
    const res = await fetch(`/api/users/${user.id}`, { method: 'DELETE' })
    if (!res.ok) { const d = await res.json() as { error?: string }; toast.error(d.error ?? 'Erro ao remover.'); return }
    setUsers(prev => prev.filter(u => u.id !== user.id))
    setDeleting(null)
    toast.success('Usuário removido.')
  }

  function handleSaved(saved: AppUser) {
    setUsers(prev => {
      const idx = prev.findIndex(u => u.id === saved.id)
      if (idx >= 0) { const next = [...prev]; next[idx] = saved; return next }
      return [...prev, saved]
    })
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>Usuários do sistema</div>
          <div style={{ fontSize: 12, color: 'var(--gray2)', marginTop: 2 }}>Gerencie quem tem acesso e quais páginas cada um pode ver.</div>
        </div>
        <button
          onClick={() => { setEditing(null); setShowForm(true) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 100,
            background: 'var(--primary)', border: 'none', color: '#fff',
            fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 1v10M1 6h10"/></svg>
          Novo Usuário
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {[0, 1].map(i => (
            <div key={i} className="shimmer-bar" style={{ height: 60, borderRadius: 10, border: '1px solid var(--gray3)' }} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--gray2)', fontSize: 13 }}>
          Nenhum usuário cadastrado.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {users.map(u => (
            <div
              key={u.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px', borderRadius: 12,
                border: '1px solid var(--gray3)', background: 'var(--white)',
              }}
            >
              {/* Avatar */}
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: u.role === 'master' ? 'rgba(124,58,237,0.15)' : 'var(--primary-dim)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 13, fontWeight: 800,
                color: u.role === 'master' ? '#7C3AED' : 'var(--primary)',
              }}>{initials(u.name)}</div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>{u.name}</span>
                  <RoleChip role={u.role} />
                  {!u.active && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 100, background: 'rgba(220,38,38,0.1)', color: '#DC2626', textTransform: 'uppercase' }}>
                      Inativo
                    </span>
                  )}
                  {u.id === selfId && (
                    <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>(você)</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 2 }}>
                  {u.email}
                  {u.role === 'user' && u.allowed_pages.length > 0 && (
                    <span style={{ marginLeft: 8 }}>
                      {u.allowed_pages.length} página{u.allowed_pages.length !== 1 ? 's' : ''} liberada{u.allowed_pages.length !== 1 ? 's' : ''}
                    </span>
                  )}
                  {u.role === 'user' && u.allowed_pages.length === 0 && (
                    <span style={{ marginLeft: 8, color: '#DC2626' }}>Sem acesso a nenhuma página</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                <button
                  onClick={() => { setEditing(u); setShowForm(true) }}
                  style={{
                    width: 30, height: 30, borderRadius: 8, border: '1px solid var(--gray3)',
                    background: 'var(--bg)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gray2)', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
                  title="Editar"
                >
                  <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M8 2L10 4L4 10H2V8L8 2Z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                {u.id !== selfId && u.email !== PROTECTED_MASTER_EMAIL && (
                  <button
                    onClick={() => setDeleting(u)}
                    style={{
                      width: 30, height: 30, borderRadius: 8, border: '1px solid rgba(220,38,38,0.2)',
                      background: 'rgba(220,38,38,0.04)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#DC2626', transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.12)' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.04)' }}
                    title="Remover"
                  >
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M4.5 3V2h3v1M3.5 3l.6 7h3.8l.6-7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <UserFormModal
          existing={editing}
          selfId={selfId}
          onClose={() => { setShowForm(false); setEditing(null) }}
          onSaved={handleSaved}
        />
      )}
      {deleting && (
        <DeleteConfirm
          user={deleting}
          onConfirm={() => handleDelete(deleting)}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
