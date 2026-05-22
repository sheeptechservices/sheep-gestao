'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNotificationsStore } from '@/stores/notificationsStore'
import type { Notification, Project } from '@/lib/types'

// ── Seletor de projeto inline ─────────────────────────────────────────────────

function ProjectSelector({
  notif,
  onLink,
}: {
  notif: Notification
  onLink: (meetingId: string, projectId: string) => Promise<void>
}) {
  const [projects, setProjects]   = useState<Project[]>([])
  const [loading,  setLoading]    = useState(false)
  const [selected, setSelected]   = useState('')
  const [saving,   setSaving]     = useState(false)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((p: Project[]) => setProjects(p.filter(x => x.status !== 'cancelled')))
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    await onLink(notif.payload.meeting_id, selected)
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', gap: 6, marginTop: 8 }} onClick={e => e.stopPropagation()}>
      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{
          flex: 1, fontSize: 11, fontWeight: 600,
          border: '1px solid var(--gray3)', borderRadius: 6,
          padding: '4px 8px', background: 'var(--bg)',
          color: 'var(--black)', fontFamily: 'inherit',
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        <option value="">Selecionar projeto…</option>
        {projects.map(p => (
          <option key={p.id} value={p.id}>{p.name}{p.client?.name ? ` — ${p.client.name}` : ''}</option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={!selected || saving}
        style={{
          padding: '4px 10px', borderRadius: 6, border: 'none',
          background: selected ? 'var(--primary)' : 'var(--gray3)',
          color: '#fff', fontSize: 11, fontWeight: 700,
          cursor: selected && !saving ? 'pointer' : 'default',
          transition: 'background 0.15s',
        }}
      >
        {saving ? '…' : 'Vincular'}
      </button>
    </div>
  )
}

// ── Item de notificação ───────────────────────────────────────────────────────

function NotifItem({
  notif,
  onLink,
  onRead,
}: {
  notif: Notification
  onLink: (meetingId: string, projectId: string) => Promise<void>
  onRead: (id: string) => void
}) {
  const [linking, setLinking] = useState(false)

  const fmtDate = (iso?: string) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div style={{
      padding: '10px 14px',
      borderBottom: '1px solid var(--gray3)',
      background: notif.read ? 'transparent' : 'rgba(99,102,241,0.04)',
    }}>
      {/* Linha de título */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Dot de não-lido */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4,
          background: notif.read ? 'transparent' : '#6366F1',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', marginBottom: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {notif.payload.title}
          </div>
          <div style={{ fontSize: 11, color: 'var(--gray2)' }}>
            {fmtDate(notif.payload.date)} · Sem projeto vinculado
          </div>

          {/* Botão vincular / form */}
          {!notif.read && (
            linking
              ? <ProjectSelector notif={notif} onLink={async (mId, pId) => {
                  await onLink(mId, pId)
                  setLinking(false)
                }} />
              : <button
                  onClick={e => { e.stopPropagation(); setLinking(true) }}
                  style={{
                    marginTop: 6, padding: '3px 10px',
                    fontSize: 11, fontWeight: 700,
                    border: '1px solid #6366F1', borderRadius: 6,
                    background: 'transparent', color: '#6366F1',
                    cursor: 'pointer',
                  }}
                >
                  Vincular projeto
                </button>
          )}
        </div>

        {/* Fechar */}
        {!notif.read && (
          <button
            onClick={e => { e.stopPropagation(); onRead(notif.id) }}
            title="Dispensar"
            style={{
              width: 18, height: 18, borderRadius: 4, border: 'none',
              background: 'transparent', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gray2)', flexShrink: 0,
            }}
          >
            <svg width={9} height={9} viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}

// ── Bell principal ────────────────────────────────────────────────────────────

export function NotificationBell() {
  const { notifications, unreadCount, fetch: fetchNotifs, markRead, markAllRead } = useNotificationsStore()
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)
  const [rect,    setRect]    = useState<{ top: number; left: number } | null>(null)
  const btnRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Fetch on mount
  useEffect(() => { fetchNotifs() }, [fetchNotifs])

  // Poll a cada 60s para reuniões novas
  useEffect(() => {
    const t = setInterval(() => fetchNotifs(), 60_000)
    return () => clearInterval(t)
  }, [fetchNotifs])

  // Fechar ao clicar fora
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (btnRef.current && !btnRef.current.closest('[data-notif-panel]')?.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleOpen = () => {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 8, left: Math.max(8, r.right - 280) })
    }
    setOpen(true)
  }

  const handleLink = async (meetingId: string, projectId: string) => {
    await window.fetch(`/api/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId }),
    })
    fetchNotifs()
  }

  const panel = mounted && open && rect ? createPortal(
    <div
      data-notif-panel=""
      style={{
        position: 'fixed',
        top:      rect.top,
        left:     rect.left,
        width:    280,
        maxHeight: 440,
        zIndex:   99999,
        background: 'var(--white)',
        border:     '1px solid var(--gray3)',
        borderRadius: 12,
        boxShadow:  '0 8px 32px rgba(0,0,0,0.16)',
        display:    'flex',
        flexDirection: 'column',
        overflow:   'hidden',
        animation:  'panelUp 0.18s ease both',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '10px 14px 8px',
        borderBottom: '1px solid var(--gray3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)' }}>
          Notificações {unreadCount > 0 && <span style={{ color: '#6366F1' }}>({unreadCount})</span>}
        </span>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            style={{
              fontSize: 11, fontWeight: 700, color: 'var(--gray2)',
              background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* Lista */}
      <div style={{ overflowY: 'auto', flex: 1 }}>
        {notifications.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', fontSize: 12, color: 'var(--gray2)' }}>
            Nenhuma notificação
          </div>
        ) : (
          notifications.map(n => (
            <NotifItem
              key={n.id}
              notif={n}
              onLink={async (mId, pId) => { await handleLink(mId, pId); markRead(n.id) }}
              onRead={markRead}
            />
          ))
        )}
      </div>
    </div>,
    document.body,
  ) : null

  return (
    <>
      <button
        ref={btnRef}
        onClick={handleOpen}
        title="Notificações"
        style={{
          position: 'relative',
          width: 32, height: 32, borderRadius: 8,
          border: `1px solid ${open ? 'var(--primary)' : 'var(--gray3)'}`,
          background: open ? 'var(--primary-dim)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--primary-text)' : 'var(--gray)',
          transition: 'all 0.15s',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' } }}
      >
        <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1a5 5 0 0 1 5 5v2.5l1.5 2.5H1.5L3 8.5V6a5 5 0 0 1 5-5Z"/>
          <path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 100,
            background: '#6366F1', color: '#fff',
            fontSize: 9, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 3px',
            border: '2px solid var(--white)',
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {panel}
    </>
  )
}
