'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useNotificationsStore } from '@/stores/notificationsStore'
import type { Notification, Project, Lead } from '@/lib/types'

// ── Shared search input ───────────────────────────────────────────────────────

function SearchInput({
  inputRef,
  value,
  onChange,
  onEscape,
  placeholder,
}: {
  inputRef: React.RefObject<HTMLInputElement>
  value: string
  onChange: (v: string) => void
  onEscape: () => void
  placeholder: string
}) {
  return (
    <div style={{ position: 'relative' }}>
      <svg width={11} height={11} viewBox="0 0 12 12" fill="none"
        style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.4, pointerEvents: 'none' }}>
        <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth={1.4}/>
        <path d="M8.5 8.5l2 2" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
      </svg>
      <input
        ref={inputRef}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onEscape() }}
        placeholder={placeholder}
        style={{
          width: '100%', boxSizing: 'border-box',
          padding: '6px 8px 6px 28px',
          fontSize: 11, fontFamily: 'inherit',
          border: '1px solid var(--primary)', borderRadius: 7,
          background: 'var(--bg)', color: 'var(--black)',
          outline: 'none',
          boxShadow: '0 0 0 3px var(--primary-dim)',
        }}
      />
    </div>
  )
}

// ── Context picker (Projeto ou Lead) ─────────────────────────────────────────

type LinkData = { project_id: string } | { lead_id: string }

function ContextPicker({
  notif,
  onLink,
  onCancel,
}: {
  notif: Notification
  onLink: (meetingId: string, data: LinkData) => Promise<void>
  onCancel: () => void
}) {
  const [tab,      setTab]      = useState<'project' | 'lead'>('project')
  const [projects, setProjects] = useState<Project[]>([])
  const [leads,    setLeads]    = useState<Lead[]>([])
  const [selected, setSelected] = useState(notif.payload.suggested_project_id ?? '')
  const [query,    setQuery]    = useState('')
  const [open,     setOpen]     = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [hovId,    setHovId]    = useState('')
  const inputRef  = useRef<HTMLInputElement>(null)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/projects')
      .then(r => r.json())
      .then((p: Project[]) => setProjects(p.filter(x => x.status !== 'cancelled')))
      .catch(() => {})
    fetch('/api/leads')
      .then(r => r.json())
      .then((l: Lead[]) => setLeads(l.filter(x => x.funnel_stage !== 'perdido')))
      .catch(() => {})
  }, [])

  // Reset selection when tab changes
  useEffect(() => {
    setSelected(tab === 'project' ? (notif.payload.suggested_project_id ?? '') : '')
    setQuery('')
    setOpen(false)
  }, [tab, notif.payload.suggested_project_id])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      if (!pickerRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const STAGE_LABELS: Record<string, string> = {
    novo_lead:        'Novo lead',
    em_negociacao:    'Em negociação',
    proposta_enviada: 'Proposta enviada',
    fechado:          'Fechado',
  }

  const filteredProjects = projects.filter(p => {
    if (!query) return true
    const q = query.toLowerCase()
    return p.name.toLowerCase().includes(q) || (p.client?.name ?? '').toLowerCase().includes(q)
  })

  const filteredLeads = leads.filter(l => {
    if (!query) return true
    const q = query.toLowerCase()
    return (l.company ?? '').toLowerCase().includes(q) || (l.name ?? '').toLowerCase().includes(q)
  })

  const selectedProject = tab === 'project' ? (projects.find(p => p.id === selected) ?? null) : null
  const selectedLead    = tab === 'lead'    ? (leads.find(l => l.id === selected) ?? null) : null
  const isSugg = (id: string) => tab === 'project' && id === notif.payload.suggested_project_id

  const triggerLabel = tab === 'project'
    ? (selectedProject ? selectedProject.name : 'Selecionar projeto…')
    : (selectedLead ? (selectedLead.company || selectedLead.name || 'Lead') : 'Selecionar lead…')

  const triggerSublabel = tab === 'project'
    ? selectedProject?.client?.name
    : (selectedLead ? STAGE_LABELS[selectedLead.funnel_stage] : undefined)

  const hasSelection = !!selected

  const handleOpenToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (open) { setOpen(false); return }
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 30)
  }

  const handleSelect = (id: string) => {
    setSelected(id)
    setOpen(false)
    setQuery('')
  }

  const handleSave = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!selected || saving) return
    setSaving(true)
    const data: LinkData = tab === 'project'
      ? { project_id: selected }
      : { lead_id: selected }
    await onLink(notif.payload.meeting_id, data)
    setSaving(false)
  }

  const accentColor = tab === 'project' ? '#6366F1' : '#F59E0B'
  const items       = tab === 'project' ? filteredProjects : filteredLeads

  return (
    <div
      ref={pickerRef}
      onClick={e => e.stopPropagation()}
      style={{ marginTop: 10 }}
    >
      {/* Tab toggle */}
      <div style={{
        display: 'flex', gap: 4, marginBottom: 8,
        background: 'var(--bg)', borderRadius: 7, padding: 3,
        border: '1px solid var(--gray3)',
      }}>
        {(['project', 'lead'] as const).map(t => (
          <button
            key={t}
            onClick={e => { e.stopPropagation(); setTab(t) }}
            style={{
              flex: 1, padding: '3px 0', borderRadius: 5,
              border: 'none', cursor: 'pointer',
              fontSize: 10, fontWeight: 700, fontFamily: 'inherit',
              background: tab === t ? 'var(--white)' : 'transparent',
              color: tab === t ? 'var(--black)' : 'var(--gray2)',
              boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.12s',
            }}
          >
            {t === 'project' ? 'Projeto' : 'Lead'}
          </button>
        ))}
      </div>

      {/* Suggestion (projects only) */}
      {tab === 'project' && notif.payload.suggested_project_name && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          fontSize: 10, fontWeight: 700, color: '#7B5EA7',
          marginBottom: 6,
        }}>
          <svg width={9} height={9} viewBox="0 0 10 10" fill="none">
            <path d="M5 1a3 3 0 110 6A3 3 0 015 1zm0 7v1"
              stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
          </svg>
          Sugestão: {notif.payload.suggested_project_name}
        </div>
      )}

      {/* Trigger / search input */}
      <div style={{ position: 'relative' }}>
        {open ? (
          <SearchInput
            inputRef={inputRef}
            value={query}
            onChange={setQuery}
            onEscape={() => setOpen(false)}
            placeholder={tab === 'project' ? 'Buscar projeto…' : 'Buscar lead…'}
          />
        ) : (
          <div
            onClick={handleOpenToggle}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
              border: `1px solid ${hasSelection ? accentColor : 'var(--gray3)'}`,
              background: 'var(--bg)', gap: 8,
              transition: 'border-color 0.12s',
            }}
            onMouseEnter={e => { if (!hasSelection) (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray2)' }}
            onMouseLeave={e => { if (!hasSelection) (e.currentTarget as HTMLElement).style.borderColor = 'var(--gray3)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, minWidth: 0, flex: 1 }}>
              <div style={{
                width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                background: hasSelection ? accentColor : 'var(--gray3)',
              }} />
              <div style={{ minWidth: 0 }}>
                {hasSelection ? (
                  <>
                    <div style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--black)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {triggerLabel}
                    </div>
                    {triggerSublabel && (
                      <div style={{ fontSize: 10, color: 'var(--gray2)' }}>
                        {triggerSublabel}
                      </div>
                    )}
                  </>
                ) : (
                  <span style={{ fontSize: 11, color: 'var(--gray2)' }}>{triggerLabel}</span>
                )}
              </div>
            </div>
            <svg width={10} height={10} viewBox="0 0 8 8" fill="none" style={{ opacity: 0.45, flexShrink: 0 }}>
              <path d="M1 3l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        )}

        {/* Dropdown list */}
        {open && (
          <div style={{
            marginTop: 3,
            maxHeight: 150, overflowY: 'auto',
            border: '1px solid var(--gray3)', borderRadius: 7,
            background: 'var(--white)',
            scrollbarWidth: 'auto',
            boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          }}>
            {items.length === 0 ? (
              <div style={{ padding: '10px', fontSize: 11, color: 'var(--gray2)', textAlign: 'center' }}>
                {tab === 'project' ? 'Nenhum projeto encontrado' : 'Nenhum lead encontrado'}
              </div>
            ) : (
              items.map(item => {
                const isSel = item.id === selected
                const isHov = item.id === hovId
                const label    = tab === 'project'
                  ? (item as Project).name
                  : ((item as Lead).company || (item as Lead).name || 'Lead')
                const sublabel = tab === 'project'
                  ? (item as Project).client?.name
                  : STAGE_LABELS[(item as Lead).funnel_stage]
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.id)}
                    onMouseEnter={() => setHovId(item.id)}
                    onMouseLeave={() => setHovId('')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 9px', cursor: 'pointer',
                      borderBottom: '1px solid var(--gray3)',
                      background: isSel
                        ? `${accentColor}12`
                        : isHov ? 'var(--bg)' : 'transparent',
                      transition: 'background 0.1s',
                    }}
                  >
                    <div style={{
                      width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                      background: isSel ? accentColor : 'var(--gray3)',
                    }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontSize: 11, fontWeight: isSel ? 700 : 500,
                        color: isSel ? 'var(--black)' : 'var(--gray)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {label}
                      </div>
                      {sublabel && (
                        <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 1 }}>
                          {sublabel}
                        </div>
                      )}
                    </div>
                    {isSugg(item.id) && (
                      <span style={{
                        fontSize: 9, fontWeight: 800, padding: '1px 5px', borderRadius: 100,
                        background: 'rgba(123,94,167,0.1)', color: '#7B5EA7',
                        border: '1px solid rgba(123,94,167,0.2)', flexShrink: 0,
                      }}>★</span>
                    )}
                    {isSel && (
                      <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0 }}>
                        <path d="M2 5l2.5 2.5L8 3" stroke={accentColor} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
        <button
          onClick={e => { e.stopPropagation(); onCancel() }}
          style={{
            flex: 1, padding: '5px 0', borderRadius: 7,
            border: '1px solid var(--gray3)', background: 'transparent',
            fontSize: 11, fontWeight: 600, color: 'var(--gray)',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'border-color 0.12s, color 0.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gray2)'; e.currentTarget.style.color = 'var(--black)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray)' }}
        >
          Cancelar
        </button>
        <button
          onClick={handleSave}
          disabled={!selected || saving}
          style={{
            flex: 2, padding: '5px 0', borderRadius: 7,
            border: 'none',
            background: hasSelection ? accentColor : 'var(--gray3)',
            fontSize: 11, fontWeight: 700, color: '#fff',
            cursor: hasSelection && !saving ? 'pointer' : 'default',
            fontFamily: 'inherit',
            transition: 'background 0.15s, opacity 0.15s',
            opacity: saving ? 0.7 : 1,
          }}
          onMouseEnter={e => { if (hasSelection && !saving) e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { if (hasSelection && !saving) e.currentTarget.style.opacity = '1' }}
        >
          {saving ? 'Vinculando…' : tab === 'project' ? 'Vincular projeto' : 'Vincular lead'}
        </button>
      </div>
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
  onLink: (meetingId: string, data: LinkData) => Promise<void>
  onRead: (id: string) => void
}) {
  const [linking, setLinking] = useState(false)
  const [hov,     setHov]     = useState(false)

  const fmtDate = (iso?: string) => {
    if (!iso) return ''
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    })
  }

  const isLinked = notif.type === 'linked_meeting'
  const dotColor = notif.read ? 'transparent' : isLinked ? '#059669' : '#6366F1'

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: linking ? '12px 14px 14px' : '10px 14px',
        borderBottom: '1px solid var(--gray3)',
        background: linking
          ? 'rgba(99,102,241,0.05)'
          : hov
            ? 'var(--bg)'
            : notif.read ? 'transparent' : isLinked ? 'rgba(5,150,105,0.03)' : 'rgba(99,102,241,0.03)',
        transition: 'background 0.12s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Unread dot */}
        <div style={{
          width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 5,
          background: dotColor,
          transition: 'background 0.2s',
        }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Title */}
          <div style={{
            fontSize: 12, fontWeight: 700, color: 'var(--black)', marginBottom: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {notif.payload.title}
          </div>

          {/* Date + status */}
          <div style={{ fontSize: 11, color: 'var(--gray2)', display: 'flex', alignItems: 'center', gap: 5 }}>
            {fmtDate(notif.payload.date)}
            <span style={{ opacity: 0.4 }}>·</span>
            {isLinked ? (
              <span style={{ color: '#059669', fontWeight: 600 }}>
                Vinculado a <strong>{notif.payload.project_name}</strong>
              </span>
            ) : (
              <span style={{ color: '#F59E0B', fontWeight: 600 }}>Aguardando vinculação</span>
            )}
          </div>

          {/* Vincular picker / button — só para unlinked_meeting */}
          {!notif.read && !isLinked && (
            linking ? (
              <ContextPicker
                notif={notif}
                onLink={async (mId, data) => { await onLink(mId, data); setLinking(false) }}
                onCancel={() => setLinking(false)}
              />
            ) : (
              <button
                onClick={e => { e.stopPropagation(); setLinking(true) }}
                style={{
                  marginTop: 7, padding: '3px 11px',
                  fontSize: 11, fontWeight: 700,
                  border: '1px solid #6366F1', borderRadius: 6,
                  background: 'transparent', color: '#6366F1',
                  cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.color = '#fff' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6366F1' }}
              >
                Vincular projeto
              </button>
            )
          )}
        </div>

        {/* Dismiss button */}
        {!notif.read && !linking && (
          <button
            onClick={e => { e.stopPropagation(); onRead(notif.id) }}
            title="Dispensar"
            style={{
              width: 20, height: 20, borderRadius: 5, border: 'none',
              background: hov ? 'var(--gray3)' : 'transparent',
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gray2)', flexShrink: 0,
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#fee2e2'
              e.currentTarget.style.color = '#ef4444'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = hov ? 'var(--gray3)' : 'transparent'
              e.currentTarget.style.color = 'var(--gray2)'
            }}
          >
            <svg width={8} height={8} viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
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
  const [hov,     setHov]     = useState(false)
  const btnRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])

  // Fetch on mount + poll every 60s
  useEffect(() => { fetchNotifs() }, [fetchNotifs])
  useEffect(() => {
    const t = setInterval(() => fetchNotifs(), 60_000)
    return () => clearInterval(t)
  }, [fetchNotifs])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => {
      const target = e.target as Node
      if (btnRef.current?.contains(target)) return
      const panel = document.querySelector('[data-notif-panel]')
      if (panel?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const handleOpen = () => {
    if (open) { setOpen(false); return }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      setRect({ top: r.bottom + 8, left: Math.max(8, r.right - 320) })
    }
    setOpen(true)
  }

  const handleLink = async (meetingId: string, data: LinkData) => {
    await window.fetch(`/api/meetings/${meetingId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    fetchNotifs()
  }

  const unread = notifications.filter(n => !n.read)

  const panel = mounted && open && rect ? createPortal(
    <div
      data-notif-panel=""
      style={{
        position: 'fixed',
        top:      rect.top,
        left:     rect.left,
        width:    320,
        maxHeight: 480,
        zIndex:   99999,
        background: 'var(--white)',
        border:     '1px solid var(--gray3)',
        borderRadius: 14,
        boxShadow:  '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
        display:    'flex',
        flexDirection: 'column',
        overflow:   'hidden',
        animation:  'panelUp 0.18s ease both',
      }}
    >
      {/* Header */}
      <div style={{
        padding: '11px 14px 10px',
        borderBottom: '1px solid var(--gray3)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--white)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)' }}>Notificações</span>
          {unreadCount > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 800,
              padding: '1px 7px', borderRadius: 100,
              background: 'rgba(99,102,241,0.1)', color: '#6366F1',
              border: '1px solid rgba(99,102,241,0.2)',
            }}>
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllRead()}
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--gray2)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '3px 7px', borderRadius: 6, fontFamily: 'inherit',
              transition: 'background 0.12s, color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--gray2)' }}
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {/* List */}
      <div style={{ overflowY: 'auto', flex: 1, scrollbarWidth: 'auto' }}>
        {unread.length === 0 ? (
          <div style={{
            padding: '36px 20px', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
          }}>
            <svg width={28} height={28} viewBox="0 0 24 24" fill="none" style={{ opacity: 0.25 }}>
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"
                stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <span style={{ fontSize: 12, color: 'var(--gray2)', fontWeight: 500 }}>
              Nenhuma notificação pendente
            </span>
          </div>
        ) : (
          unread.map(n => (
            <NotifItem
              key={n.id}
              notif={n}
              onLink={async (mId, data) => { await handleLink(mId, data); markRead(n.id) }}
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
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          position: 'relative',
          width: 32, height: 32, borderRadius: 8,
          border: `1px solid ${open ? 'var(--primary)' : hov ? 'var(--gray2)' : 'var(--gray3)'}`,
          background: open ? 'var(--primary-dim)' : hov ? 'var(--bg)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? 'var(--primary-text)' : hov ? 'var(--black)' : 'var(--gray)',
          transition: 'all 0.15s',
        }}
      >
        <svg width={15} height={15} viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 1a5 5 0 0 1 5 5v2.5l1.5 2.5H1.5L3 8.5V6a5 5 0 0 1 5-5Z"/>
          <path d="M6.5 13a1.5 1.5 0 0 0 3 0"/>
        </svg>
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            minWidth: 16, height: 16, borderRadius: 100,
            background: '#E53935', color: '#fff',
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
