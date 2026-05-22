'use client'
import { useState, useEffect } from 'react'
import type { Meeting, Project } from '@/lib/types'

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

// ── Card individual de reunião ────────────────────────────────────────────────

function MeetingCard({ meeting, color }: { meeting: Meeting; color: string }) {
  const [expanded, setExpanded]         = useState(false)
  const [showTranscript, setShowTrans]  = useState(false)

  const actionLines = meeting.action_items
    ?.split('\n')
    .map(l => l.trim())
    .filter(Boolean) ?? []

  return (
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
            {meeting.duration && (
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
  )
}

// ── Tab principal ─────────────────────────────────────────────────────────────

export function MeetingsTab({ projectId, projectColor }: Props) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/meetings?project_id=${projectId}`)
      .then(r => r.json())
      .then((data: Meeting[]) => { setMeetings(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [projectId])

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
      {meetings.map(m => (
        <MeetingCard key={m.id} meeting={m} color={projectColor} />
      ))}
    </div>
  )
}
