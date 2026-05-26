'use client'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { Meeting, LeadFile } from '@/lib/types'

interface Props {
  leadId: string
  leadColor?: string
}

const DEFAULT_COLOR = '#6366F1'

function fmtDate(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function fmtDateShort(iso?: string) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDuration(min?: number) {
  if (!min) return ''
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60 > 0 ? `${min % 60}min` : ''}`.trim()
}

// ── Markdown preview ──────────────────────────────────────────────────────────

function MarkdownPreview({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0
  const inline = (s: string) => s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

  while (i < lines.length) {
    const line = lines[i]
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: 18, fontWeight: 900, color: 'var(--black)', margin: '0 0 4px', lineHeight: 1.3 }} dangerouslySetInnerHTML={{ __html: inline(line.slice(2)) }} />)
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 8px', paddingBottom: 5, borderBottom: '1.5px solid var(--gray3)' }} dangerouslySetInnerHTML={{ __html: inline(line.slice(3)) }} />)
    } else if (line.trim() === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--gray3)', margin: '16px 0' }} />)
    } else if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) { tableLines.push(lines[i]); i++ }
      const rows = tableLines.filter(l => !l.match(/^\|[\s-|]+\|$/))
      elements.push(
        <table key={`tbl-${i}`} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '8px 0' }}>
          <tbody>
            {rows.map((r, ri) => {
              const cells = r.split('|').filter((_, ci) => ci > 0 && ci < r.split('|').length - 1)
              return (
                <tr key={ri} style={{ background: ri === 0 ? 'var(--bg)' : ri % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                  {cells.map((cell, ci) => (
                    <td key={ci} style={{ padding: '6px 10px', border: '1px solid var(--gray3)', fontWeight: ri === 0 ? 700 : 400, color: ri === 0 ? 'var(--black)' : 'var(--gray)', verticalAlign: 'top' }} dangerouslySetInnerHTML={{ __html: inline(cell.trim()) }} />
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      )
      continue
    } else if (line.match(/^[-*]\s+/) || line.match(/^  [-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && (lines[i].match(/^[-*]\s+/) || lines[i].match(/^  [-*]\s+/))) { items.push(lines[i].replace(/^[\s]*[-*]\s+/, '')); i++ }
      elements.push(<ul key={`ul-${i}`} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>{items.map((it, ii) => <li key={ii} style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.65, marginBottom: 3 }} dangerouslySetInnerHTML={{ __html: inline(it) }} />)}</ul>)
      continue
    } else if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
      elements.push(<p key={i} style={{ fontSize: 11, color: 'var(--gray2)', fontStyle: 'italic', margin: '8px 0 0' }} dangerouslySetInnerHTML={{ __html: line.slice(1, -1) }} />)
    } else if (line.trim()) {
      elements.push(<p key={i} style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.65, margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: inline(line) }} />)
    } else {
      elements.push(<div key={i} style={{ height: 4 }} />)
    }
    i++
  }
  return <div>{elements}</div>
}

// ── Modal de Ata ──────────────────────────────────────────────────────────────

function AtaModal({
  meeting,
  leadId,
  color,
  onClose,
  onSaved,
}: {
  meeting: Meeting
  leadId: string
  color: string
  onClose: () => void
  onSaved: () => void
}) {
  const [status,  setStatus]  = useState<'generating' | 'preview' | 'saving' | 'saved' | 'error'>('generating')
  const [ataText, setAtaText] = useState('')
  const [errMsg,  setErrMsg]  = useState('')
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    fetch(`/api/meetings/${meeting.id}/generate-ata`, { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.error) { setErrMsg(data.error); setStatus('error'); return }
        setAtaText(data.ata); setStatus('preview')
      })
      .catch(e => { setErrMsg(String(e)); setStatus('error') })
  }, [meeting.id])

  const handleSave = async () => {
    setStatus('saving')
    const dateStr = meeting.date ? fmtDateShort(meeting.date) : 'sem data'
    const filename = `Ata — ${meeting.title} (${dateStr}).md`
    const res = await fetch(`/api/leads/${leadId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        mime_type: 'text/markdown',
        size: new Blob([ataText]).size,
        text_content: ataText,
      }),
    })
    if (res.ok) { setStatus('saved'); onSaved() }
    else { setErrMsg('Erro ao salvar na base de conhecimento.'); setStatus('error') }
  }

  if (!mounted) return null

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99998, background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, animation: 'fadeIn 0.15s ease both' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', background: 'var(--white)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'panelUp 0.2s ease both' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: color + '18', border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
              <svg width={15} height={15} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
                <path d="M4 6h8M4 9h8M4 12h4"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)' }}>Ata de Reunião</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1 }}>{meeting.title}</div>
            </div>
          </div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)' }}>
            <svg width={10} height={10} viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollbarWidth: 'thin' }}>
          {status === 'generating' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 20px' }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', border: `3px solid ${color}30`, borderTop: `3px solid ${color}`, animation: 'spin 0.8s linear infinite' }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>Gerando ata…</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)', textAlign: 'center', maxWidth: 320 }}>O Claude está analisando a reunião e estruturando a ata.</div>
            </div>
          )}
          {status === 'error' && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>Erro ao gerar ata</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)' }}>{errMsg}</div>
            </div>
          )}
          {status === 'saved' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 20px' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#dcfce7', border: '2px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width={22} height={22} viewBox="0 0 22 22" fill="none"><path d="M4 11l5 5L18 6" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>Ata salva na base de conhecimento!</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)', textAlign: 'center', maxWidth: 340 }}>O arquivo foi adicionado ao lead e já está disponível como contexto para os especialistas.</div>
            </div>
          )}
          {(status === 'preview' || status === 'saving') && <MarkdownPreview text={ataText} />}
        </div>

        {/* Footer */}
        {(status === 'preview' || status === 'saving' || status === 'saved') && (
          <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray3)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
            {status === 'saved' ? (
              <button onClick={onClose} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
            ) : (
              <>
                <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', fontSize: 12, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer', fontFamily: 'inherit' }}>Fechar</button>
                <button
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: status === 'saving' ? 'default' : 'pointer', fontFamily: 'inherit', opacity: status === 'saving' ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 7 }}
                >
                  {status === 'saving' ? (
                    <><div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', animation: 'spin 0.7s linear infinite' }} />Salvando…</>
                  ) : (
                    <><svg width={12} height={12} viewBox="0 0 14 14" fill="none"><path d="M2 2h8l2 2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2Z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/><path d="M5 2v4h4V2M4 9h6" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/></svg>Salvar na base de conhecimento</>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>,
    document.body,
  )
}

// ── Modal de nova reunião manual ──────────────────────────────────────────────

function NewMeetingModal({
  leadId,
  color,
  onClose,
  onCreated,
}: {
  leadId: string
  color: string
  onClose: () => void
  onCreated: (m: Meeting) => void
}) {
  const [title,      setTitle]      = useState('')
  const [date,       setDate]       = useState('')
  const [notes,      setNotes]      = useState('')
  const [transcript, setTranscript] = useState('')
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')
  const [mounted,    setMounted]    = useState(false)

  useEffect(() => { setMounted(true) }, [])

  const handleSubmit = async () => {
    if (!title.trim()) { setErr('Título é obrigatório.'); return }
    setSaving(true); setErr('')
    try {
      const res = await fetch(`/api/leads/${leadId}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), date: date || undefined, notes: notes || undefined, transcript: transcript || undefined }),
      })
      const data = await res.json()
      if (!res.ok) { setErr(data.error || 'Erro ao criar reunião.'); setSaving(false); return }
      onCreated(data as Meeting)
    } catch (e) {
      setErr(String(e)); setSaving(false)
    }
  }

  if (!mounted) return null

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '8px 12px', fontSize: 12, fontFamily: 'inherit',
    border: '1px solid var(--gray3)', borderRadius: 8,
    background: 'var(--white)', color: 'var(--black)',
    outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  return createPortal(
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ width: '100%', maxWidth: 520, background: 'var(--white)', borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden', animation: 'panelUp 0.2s ease both' }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)' }}>Nova Reunião</div>
          <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)' }}>
            <svg width={10} height={10} viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Título *</label>
            <input
              value={title} onChange={e => setTitle(e.target.value)}
              placeholder="Ex: Reunião de alinhamento inicial"
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}22` }}
              onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Data e Hora</label>
            <input
              type="datetime-local" value={date} onChange={e => setDate(e.target.value)}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}22` }}
              onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Resumo / Notas</label>
            <textarea
              value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Principais pontos discutidos, contexto, observações…"
              rows={3}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}22` }}
              onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          <div>
            <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 5 }}>Transcrição (opcional)</label>
            <textarea
              value={transcript} onChange={e => setTranscript(e.target.value)}
              placeholder="Cole aqui a transcrição da reunião caso disponível…"
              rows={4}
              style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}22` }}
              onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
            />
          </div>

          {err && <div style={{ fontSize: 12, color: '#dc2626', padding: '8px 12px', background: '#fef2f2', borderRadius: 8, border: '1px solid #fecaca' }}>{err}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid var(--gray3)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', fontSize: 12, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: saving ? 'default' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            {saving ? <><div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', animation: 'spin 0.7s linear infinite' }} />Salvando…</> : 'Salvar Reunião'}
          </button>
        </div>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>,
    document.body,
  )
}

// ── Card de reunião ───────────────────────────────────────────────────────────

function MeetingCard({
  meeting,
  leadId,
  color,
  onAtaSaved,
}: {
  meeting: Meeting
  leadId: string
  color: string
  onAtaSaved: () => void
}) {
  const [expanded,     setExpanded]  = useState(false)
  const [showTranscript, setShowTrans] = useState(false)
  const [showAta,      setShowAta]   = useState(false)

  return (
    <>
      <div style={{ border: '1px solid var(--gray3)', borderRadius: 10, overflow: 'hidden', background: 'var(--white)' }}>
        <div onClick={() => setExpanded(e => !e)} style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', background: expanded ? 'var(--bg)' : 'transparent', transition: 'background 0.15s' }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: color + '18', border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="1" width="6" height="9" rx="3"/>
              <path d="M2 8a6 6 0 0012 0"/>
              <line x1="8" y1="14" x2="8" y2="16"/>
              <line x1="5" y1="16" x2="11" y2="16"/>
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{meeting.title}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--gray2)' }}>{fmtDate(meeting.date)}</span>
              {meeting.duration != null && meeting.duration > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '15', padding: '1px 7px', borderRadius: 100 }}>{fmtDuration(meeting.duration)}</span>
              )}
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); setShowAta(true) }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6, flexShrink: 0, border: `1px solid ${color}50`, background: color + '10', fontSize: 10, fontWeight: 700, color, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.12s, border-color 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = color + '20'; e.currentTarget.style.borderColor = color + '90' }}
            onMouseLeave={e => { e.currentTarget.style.background = color + '10'; e.currentTarget.style.borderColor = color + '50' }}
          >
            <svg width={10} height={10} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
              <path d="M4 6h6M4 9h6M4 12h3"/>
            </svg>
            Gerar Ata
          </button>

          <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 2, opacity: 0.4, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {expanded && (
          <div style={{ borderTop: '1px solid var(--gray3)', padding: '14px' }}>
            {meeting.summary && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>Resumo / Notas</div>
                <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.65, margin: 0 }}>{meeting.summary}</p>
              </div>
            )}

            {meeting.transcript && (
              <div>
                <button
                  onClick={() => setShowTrans(t => !t)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, color, padding: '4px 0', marginBottom: showTranscript ? 8 : 0 }}
                >
                  <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ transform: showTranscript ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição'}
                </button>
                {showTranscript && (
                  <div style={{ maxHeight: 240, overflowY: 'auto', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--gray3)', padding: '10px 12px', fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>
                    {meeting.transcript}
                  </div>
                )}
              </div>
            )}

            {!meeting.summary && !meeting.transcript && (
              <div style={{ fontSize: 12, color: 'var(--gray2)', fontStyle: 'italic' }}>Nenhum conteúdo adicional registrado.</div>
            )}
          </div>
        )}
      </div>

      {showAta && (
        <AtaModal
          meeting={meeting}
          leadId={leadId}
          color={color}
          onClose={() => setShowAta(false)}
          onSaved={onAtaSaved}
        />
      )}
    </>
  )
}

// ── Base de Conhecimento ──────────────────────────────────────────────────────

function KnowledgeBase({
  leadId,
  color,
  refresh,
}: {
  leadId: string
  color: string
  refresh: number
}) {
  const [files,   setFiles]   = useState<LeadFile[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/leads/${leadId}/files`)
      .then(r => r.json())
      .then((data: LeadFile[]) => { setFiles(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [leadId, refresh])

  const handleDelete = async (fileId: string) => {
    await fetch(`/api/leads/${leadId}/files/${fileId}`, { method: 'DELETE' })
    setFiles(prev => prev.filter(f => f.id !== fileId))
  }

  if (loading) return (
    <div style={{ padding: '10px 0', fontSize: 12, color: 'var(--gray2)' }}>Carregando base de conhecimento…</div>
  )

  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 2h5l1 2h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1Z"/>
        </svg>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Base de Conhecimento</span>
        {files.length > 0 && (
          <span style={{ fontSize: 10, fontWeight: 700, color, background: color + '15', padding: '1px 7px', borderRadius: 100 }}>{files.length}</span>
        )}
      </div>

      {files.length === 0 ? (
        <div style={{ padding: '16px', background: 'var(--bg)', borderRadius: 10, border: '1px dashed var(--gray3)', textAlign: 'center' }}>
          <div style={{ fontSize: 12, color: 'var(--gray2)' }}>Nenhuma ata salva ainda.</div>
          <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 3 }}>Gere uma ata e salve-a para que os especialistas tenham contexto sobre este lead.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {files.map(f => (
            <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', background: 'var(--bg)', borderRadius: 8, border: '1px solid var(--gray3)' }}>
              <svg width={13} height={13} viewBox="0 0 16 16" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
                <path d="M4 6h8M4 9h8M4 12h4"/>
              </svg>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.filename}</div>
                <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 1 }}>{fmtDateShort(f.created_at)} · {(f.size / 1024).toFixed(1)} KB</div>
              </div>
              <button
                onClick={() => handleDelete(f.id)}
                title="Excluir arquivo"
                style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', flexShrink: 0 }}
                onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.borderColor = '#fecaca'; e.currentTarget.style.color = '#dc2626' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
              >
                <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
                  <path d="M2 3h8M5 3V2h2v1M4 3v6.5a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5V3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Tab principal ─────────────────────────────────────────────────────────────

export function LeadMeetingsTab({ leadId, leadColor }: Props) {
  const color = leadColor || DEFAULT_COLOR
  const [meetings,     setMeetings]     = useState<Meeting[]>([])
  const [loading,      setLoading]      = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [query,        setQuery]        = useState('')
  const [kbRefresh,    setKbRefresh]    = useState(0)

  const load = () => {
    setLoading(true)
    fetch(`/api/meetings?lead_id=${leadId}`)
      .then(r => r.json())
      .then((data: Meeting[]) => { setMeetings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [leadId]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleCreated = (m: Meeting) => {
    setMeetings(prev => [m, ...prev])
    setShowNewModal(false)
  }

  const filtered = query.trim()
    ? meetings.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
    : meetings

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

      {/* Barra de ações */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        {/* Busca */}
        <div style={{ position: 'relative', flex: 1 }}>
          <svg width={13} height={13} viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth={1.5}/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
          </svg>
          <input
            value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar reunião…"
            style={{ width: '100%', boxSizing: 'border-box', padding: '7px 28px 7px 28px', fontSize: 12, fontFamily: 'inherit', border: '1px solid var(--gray3)', borderRadius: 8, background: 'var(--bg)', color: 'var(--black)', outline: 'none' }}
            onFocus={e => { e.target.style.borderColor = color; e.target.style.boxShadow = `0 0 0 3px ${color}22` }}
            onBlur={e => { e.target.style.borderColor = 'var(--gray3)'; e.target.style.boxShadow = 'none' }}
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 7, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: 4, border: 'none', background: 'var(--gray3)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray)', padding: 0 }}>
              <svg width={7} height={7} viewBox="0 0 9 9" fill="none"><path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/></svg>
            </button>
          )}
        </div>

        {/* Botão nova reunião */}
        <button
          onClick={() => setShowNewModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.88' }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
        >
          <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
          </svg>
          Nova Reunião
        </button>
      </div>

      {/* Lista de reuniões */}
      {loading ? (
        <div style={{ padding: '24px 0', textAlign: 'center', fontSize: 12, color: 'var(--gray2)' }}>Carregando reuniões…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          {query ? (
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray2)' }}>Nenhuma reunião encontrada para &quot;{query}&quot;</div>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>🎙️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', marginBottom: 4 }}>Nenhuma reunião registrada</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)' }}>Clique em &quot;+ Nova Reunião&quot; para registrar.</div>
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map(m => (
            <MeetingCard
              key={m.id}
              meeting={m}
              leadId={leadId}
              color={color}
              onAtaSaved={() => setKbRefresh(n => n + 1)}
            />
          ))}
        </div>
      )}

      {/* Base de Conhecimento */}
      <KnowledgeBase leadId={leadId} color={color} refresh={kbRefresh} />

      {/* Modal nova reunião */}
      {showNewModal && (
        <NewMeetingModal
          leadId={leadId}
          color={color}
          onClose={() => setShowNewModal(false)}
          onCreated={handleCreated}
        />
      )}
    </div>
  )
}
