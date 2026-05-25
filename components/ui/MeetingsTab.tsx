'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Meeting } from '@/lib/types'

interface Props {
  projectId: string
  projectColor: string
}

function fmtDate(iso?: string) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function fmtDuration(min?: number) {
  if (!min) return ''
  if (min < 60) return `${min} min`
  return `${Math.floor(min / 60)}h ${min % 60 > 0 ? `${min % 60}min` : ''}`.trim()
}

// ── Renderizador simples de Markdown para preview da ata ──────────────────────

function MarkdownPreview({ text }: { text: string }) {
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  const inlineFormat = (s: string) => {
    // bold **text**
    return s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  }

  while (i < lines.length) {
    const line = lines[i]

    // H1
    if (line.startsWith('# ')) {
      elements.push(<h1 key={i} style={{ fontSize: 18, fontWeight: 900, color: 'var(--black)', margin: '0 0 4px', lineHeight: 1.3 }} dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }} />)
    }
    // H2
    else if (line.startsWith('## ')) {
      elements.push(<h2 key={i} style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '20px 0 8px', paddingBottom: 5, borderBottom: '1.5px solid var(--gray3)' }} dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(3)) }} />)
    }
    // Horizontal rule
    else if (line.trim() === '---') {
      elements.push(<hr key={i} style={{ border: 'none', borderTop: '1px solid var(--gray3)', margin: '16px 0' }} />)
    }
    // Table
    else if (line.trim().startsWith('|')) {
      const tableLines: string[] = []
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i])
        i++
      }
      const rows = tableLines.filter(l => !l.match(/^\|[\s-|]+\|$/))
      elements.push(
        <table key={`table-${i}`} style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, margin: '8px 0' }}>
          <tbody>
            {rows.map((r, ri) => {
              const cells = r.split('|').filter((_, ci) => ci > 0 && ci < r.split('|').length - 1)
              const isHeader = ri === 0
              return (
                <tr key={ri} style={{ background: isHeader ? 'var(--bg)' : ri % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.015)' }}>
                  {cells.map((cell, ci) => (
                    <td key={ci} style={{
                      padding: '6px 10px',
                      border: '1px solid var(--gray3)',
                      fontWeight: isHeader ? 700 : 400,
                      color: isHeader ? 'var(--black)' : 'var(--gray)',
                      verticalAlign: 'top',
                    }} dangerouslySetInnerHTML={{ __html: inlineFormat(cell.trim()) }} />
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      )
      continue
    }
    // Bullet list
    else if (line.match(/^[-*]\s+/) || line.match(/^  [-*]\s+/)) {
      const items: string[] = []
      while (i < lines.length && (lines[i].match(/^[-*]\s+/) || lines[i].match(/^  [-*]\s+/))) {
        items.push(lines[i].replace(/^[\s]*[-*]\s+/, ''))
        i++
      }
      elements.push(
        <ul key={`ul-${i}`} style={{ margin: '4px 0 8px', paddingLeft: 18 }}>
          {items.map((item, ii) => (
            <li key={ii} style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.65, marginBottom: 3 }}
              dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
          ))}
        </ul>
      )
      continue
    }
    // Italic *text*
    else if (line.startsWith('*') && line.endsWith('*') && line.length > 2) {
      elements.push(<p key={i} style={{ fontSize: 11, color: 'var(--gray2)', fontStyle: 'italic', margin: '8px 0 0' }} dangerouslySetInnerHTML={{ __html: line.slice(1, -1) }} />)
    }
    // Normal paragraph
    else if (line.trim()) {
      elements.push(<p key={i} style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.65, margin: '4px 0' }} dangerouslySetInnerHTML={{ __html: inlineFormat(line) }} />)
    }
    // Empty line → small gap
    else {
      elements.push(<div key={i} style={{ height: 4 }} />)
    }
    i++
  }

  return <div>{elements}</div>
}

// ── Modal de preview da Ata ───────────────────────────────────────────────────

function AtaModal({
  meeting,
  projectId,
  projectColor,
  onClose,
}: {
  meeting: Meeting
  projectId: string
  projectColor: string
  onClose: () => void
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
        setAtaText(data.ata)
        setStatus('preview')
      })
      .catch(e => { setErrMsg(String(e)); setStatus('error') })
  }, [meeting.id])

  const handleSave = async () => {
    setStatus('saving')
    const dateStr = meeting.date
      ? new Date(meeting.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
      : 'sem data'
    const filename = `Ata — ${meeting.title} (${dateStr}).md`
    const res = await fetch(`/api/projects/${projectId}/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename,
        mime_type: 'text/markdown',
        size: new Blob([ataText]).size,
        text_content: ataText,
      }),
    })
    if (res.ok) {
      setStatus('saved')
    } else {
      setErrMsg('Erro ao salvar na base de conhecimento.')
      setStatus('error')
    }
  }

  if (!mounted) return null

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99998,
      background: 'rgba(18,19,22,0.4)',
      backdropFilter: 'blur(3px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
      animation: 'fadeIn 0.15s ease both',
    }}
    onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        width: '100%', maxWidth: 680,
        maxHeight: '90vh',
        background: 'var(--white)',
        borderRadius: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: 'panelUp 0.2s ease both',
      }}>
        {/* Header */}
        <div style={{
          padding: '16px 20px',
          borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: projectColor + '18', border: `1px solid ${projectColor}35`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: projectColor, flexShrink: 0,
            }}>
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
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: 7, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            <svg width={10} height={10} viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', scrollbarWidth: 'thin' }}>

          {/* Gerando */}
          {status === 'generating' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '48px 20px' }}>
              <div style={{
                width: 44, height: 44, borderRadius: '50%',
                border: `3px solid ${projectColor}30`,
                borderTop: `3px solid ${projectColor}`,
                animation: 'spin 0.8s linear infinite',
              }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>Gerando ata…</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)', textAlign: 'center', maxWidth: 320 }}>
                O Claude está analisando a transcrição e estruturando a ata no formato padrão Sheep Tech.
              </div>
            </div>
          )}

          {/* Erro */}
          {status === 'error' && (
            <div style={{ padding: '32px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 24, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>Erro ao gerar ata</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)' }}>{errMsg}</div>
            </div>
          )}

          {/* Salvo */}
          {status === 'saved' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '48px 20px' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: '#dcfce7', border: '2px solid #86efac',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width={22} height={22} viewBox="0 0 22 22" fill="none">
                  <path d="M4 11l5 5L18 6" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>Ata salva na base de conhecimento!</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)', textAlign: 'center', maxWidth: 340 }}>
                O arquivo foi adicionado ao projeto e já está disponível como contexto para os agentes.
              </div>
            </div>
          )}

          {/* Preview */}
          {(status === 'preview' || status === 'saving') && (
            <MarkdownPreview text={ataText} />
          )}
        </div>

        {/* Footer */}
        {(status === 'preview' || status === 'saving' || status === 'saved') && (
          <div style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--gray3)',
            display: 'flex', gap: 10, justifyContent: 'flex-end',
            flexShrink: 0, background: 'var(--white)',
          }}>
            {status === 'saved' ? (
              <button
                onClick={onClose}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: projectColor, color: '#fff',
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Fechar
              </button>
            ) : (
              <>
                <button
                  onClick={onClose}
                  style={{
                    padding: '8px 16px', borderRadius: 8,
                    border: '1px solid var(--gray3)', background: 'transparent',
                    fontSize: 12, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.12s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' }}
                >
                  Fechar
                </button>
                <button
                  onClick={handleSave}
                  disabled={status === 'saving'}
                  style={{
                    padding: '8px 20px', borderRadius: 8, border: 'none',
                    background: projectColor, color: '#fff',
                    fontSize: 12, fontWeight: 700,
                    cursor: status === 'saving' ? 'default' : 'pointer',
                    fontFamily: 'inherit',
                    opacity: status === 'saving' ? 0.7 : 1,
                    transition: 'opacity 0.15s',
                    display: 'flex', alignItems: 'center', gap: 7,
                  }}
                >
                  {status === 'saving' ? (
                    <>
                      <div style={{ width: 11, height: 11, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.4)', borderTop: '2px solid #fff', animation: 'spin 0.7s linear infinite' }} />
                      Salvando…
                    </>
                  ) : (
                    <>
                      <svg width={12} height={12} viewBox="0 0 14 14" fill="none">
                        <path d="M2 2h8l2 2v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V2Z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/>
                        <path d="M5 2v4h4V2M4 9h6" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
                      </svg>
                      Salvar na base de conhecimento
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>
    </div>,
    document.body,
  )
}

// ── Card individual de reunião ────────────────────────────────────────────────

function MeetingCard({
  meeting,
  color,
  projectId,
}: {
  meeting: Meeting
  color: string
  projectId: string
}) {
  const [expanded,      setExpanded]  = useState(false)
  const [showTranscript, setShowTrans] = useState(false)
  const [showAtaModal,  setAtaModal]  = useState(false)

  const actionLines = meeting.action_items
    ?.split('\n')
    .map(l => l.trim())
    .filter(Boolean) ?? []

  return (
    <>
      <div style={{
        border: '1px solid var(--gray3)',
        borderRadius: 10,
        overflow: 'hidden',
        background: 'var(--white)',
      }}>
        {/* Header do card */}
        <div
          onClick={() => setExpanded(e => !e)}
          style={{
            padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            cursor: 'pointer',
            background: expanded ? 'var(--bg)' : 'transparent',
            transition: 'background 0.15s',
          }}
        >
          {/* Ícone de microfone */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: color + '18', border: `1px solid ${color}35`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: color,
          }}>
            <svg width={14} height={14} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <rect x="5" y="1" width="6" height="9" rx="3"/>
              <path d="M2 8a6 6 0 0012 0"/>
              <line x1="8" y1="14" x2="8" y2="16"/>
              <line x1="5" y1="16" x2="11" y2="16"/>
            </svg>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize: 13, fontWeight: 700, color: 'var(--black)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              marginBottom: 3,
            }}>
              {meeting.title}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: 'var(--gray2)' }}>{fmtDate(meeting.date)}</span>
              {meeting.duration != null && meeting.duration > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: color, background: color + '15',
                  padding: '1px 7px', borderRadius: 100,
                }}>
                  {fmtDuration(meeting.duration)}
                </span>
              )}
              {meeting.auto_matched && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  color: '#059669', background: 'rgba(5,150,105,0.10)',
                  padding: '1px 7px', borderRadius: 100,
                }}>
                  auto
                </span>
              )}
            </div>
          </div>

          {/* Botão Gerar Ata */}
          <button
            onClick={e => { e.stopPropagation(); setAtaModal(true) }}
            title="Gerar Ata"
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '4px 10px', borderRadius: 6, flexShrink: 0,
              border: `1px solid ${color}50`, background: color + '10',
              fontSize: 10, fontWeight: 700, color: color,
              cursor: 'pointer', fontFamily: 'inherit',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = color + '20'; e.currentTarget.style.borderColor = color + '90' }}
            onMouseLeave={e => { e.currentTarget.style.background = color + '10'; e.currentTarget.style.borderColor = color + '50' }}
          >
            <svg width={10} height={10} viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H2a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V3a1 1 0 0 0-1-1Z"/>
              <path d="M4 6h6M4 9h6M4 12h3"/>
            </svg>
            Gerar Ata
          </button>

          {/* Chevron */}
          <svg width={12} height={12} viewBox="0 0 12 12" fill="none"
            style={{ flexShrink: 0, marginTop: 2, opacity: 0.4, transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Conteúdo expandido */}
        {expanded && (
          <div style={{ borderTop: '1px solid var(--gray3)', padding: '14px' }}>

            {/* Participantes */}
            {meeting.participants && meeting.participants.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Participantes
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {meeting.participants.map((p, i) => (
                    <span key={i} style={{
                      fontSize: 11, fontWeight: 600,
                      color: 'var(--black)', background: 'var(--bg)',
                      border: '1px solid var(--gray3)',
                      padding: '2px 9px', borderRadius: 100,
                    }}>
                      {p}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Resumo */}
            {meeting.summary && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
                  Resumo
                </div>
                <p style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.65, margin: 0 }}>
                  {meeting.summary}
                </p>
              </div>
            )}

            {/* Action items */}
            {actionLines.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>
                  Action Items
                </div>
                <ul style={{ margin: 0, padding: '0 0 0 16px' }}>
                  {actionLines.map((line, i) => (
                    <li key={i} style={{ fontSize: 12, color: 'var(--black)', lineHeight: 1.6, marginBottom: 2 }}>
                      {line.replace(/^[-•*]\s*/, '')}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transcrição completa (colapsável) */}
            {meeting.transcript && (
              <div>
                <button
                  onClick={() => setShowTrans(t => !t)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 11, fontWeight: 700, color: color,
                    padding: '4px 0', marginBottom: showTranscript ? 8 : 0,
                  }}
                >
                  <svg width={10} height={10} viewBox="0 0 10 10" fill="none"
                    style={{ transform: showTranscript ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M3 1.5l4 3.5-4 3.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {showTranscript ? 'Ocultar transcrição' : 'Ver transcrição completa'}
                </button>

                {showTranscript && (
                  <div style={{
                    maxHeight: 280, overflowY: 'auto',
                    background: 'var(--bg)', borderRadius: 8,
                    border: '1px solid var(--gray3)',
                    padding: '10px 12px',
                    fontSize: 11.5, color: 'var(--gray)', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}>
                    {meeting.transcript}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal da Ata */}
      {showAtaModal && (
        <AtaModal
          meeting={meeting}
          projectId={projectId}
          projectColor={color}
          onClose={() => setAtaModal(false)}
        />
      )}
    </>
  )
}

// ── Tab principal ─────────────────────────────────────────────────────────────

export function MeetingsTab({ projectId, projectColor }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading,  setLoading]  = useState(true)
  const [query,    setQuery]    = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/api/meetings?project_id=${projectId}`)
      .then(r => r.json())
      .then((data: Meeting[]) => { setMeetings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

  const filtered = query.trim()
    ? meetings.filter(m => m.title.toLowerCase().includes(query.toLowerCase()))
    : meetings

  if (loading) {
    return (
      <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--gray2)' }}>
        Carregando reuniões…
      </div>
    )
  }

  if (meetings.length === 0) {
    return (
      <div style={{ padding: '40px 20px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>🎙️</div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', marginBottom: 5 }}>
          Nenhuma reunião vinculada
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.5 }}>
          As reuniões do Fireflies serão anexadas automaticamente quando identificadas.
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: '4px 0' }}>

      {/* Barra de pesquisa */}
      <div style={{ position: 'relative' }}>
        <svg width={13} height={13} viewBox="0 0 14 14" fill="none"
          style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', opacity: 0.35, pointerEvents: 'none' }}>
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth={1.5}/>
          <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
        </svg>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar reunião…"
          style={{
            width: '100%', boxSizing: 'border-box',
            padding: '7px 32px 7px 30px',
            fontSize: 12, fontFamily: 'inherit',
            border: '1px solid var(--gray3)', borderRadius: 8,
            background: 'var(--bg)', color: 'var(--black)',
            outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
          }}
          onFocus={e => {
            e.target.style.borderColor = projectColor
            e.target.style.boxShadow   = `0 0 0 3px ${projectColor}22`
          }}
          onBlur={e => {
            e.target.style.borderColor = 'var(--gray3)'
            e.target.style.boxShadow   = 'none'
          }}
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            style={{
              position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
              width: 18, height: 18, borderRadius: 4, border: 'none',
              background: 'var(--gray3)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gray)', padding: 0,
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--gray2)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray)' }}
          >
            <svg width={8} height={8} viewBox="0 0 9 9" fill="none">
              <path d="M1 1l7 7M8 1L1 8" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
            </svg>
          </button>
        )}
      </div>

      {/* Resultados */}
      {filtered.length === 0 ? (
        <div style={{ padding: '28px 0', textAlign: 'center' }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray2)' }}>
            Nenhuma reunião encontrada para &quot;{query}&quot;
          </div>
        </div>
      ) : (
        filtered.map(m => (
          <MeetingCard key={m.id} meeting={m} color={projectColor} projectId={projectId} />
        ))
      )}
    </div>
  )
}
