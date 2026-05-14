'use client'
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { useChatStore, type ChatMessage } from '@/stores/chatStore'
import { DEFAULT_AGENTS, getAgent, type AgentDefinition } from '@/lib/agents'
import { calcProgress } from '@/lib/utils'
import { useAgentsStore } from '@/stores/agentsStore'
import type { AgentType, Project, Week, Client } from '@/lib/types'
import { useTasksStore } from '@/stores/tasksStore'
import { AppSelect } from '@/components/ui/AppSelect'
import { WeekPickerSelect } from '@/components/ui/WeekPickerSelect'

const PANEL_W     = 400
const PANEL_W_MAX = 1000
const PANEL_GAP   = 10

// ── Consultation record ──────────────────────────────────────────────────────

interface ConsultationRecord {
  id: string
  triggeredByMsgId: string
  fromAgent: AgentDefinition
  toAgent: AgentDefinition
  question: string
  answer: string
  streaming: boolean
}

// ── Context dropdown ────────────────────────────────────────────────────────

function ContextDropdown({ label, value, options, onChange, color, disabled }: {
  label: string; value: string | null; options: { id: string; label: string; sublabel?: string }[]
  onChange: (id: string | null) => void; color: string; disabled?: boolean
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  const selected = options.find(o => o.id === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => !disabled && setOpen(o => !o)} disabled={disabled} style={{
        display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20,
        border: `1px solid ${open || value ? color + '50' : 'var(--gray3)'}`,
        background: open ? color + '12' : value ? color + '08' : 'var(--white)',
        cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.4 : 1,
        fontSize: 11, fontWeight: 600, color: selected ? color : 'var(--gray2)',
        whiteSpace: 'nowrap', maxWidth: 150,
        transition: 'all 0.15s ease', boxShadow: open ? `0 0 0 3px ${color}15` : 'none',
      }}>
        {selected && <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }} />}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 110 }}>{selected?.label ?? label}</span>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', opacity: 0.6 }}>
          <path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, zIndex: 9999, background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 12, boxShadow: '0 12px 32px rgba(0,0,0,0.14)', width: 280, maxHeight: 240, overflowY: 'auto', animation: 'fadeIn 0.12s ease both' }}>
          <div onClick={() => { onChange(null); setOpen(false) }} style={{ padding: '9px 14px', fontSize: 12, fontWeight: 600, color: value === null ? color : 'var(--gray)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            <span>{label}</span>
            {value === null && <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></svg>}
          </div>
          <div style={{ borderTop: '1px solid var(--gray3)', margin: '2px 0' }} />
          {options.map(opt => (
            <div key={opt.id} onClick={() => { onChange(opt.id); setOpen(false) }}
              style={{ padding: '8px 14px', fontSize: 12, fontWeight: 600, color: value === opt.id ? color : 'var(--black)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</div>
                {opt.sublabel && (
                  <div style={{ fontSize: 10, fontWeight: 500, color: 'var(--gray2)', marginTop: 2, lineHeight: 1.2 }}>{opt.sublabel}</div>
                )}
              </div>
              {value === opt.id && <svg width={12} height={12} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}><path d="M2 6l3 3 5-5" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Typing dots ─────────────────────────────────────────────────────────────

function TypingDots({ color }: { color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 7, height: 7, borderRadius: '50%', background: color, animation: `blink-cursor 1.1s ease-in-out ${i * 0.18}s infinite`, opacity: 0.6 }} />
      ))}
    </div>
  )
}

// ── Markdown renderer ────────────────────────────────────────────────────────

function MarkdownContent({ content, color, small }: { content: string; color: string; small?: boolean }) {
  const base = small ? 12 : 13
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
      p: ({ children }) => <p style={{ margin: '0 0 8px 0', lineHeight: 1.65 }}>{children}</p>,
      h1: ({ children }) => <p style={{ fontSize: base + 3, fontWeight: 800, margin: '12px 0 6px' }}>{children}</p>,
      h2: ({ children }) => <p style={{ fontSize: base + 2, fontWeight: 800, margin: '10px 0 5px' }}>{children}</p>,
      h3: ({ children }) => <p style={{ fontSize: base + 1, fontWeight: 700, margin: '8px 0 4px' }}>{children}</p>,
      strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
      em: ({ children }) => <em style={{ fontStyle: 'italic', opacity: 0.8 }}>{children}</em>,
      ul: ({ children }) => <ul style={{ margin: '4px 0 8px', paddingLeft: 18, listStyleType: 'disc' }}>{children}</ul>,
      ol: ({ children }) => <ol style={{ margin: '4px 0 8px', paddingLeft: 18, listStyleType: 'decimal' }}>{children}</ol>,
      li: ({ children }) => <li style={{ marginBottom: 3, lineHeight: 1.55 }}>{children}</li>,
      code: ({ children, className }) => {
        const isBlock = className?.includes('language-')
        return isBlock
          ? <code style={{ display: 'block', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 7, padding: '8px 12px', fontSize: base - 1, fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre', overflowX: 'auto', margin: '6px 0', maxWidth: '100%' }}>{children}</code>
          : <code style={{ background: color + '14', border: `1px solid ${color}28`, borderRadius: 4, padding: '1px 5px', fontSize: base - 1, fontFamily: 'monospace', color, wordBreak: 'break-all' }}>{children}</code>
      },
      pre: ({ children }) => <pre style={{ margin: '6px 0', background: 'transparent', overflow: 'hidden', maxWidth: '100%' }}>{children}</pre>,
      blockquote: ({ children }) => <blockquote style={{ borderLeft: `3px solid ${color}`, paddingLeft: 10, margin: '6px 0', opacity: 0.8, fontStyle: 'italic' }}>{children}</blockquote>,
      hr: () => <hr style={{ border: 'none', borderTop: '1px solid var(--gray3)', margin: '10px 0' }} />,
      table: ({ children }) => <div style={{ overflowX: 'auto', margin: '8px 0' }}><table style={{ borderCollapse: 'collapse', fontSize: base - 1, width: '100%', minWidth: 200 }}>{children}</table></div>,
      th: ({ children }) => <th style={{ padding: '5px 10px', fontWeight: 700, borderBottom: `2px solid ${color}40`, textAlign: 'left', whiteSpace: 'nowrap', background: color + '08' }}>{children}</th>,
      td: ({ children }) => <td style={{ padding: '4px 10px', borderBottom: '1px solid var(--gray3)', verticalAlign: 'top' }}>{children}</td>,
    }}>
      {content}
    </ReactMarkdown>
  )
}

// ── Message bubble ──────────────────────────────────────────────────────────

function MessageBubble({ msg, agentColor, agentEmoji, isStreaming }: {
  msg: ChatMessage; agentColor: string; agentEmoji: string; isStreaming: boolean
}) {
  const isUser = msg.role === 'user'
  const [hov, setHov] = useState(false)
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div style={{ display: 'flex', flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-end', gap: 8, animation: isUser ? 'msgRight 0.28s cubic-bezier(0.34,1.2,0.64,1) both' : 'msgLeft 0.28s cubic-bezier(0.34,1.2,0.64,1) both' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      {!isUser && (
        <div style={{ width: 30, height: 30, borderRadius: '50%', flexShrink: 0, background: agentColor + '18', border: `2px solid ${agentColor}${hov ? '70' : '35'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, transform: hov ? 'scale(1.08)' : 'scale(1)', transition: 'transform 0.2s ease, border-color 0.2s ease', boxShadow: hov ? `0 2px 10px ${agentColor}30` : 'none' }}>
          {agentEmoji}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: isUser ? 'row' : 'row-reverse', alignItems: 'flex-end', gap: 5, maxWidth: '82%' }}>
        {!isUser && msg.content && (
          <button onClick={handleCopy} title={copied ? 'Copiado!' : 'Copiar'} style={{ width: 24, height: 24, borderRadius: 7, border: 'none', background: copied ? agentColor + '20' : 'var(--bg)', cursor: 'pointer', flexShrink: 0, marginBottom: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hov ? 1 : 0, transform: hov ? 'scale(1) translateY(0)' : 'scale(0.85) translateY(4px)', transition: 'opacity 0.18s ease, transform 0.18s ease', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', color: copied ? agentColor : 'var(--gray2)' }}>
            {copied
              ? <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
              : <svg width={11} height={11} viewBox="0 0 14 14" fill="none"><rect x="5" y="5" width="8" height="8" rx="2" stroke="currentColor" strokeWidth={1.4}/><path d="M3 9H2a1 1 0 01-1-1V2a1 1 0 011-1h6a1 1 0 011 1v1" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/></svg>
            }
          </button>
        )}
        <div style={{ background: isUser ? 'var(--primary)' : `${agentColor}12`, border: isUser ? 'none' : `1px solid ${agentColor}25`, borderRadius: isUser ? '18px 18px 5px 18px' : '18px 18px 18px 5px', padding: isUser ? '10px 16px' : '11px 15px', boxShadow: isUser ? (hov ? '0 6px 20px var(--primary-mid)' : '0 3px 10px var(--primary-dim)') : (hov ? `0 4px 18px ${agentColor}25` : `0 1px 4px ${agentColor}15`), transition: 'box-shadow 0.2s ease, border-color 0.2s ease', minWidth: 40, overflowX: 'auto' }}>
          {/* File chips for user messages */}
          {isUser && msg.attachedFiles && msg.attachedFiles.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 6 }}>
              {msg.attachedFiles.map((name, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.25)', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                  <svg width={9} height={9} viewBox="0 0 12 12" fill="none"><path d="M7 1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4L7 1z" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/><path d="M7 1v3h3" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round"/></svg>
                  {name}
                </div>
              ))}
            </div>
          )}
          {/* Pasted images */}
          {isUser && msg.images && msg.images.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: msg.content ? 8 : 0 }}>
              {msg.images.map((img, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`data:${img.mediaType};base64,${img.data}`}
                  alt={img.name}
                  style={{ maxWidth: 200, maxHeight: 200, borderRadius: 10, border: '1.5px solid rgba(255,255,255,0.25)', objectFit: 'contain', display: 'block', background: 'rgba(0,0,0,0.1)' }}
                />
              ))}
            </div>
          )}
          {msg.content
            ? isUser
              ? (() => {
                  // Show only the typed portion (strip attachment prefix blocks)
                  const sep = '\n\n---\n\n'
                  let displayText = msg.content
                  if (msg.attachedFiles?.length) {
                    const lastSep = msg.content.lastIndexOf(sep)
                    displayText = lastSep !== -1 ? msg.content.slice(lastSep + sep.length).trim() : ''
                  }
                  return displayText
                    ? <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0, color: '#fff', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontWeight: 500 }}>{displayText}</p>
                    : null
                })()
              : isStreaming
                ? <p style={{ fontSize: 13, lineHeight: 1.65, margin: 0, color: 'var(--black)', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {msg.content}
                    <span style={{ display: 'inline-block', width: 2, height: 13, background: agentColor, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink-cursor 0.9s ease-in-out infinite' }} />
                  </p>
                : <div key="md" data-msgid={msg.id} style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--black)', wordBreak: 'break-word', animation: 'mdReveal 0.3s ease both' }}>
                    <MarkdownContent content={msg.content} color={agentColor} />
                  </div>
            : <TypingDots color={agentColor} />
          }
        </div>
      </div>
    </div>
  )
}

// ── Consultation bubble ──────────────────────────────────────────────────────

function ConsultationBubble({ record }: { record: ConsultationRecord }) {
  const { fromAgent, toAgent, question, answer, streaming } = record
  const [expanded, setExpanded] = useState(true)

  return (
    <div style={{ marginLeft: 38, marginTop: 6, marginBottom: 6, borderRadius: 14, border: `1px solid ${toAgent.color}22`, borderLeft: `3px solid ${fromAgent.color}`, background: `linear-gradient(135deg, ${fromAgent.color}05 0%, ${toAgent.color}08 100%)`, overflow: 'hidden', animation: 'msgLeft 0.3s cubic-bezier(0.34,1.2,0.64,1) both', boxShadow: `0 2px 12px ${toAgent.color}10` }}>
      <div onClick={() => setExpanded(e => !e)} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 12px', cursor: 'pointer', userSelect: 'none' }}>
        <span style={{ fontSize: 14 }}>{fromAgent.emoji}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: fromAgent.color }}>{fromAgent.name}</span>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ color: 'var(--gray2)', flexShrink: 0 }}><path d="M1 5h8M6 2l3 3-3 3" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/></svg>
        <span style={{ fontSize: 14 }}>{toAgent.emoji}</span>
        <span style={{ fontSize: 10, fontWeight: 800, color: toAgent.color }}>{toAgent.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {streaming && <div style={{ width: 6, height: 6, borderRadius: '50%', background: toAgent.color, animation: 'blink-cursor 1s ease-in-out infinite' }} />}
          <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--gray2)', background: 'var(--bg)', padding: '2px 6px', borderRadius: 20, border: '1px solid var(--gray3)' }}>consulta</span>
          <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ color: 'var(--gray2)', transform: expanded ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform 0.2s ease' }}><path d="M2 3.5l3 3 3-3" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      </div>
      {expanded && (
        <div style={{ padding: '0 12px 10px' }}>
          <p style={{ fontSize: 11, fontStyle: 'italic', color: 'var(--gray)', margin: '0 0 8px 0', lineHeight: 1.5, paddingLeft: 8, borderLeft: `2px solid ${fromAgent.color}40` }}>"{question}"</p>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
            <div style={{ width: 22, height: 22, borderRadius: '50%', flexShrink: 0, background: toAgent.color + '20', border: `1.5px solid ${toAgent.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, marginTop: 1 }}>{toAgent.emoji}</div>
            <div style={{ flex: 1, fontSize: 12, lineHeight: 1.6, color: 'var(--black)', wordBreak: 'break-word' }}>
              {answer
                ? <><MarkdownContent content={answer} color={toAgent.color} small />{streaming && <span style={{ display: 'inline-block', width: 2, height: 11, background: toAgent.color, marginLeft: 2, verticalAlign: 'text-bottom', animation: 'blink-cursor 0.9s ease-in-out infinite' }} />}</>
                : <TypingDots color={toAgent.color} />
              }
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Regex for markers ────────────────────────────────────────────────────────
const CONSULT_REGEX    = /\[CONSULT:(\w+)\|"([^"]+)"\]/
const OPCOES_REGEX     = /\[OPCOES:([^\]]+)\]/
const ENTREGAVEL_REGEX = /\[ENTREGÁVEL:"([^"]+)"\]/g
const PROJETO_REGEX    = /\[PROJETO:"([^"]+)"\]/g
const ARTEFATO_REGEX   = /\[ARTEFATO:"([^"]+)"\]/g

// ── Task proposal ────────────────────────────────────────────────────────────

interface TaskProposal {
  id: string
  triggeredByMsgId: string
  title: string
  projectId: string | null
  weekId: string | null
  assignedTo: string
  confirmed: boolean
  discarded: boolean
}


// ── Artifact download bar ────────────────────────────────────────────────────

function ArtifactDownloadBar({ msgId, title, content, agentColor }: {
  msgId: string; title: string; content: string; agentColor: string
}) {
  const [loadingDocx, setLoadingDocx] = useState(false)

  const handlePdf = () => {
    const el = document.querySelector(`[data-msgid="${msgId}"]`) as HTMLElement | null
    if (!el) return
    const win = window.open('', '_blank')
    if (!win) return
    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body{font-family:-apple-system,system-ui,sans-serif;max-width:760px;margin:40px auto;line-height:1.65;color:#111;font-size:14px}
        h1{font-size:22px;font-weight:800;margin:20px 0 10px}
        h2{font-size:18px;font-weight:700;margin:16px 0 8px}
        h3{font-size:15px;font-weight:700;margin:12px 0 6px}
        p{margin:0 0 10px}
        ul,ol{margin:4px 0 10px;padding-left:22px}
        li{margin-bottom:4px}
        code{font-family:monospace;background:#f3f3f3;padding:2px 5px;border-radius:3px;font-size:12px}
        pre{background:#f5f5f5;border-radius:6px;padding:10px 14px;margin:8px 0;overflow-x:auto}
        pre code{background:none;padding:0}
        table{border-collapse:collapse;width:100%;margin:8px 0}
        th{border-bottom:2px solid #ddd;padding:6px 10px;text-align:left;font-weight:700}
        td{border-bottom:1px solid #eee;padding:5px 10px}
        blockquote{border-left:3px solid #ccc;padding-left:12px;margin:8px 0;color:#555;font-style:italic}
        hr{border:none;border-top:1px solid #eee;margin:14px 0}
        @media print{body{margin:20px}}
      </style>
    </head><body>${el.innerHTML}</body></html>`)
    win.document.close()
    setTimeout(() => win.print(), 300)
  }

  const handleDocx = async () => {
    setLoadingDocx(true)
    try {
      const res = await fetch('/api/generate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, filename: title }),
      })
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${title}.docx`
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoadingDocx(false)
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, paddingLeft: 38, marginTop: -2, marginBottom: 6 }}>
      <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        📄 {title}
      </span>
      <button
        onClick={handlePdf}
        style={{ padding: '3px 10px', borderRadius: 12, border: `1px solid ${agentColor}40`, background: agentColor + '10', color: agentColor, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
        onMouseEnter={e => { e.currentTarget.style.background = agentColor + '22' }}
        onMouseLeave={e => { e.currentTarget.style.background = agentColor + '10' }}>
        ↓ PDF
      </button>
      <button
        onClick={handleDocx}
        disabled={loadingDocx}
        style={{ padding: '3px 10px', borderRadius: 12, border: `1px solid ${agentColor}40`, background: agentColor + '10', color: agentColor, fontSize: 11, fontWeight: 700, cursor: loadingDocx ? 'not-allowed' : 'pointer', opacity: loadingDocx ? 0.5 : 1, transition: 'all 0.15s' }}
        onMouseEnter={e => { if (!loadingDocx) e.currentTarget.style.background = agentColor + '22' }}
        onMouseLeave={e => { e.currentTarget.style.background = agentColor + '10' }}>
        {loadingDocx ? '…' : '↓ DOCX'}
      </button>
    </div>
  )
}

function TaskProposalCard({ proposal, agentColor, onUpdate, onConfirm, onDiscard, projects, weeks }: {
  proposal: TaskProposal
  agentColor: string
  onUpdate: (patch: Partial<TaskProposal>) => void
  onConfirm: () => void
  onDiscard: () => void
  projects: Project[]
  weeks: Week[]
}) {
  const addTask = useTasksStore(s => s.addTask)

  const projectWeeks = [...weeks].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const projectName  = projects.find(p => p.id === proposal.projectId)?.name ?? ''

  const handleConfirm = () => {
    if (!proposal.projectId) return
    addTask({
      id: `tc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      project_id: proposal.projectId,
      week_id: proposal.weekId ?? undefined,
      title: proposal.title,
      done: false,
      assigned_to: proposal.assignedTo || undefined,
      created_at: new Date().toISOString(),
    })
    onConfirm()
  }

  if (proposal.confirmed) {
    return (
      <div style={{ marginLeft: 38, marginTop: 8, marginBottom: 4, borderRadius: 12, border: `1px solid #1E8A3E40`, borderLeft: `3px solid #1E8A3E`, background: '#1E8A3E08', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.25s ease both' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1E8A3E20', border: '1.5px solid #1E8A3E50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1E8A3E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1E8A3E' }}>Entregável criado{projectName ? ` em ${projectName}` : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 1 }}>{proposal.title}</div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ marginLeft: 38, marginTop: 8, marginBottom: 4, borderRadius: 12, border: `1px solid ${agentColor}25`, borderLeft: `3px solid ${agentColor}`, background: `${agentColor}06`, padding: '12px 14px', animation: 'msgLeft 0.3s cubic-bezier(0.34,1.2,0.64,1) both', boxShadow: `0 2px 10px ${agentColor}10` }}>
      {/* Header */}
      <div style={{ fontSize: 9, fontWeight: 800, color: agentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={10} height={10} viewBox="0 0 12 12" fill="none"><rect x="1" y="1" width="10" height="10" rx="2" stroke="currentColor" strokeWidth={1.4}/><path d="M4 6h4M4 8.5h2.5" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round"/></svg>
        Proposta de entregável
      </div>

      {/* Title */}
      <input
        value={proposal.title}
        onChange={e => onUpdate({ title: e.target.value })}
        style={{ width: '100%', fontSize: 12, fontWeight: 600, color: 'var(--black)', border: '1px solid var(--gray3)', borderRadius: 8, padding: '6px 10px', background: 'var(--white)', outline: 'none', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }}
        onFocus={e => { e.currentTarget.style.borderColor = agentColor + '60'; e.currentTarget.style.boxShadow = `0 0 0 3px ${agentColor}15` }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.boxShadow = 'none' }}
      />

      {/* Project + Week row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Projeto</div>
          <AppSelect
            value={proposal.projectId ?? ''}
            onChange={v => onUpdate({ projectId: v || null, weekId: null })}
            options={[
              { value: '', label: '— Selecionar —' },
              ...projects
                .filter(p => p.status === 'active' || p.status === 'paused')
                .map(p => ({ value: p.id, label: p.name })),
            ]}
            placeholder="— Selecionar —"
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Semana</div>
          <WeekPickerSelect
            value={proposal.weekId}
            onChange={v => onUpdate({ weekId: v })}
            weeks={projectWeeks}
            color={agentColor}
            disabled={!proposal.projectId}
          />
        </div>
      </div>

      {/* Assigned to */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Responsável (opcional)</div>
        <input value={proposal.assignedTo} onChange={e => onUpdate({ assignedTo: e.target.value })} placeholder="Nome do responsável"
          style={{ width: '100%', fontSize: 11, fontWeight: 500, border: '1px solid var(--gray3)', borderRadius: 8, padding: '5px 10px', background: 'var(--white)', outline: 'none', color: 'var(--black)', boxSizing: 'border-box', fontFamily: 'inherit' }}
          onFocus={e => { e.currentTarget.style.borderColor = agentColor + '60' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--gray3)' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleConfirm} disabled={!proposal.projectId || !proposal.title.trim()} style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: proposal.projectId && proposal.title.trim() ? agentColor : 'var(--gray3)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: proposal.projectId && proposal.title.trim() ? 'pointer' : 'not-allowed', transition: 'all 0.15s ease', opacity: proposal.projectId && proposal.title.trim() ? 1 : 0.5 }}
          onMouseEnter={e => { if (proposal.projectId && proposal.title.trim()) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { if (proposal.projectId && proposal.title.trim()) e.currentTarget.style.opacity = '1' }}>
          Criar entregável
        </button>
        <button onClick={onDiscard} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', color: 'var(--gray)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray)' }}>
          Descartar
        </button>
      </div>
    </div>
  )
}

// ── Project proposal ─────────────────────────────────────────────────────────

interface ProjectProposal {
  id: string
  triggeredByMsgId: string
  name: string
  clientId: string | null
  type: string
  startDate: string
  description: string
  gestor: string
  confirmed: boolean
  discarded: boolean
}

function ProjectProposalCard({ proposal, agentColor, clients, onUpdate, onConfirm, onDiscard }: {
  proposal: ProjectProposal
  agentColor: string
  clients: Client[]
  onUpdate: (patch: Partial<ProjectProposal>) => void
  onConfirm: () => void
  onDiscard: () => void
}) {
  const [saving, setSaving] = useState(false)
  const clientName = clients.find(c => c.id === proposal.clientId)?.name ?? ''

  const handleConfirm = async () => {
    if (!proposal.clientId || !proposal.name.trim()) return
    setSaving(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: proposal.name,
        client_id: proposal.clientId,
        type: proposal.type || 'Other',
        status: 'active',
        color_hex: '#84CC16',
        start_date: proposal.startDate,
        description: proposal.description || null,
        gestor: proposal.gestor || null,
        progress: 0,
        created_at: new Date().toISOString(),
      }),
    })
    setSaving(false)
    onConfirm()
  }

  const PROJECT_TYPES = ['AI', 'SaaS', 'TaaS', 'BI', 'PowerPlatform', 'Other']
  const canCreate = !!proposal.clientId && !!proposal.name.trim()

  if (proposal.confirmed) {
    return (
      <div style={{ marginLeft: 38, marginTop: 8, marginBottom: 4, borderRadius: 12, border: '1px solid #1E8A3E40', borderLeft: '3px solid #1E8A3E', background: '#1E8A3E08', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeIn 0.25s ease both' }}>
        <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#1E8A3E20', border: '1.5px solid #1E8A3E50', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <svg width={11} height={11} viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#1E8A3E" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#1E8A3E' }}>Projeto criado{clientName ? ` para ${clientName}` : ''}</div>
          <div style={{ fontSize: 11, color: 'var(--gray)', marginTop: 1 }}>{proposal.name}</div>
        </div>
      </div>
    )
  }

  const inputStyle = (color: string): React.CSSProperties => ({
    width: '100%', fontSize: 11, fontWeight: 500, border: '1px solid var(--gray3)',
    borderRadius: 8, padding: '5px 10px', background: 'var(--white)', outline: 'none',
    color: 'var(--black)', boxSizing: 'border-box', fontFamily: 'inherit',
  })

  return (
    <div style={{ marginLeft: 38, marginTop: 8, marginBottom: 4, borderRadius: 12, border: `1px solid ${agentColor}25`, borderLeft: `3px solid ${agentColor}`, background: `${agentColor}06`, padding: '12px 14px', animation: 'msgLeft 0.3s cubic-bezier(0.34,1.2,0.64,1) both', boxShadow: `0 2px 10px ${agentColor}10` }}>
      {/* Header */}
      <div style={{ fontSize: 9, fontWeight: 800, color: agentColor, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
        <svg width={10} height={10} viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth={1.4}/><path d="M4 3V2a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/></svg>
        Proposta de projeto
      </div>

      {/* Name */}
      <input
        value={proposal.name}
        onChange={e => onUpdate({ name: e.target.value })}
        style={{ width: '100%', fontSize: 12, fontWeight: 600, color: 'var(--black)', border: '1px solid var(--gray3)', borderRadius: 8, padding: '6px 10px', background: 'var(--white)', outline: 'none', boxSizing: 'border-box', marginBottom: 10, fontFamily: 'inherit' }}
        onFocus={e => { e.currentTarget.style.borderColor = agentColor + '60'; e.currentTarget.style.boxShadow = `0 0 0 3px ${agentColor}15` }}
        onBlur={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.boxShadow = 'none' }}
        placeholder="Nome do projeto"
      />

      {/* Cliente + Tipo */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Cliente *</div>
          <AppSelect
            value={proposal.clientId ?? ''}
            onChange={v => onUpdate({ clientId: v || null })}
            options={[
              { value: '', label: '— Selecionar —' },
              ...clients.filter(c => !c.status || c.status === 'active').map(c => ({ value: c.id, label: c.name })),
            ]}
            placeholder="— Selecionar —"
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Tipo</div>
          <AppSelect
            value={proposal.type}
            onChange={v => onUpdate({ type: v })}
            options={PROJECT_TYPES.map(t => ({ value: t, label: t }))}
            placeholder="Other"
          />
        </div>
      </div>

      {/* Início + Gestor */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Início</div>
          <input type="date" value={proposal.startDate} onChange={e => onUpdate({ startDate: e.target.value })}
            style={inputStyle(agentColor)}
            onFocus={e => { e.currentTarget.style.borderColor = agentColor + '60' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--gray3)' }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Gestor (opcional)</div>
          <input value={proposal.gestor} onChange={e => onUpdate({ gestor: e.target.value })} placeholder="Nome"
            style={inputStyle(agentColor)}
            onFocus={e => { e.currentTarget.style.borderColor = agentColor + '60' }}
            onBlur={e => { e.currentTarget.style.borderColor = 'var(--gray3)' }}
          />
        </div>
      </div>

      {/* Descrição */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', marginBottom: 4 }}>Descrição (opcional)</div>
        <textarea value={proposal.description} onChange={e => onUpdate({ description: e.target.value })} placeholder="Descreva brevemente o projeto…" rows={2}
          style={{ ...inputStyle(agentColor), resize: 'none', lineHeight: 1.5 }}
          onFocus={e => { e.currentTarget.style.borderColor = agentColor + '60' }}
          onBlur={e => { e.currentTarget.style.borderColor = 'var(--gray3)' }}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleConfirm} disabled={!canCreate || saving}
          style={{ flex: 1, padding: '7px 0', borderRadius: 8, border: 'none', background: canCreate ? agentColor : 'var(--gray3)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: canCreate ? 'pointer' : 'not-allowed', opacity: canCreate ? 1 : 0.5, transition: 'all 0.15s ease' }}
          onMouseEnter={e => { if (canCreate) e.currentTarget.style.opacity = '0.85' }}
          onMouseLeave={e => { if (canCreate) e.currentTarget.style.opacity = '1' }}>
          {saving ? 'Criando…' : 'Criar projeto'}
        </button>
        <button onClick={onDiscard} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', color: 'var(--gray)', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s ease' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray)' }}>
          Descartar
        </button>
      </div>
    </div>
  )
}

// ── Quick reply chips ────────────────────────────────────────────────────────

function QuickReplies({ choices, onSelect, color }: {
  choices: string[]
  onSelect: (choice: string) => void
  color: string
}) {
  const [picked, setPicked] = useState<string | null>(null)

  const handle = (c: string) => {
    if (picked) return
    setPicked(c)
    onSelect(c)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginLeft: 38, marginTop: 8, marginBottom: 2 }}>
      {choices.map((c, i) => {
        const isSelected = picked === c
        const isDimmed   = picked !== null && !isSelected
        return (
          <button
            key={c}
            onClick={() => handle(c)}
            disabled={picked !== null}
            style={{
              padding: '6px 15px',
              borderRadius: 100,
              border: `1.5px solid ${isSelected ? color : color + '55'}`,
              background: isSelected ? color : 'var(--white)',
              color: isSelected ? '#fff' : 'var(--black)',
              fontSize: 12, fontWeight: 600,
              cursor: picked !== null ? 'default' : 'pointer',
              opacity: isDimmed ? 0.3 : 1,
              boxShadow: isSelected ? `0 3px 12px ${color}40` : '0 1px 3px rgba(0,0,0,0.06)',
              transform: isSelected ? 'scale(1.04)' : 'scale(1)',
              transition: 'all 0.2s cubic-bezier(0.34,1.2,0.64,1)',
              animation: `slideUp 0.22s ease ${i * 0.05}s both`,
            }}
            onMouseEnter={e => { if (!picked) { e.currentTarget.style.background = color + '12'; e.currentTarget.style.borderColor = color; e.currentTarget.style.transform = 'scale(1.04)' } }}
            onMouseLeave={e => { if (!picked) { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = color + '55'; e.currentTarget.style.transform = 'scale(1)' } }}
          >
            {c}
          </button>
        )
      })}
    </div>
  )
}

// ── Agent picker ("+  Abrir agente") ─────────────────────────────────────────

function AgentPicker({ currentAgentType }: { currentAgentType: AgentType }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const allAgents  = useAgentsStore(s => s.agents)
  const openChats  = useChatStore(s => s.openChats)
  const openChat   = useChatStore(s => s.openChat)
  const closeChat  = useChatStore(s => s.closeChat)

  // Enabled agents, excluding the current panel's agent
  const others = allAgents.filter(a => a.enabled && a.type !== currentAgentType)

  useEffect(() => {
    if (!open) return
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Abrir outro especialista"
        style={{
          width: 32, height: 32, borderRadius: 10,
          border: `1px solid ${open ? 'var(--black)' : 'var(--gray3)'}`,
          background: open ? 'var(--black)' : 'transparent',
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: open ? '#fff' : 'var(--gray2)', flexShrink: 0,
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--black)'; e.currentTarget.style.color = 'var(--black)'; e.currentTarget.style.transform = 'scale(1.08)' } }}
        onMouseLeave={e => { if (!open) { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)'; e.currentTarget.style.transform = 'scale(1)' } }}
      >
        <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
          <path d="M7 1v6M1 7h6M7 13V7M13 7H7" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 9999,
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 14, boxShadow: '0 12px 36px rgba(0,0,0,0.16)',
          padding: '8px 0', minWidth: 220,
          animation: 'fadeIn 0.15s ease both',
        }}>
          <div style={{ padding: '4px 14px 8px', fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Abrir ao lado
          </div>
          {others.map(agent => {
            const isAlreadyOpen = openChats.includes(agent.type as AgentType)
            return (
              <div
                key={agent.type}
                onClick={() => {
                  if (isAlreadyOpen) { closeChat(agent.type as AgentType) } else { openChat(agent.type as AgentType) }
                  setOpen(false)
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 14px', cursor: 'pointer',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = agent.color + '0C')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: isAlreadyOpen ? agent.color + '25' : agent.color + '12',
                  border: `2px solid ${agent.color}${isAlreadyOpen ? '80' : '35'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 15,
                }}>
                  {agent.emoji}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)', lineHeight: 1.2 }}>{agent.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{agent.role}</div>
                </div>
                {isAlreadyOpen ? (
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: '#D9302510', border: '1px solid #D9302530', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={9} height={9} viewBox="0 0 10 10" fill="none">
                      <path d="M1 1l8 8M9 1L1 9" stroke="#D93025" strokeWidth={1.5} strokeLinecap="round"/>
                    </svg>
                  </div>
                ) : (
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: agent.color + '15', border: `1px solid ${agent.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                      <path d="M5 1v8M1 5h8" stroke={agent.color} strokeWidth={1.5} strokeLinecap="round"/>
                    </svg>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── Single chat panel ────────────────────────────────────────────────────────

interface ChatPanelProps {
  agentType: AgentType
  rightOffset: number  // px from right edge
}

function ChatPanelInner({ agentType, rightOffset }: ChatPanelProps) {
  const instance   = useChatStore(s => s.instances[agentType])
  const closeChat  = useChatStore(s => s.closeChat)
  const clearMessages = useChatStore(s => s.clearMessages)
  const addMessage = useChatStore(s => s.addMessage)
  const appendToLast = useChatStore(s => s.appendToLast)
  const updateMessage = useChatStore(s => s.updateMessage)
  const setStreaming = useChatStore(s => s.setStreaming)
  const setProject = useChatStore(s => s.setProject)
  const setTask    = useChatStore(s => s.setTask)

  const messages   = instance?.messages   ?? []
  const streaming  = instance?.streaming  ?? false
  const selectedProjectId = instance?.selectedProjectId ?? null
  const selectedTaskId    = instance?.selectedTaskId    ?? null

  const [projects,  setProjects]            = useState<Project[]>([])
  const [weeks,     setWeeks]               = useState<Week[]>([])
  const [clients,   setClients]             = useState<Client[]>([])
  const [input, setInput]                   = useState('')
  const [consultations, setConsultations]   = useState<ConsultationRecord[]>([])
  const [quickReplies, setQuickReplies]     = useState<Record<string, string[]>>({})
  const [taskProposals, setTaskProposals]       = useState<TaskProposal[]>([])
  const [projectProposals, setProjectProposals] = useState<ProjectProposal[]>([])
  const [inputFocused, setInputFocused]     = useState(false)
  const [sendHov, setSendHov]               = useState(false)
  const [showScrollBtn, setShowScrollBtn]   = useState(false)
  const [attachments, setAttachments]       = useState<{ name: string; text: string; size: number }[]>([])
  const [pastedImages, setPastedImages]     = useState<{ data: string; mediaType: 'image/png'|'image/jpeg'|'image/gif'|'image/webp'; name: string; preview: string }[]>([])
  const [uploading, setUploading]           = useState(false)
  const [panelWidth, setPanelWidth]         = useState(PANEL_W)
  const [modelOverride, setModelOverride]   = useState<string>('')
  const [effortLevel, setEffortLevel]       = useState<'focado' | 'balanceado' | 'criativo'>('balanceado')
  const [confirmModal, setConfirmModal]     = useState<'clear' | 'close' | null>(null)
  const [artifactTitles, setArtifactTitles] = useState<Record<string, string>>({})
  const [voiceMode, setVoiceMode]           = useState(false)
  const [voiceState, setVoiceState]         = useState<'idle' | 'listening' | 'speaking'>('idle')
  const recognitionRef   = useRef<unknown>(null)
  const prevStreamingRef = useRef(false)
  const resizingRef                         = useRef(false)
  const startXRef                           = useRef(0)
  const startWRef                           = useRef(PANEL_W)

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/weeks').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([p, w, c]) => { setProjects(p); setWeeks(w); setClients(c) })
  }, [])

  const messagesEndRef  = useRef<HTMLDivElement>(null)
  const scrollAreaRef   = useRef<HTMLDivElement>(null)
  const userScrolledUp  = useRef(false)
  const textareaRef     = useRef<HTMLTextAreaElement>(null)
  const abortRef        = useRef<AbortController | null>(null)
  const fileInputRef    = useRef<HTMLInputElement>(null)

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    resizingRef.current = true
    startXRef.current   = e.clientX
    startWRef.current   = panelWidth

    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return
      const delta = startXRef.current - ev.clientX   // drag left = wider
      const next  = Math.min(PANEL_W_MAX, Math.max(PANEL_W, startWRef.current + delta))
      setPanelWidth(next)
    }
    const onUp = () => {
      resizingRef.current = false
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }

    document.body.style.cursor     = 'ew-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }, [panelWidth])

  const agent = getAgent(agentType)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 120) + 'px'
  }, [input])

  // Smart scroll
  useEffect(() => {
    if (userScrolledUp.current) return
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, consultations])

  const handleScrollAreaScroll = useCallback(() => {
    const el = scrollAreaRef.current
    if (!el) return
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 80
    userScrolledUp.current = !atBottom
    setShowScrollBtn(!atBottom)
  }, [])

  const scrollToBottom = useCallback(() => {
    userScrolledUp.current = false
    setShowScrollBtn(false)
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items)
    const imageItems = items.filter(item => item.type.startsWith('image/'))
    if (imageItems.length === 0) return
    e.preventDefault()
    imageItems.forEach(item => {
      const blob = item.getAsFile()
      if (!blob) return
      const reader = new FileReader()
      reader.onload = () => {
        const dataUrl = reader.result as string
        const base64  = dataUrl.split(',')[1]
        const mediaType = (item.type === 'image/jpeg' || item.type === 'image/gif' || item.type === 'image/webp')
          ? item.type as 'image/jpeg'|'image/gif'|'image/webp'
          : 'image/png' as const
        const ext = mediaType.split('/')[1]
        setPastedImages(prev => [...prev, {
          data: base64,
          mediaType,
          name: `imagem-${Date.now()}.${ext}`,
          preview: dataUrl,
        }])
      }
      reader.readAsDataURL(blob)
    })
  }, [])

  const projectOptions = projects
    .filter(p => p.status === 'active' || p.status === 'paused' || p.status === 'negotiation')
    .map(p => ({ id: p.id, label: p.name, sublabel: p.client?.name }))

  const storeTasks      = useTasksStore(s => s.tasks)
  const selectedProject = useMemo(() => projects.find(p => p.id === selectedProjectId) ?? null, [selectedProjectId, projects])
  const projectTasks    = useMemo(() => selectedProjectId ? storeTasks.filter(t => t.project_id === selectedProjectId) : [], [selectedProjectId, storeTasks])
  const taskOptions     = useMemo(() => projectTasks.map(t => ({ id: t.id, label: t.title })), [projectTasks])
  const selectedTask    = useMemo(() => storeTasks.find(t => t.id === selectedTaskId) ?? null, [storeTasks, selectedTaskId])

  const buildSystemPrompt = useCallback((agentDef: AgentDefinition) => {
    let prompt = agentDef.systemPrompt
    if (selectedProject) {
      prompt += `\n\n--- CONTEXTO DO PROJETO ---\nNome: ${selectedProject.name}`
      if (selectedProject.client?.name) prompt += ` | Cliente: ${selectedProject.client.name}`
      prompt += ` | Status: ${selectedProject.status} | Tipo: ${selectedProject.type} | Progresso: ${calcProgress(selectedProject.start_date, selectedProject.end_date)}%`
      if (selectedProject.gestor) prompt += ` | Gestor: ${selectedProject.gestor}`
      if (selectedProject.start_date) prompt += `\nInício: ${selectedProject.start_date}`
      if (selectedProject.end_date) prompt += ` | Fim previsto: ${selectedProject.end_date}`
      if (selectedProject.description) prompt += `\nDescrição: ${selectedProject.description}`
      if (selectedProject.observacoes) prompt += `\nObservações / contexto do projeto: ${selectedProject.observacoes}`
      if (projectTasks.length > 0) prompt += '\nEntregáveis:\n' + projectTasks.map(t => `- ${t.title} [${t.done ? 'Concluído' : 'Pendente'}]`).join('\n')
      if (selectedTask) {
        prompt += `\n\nENTREGÁVEL EM FOCO: ${selectedTask.title} [${selectedTask.done ? 'Concluído' : 'Pendente'}]`
        if (selectedTask.description) prompt += `\nDescrição: ${selectedTask.description}`
      }
    }
    return prompt
  }, [selectedProject, projectTasks, selectedTask])

  const runStream = useCallback(async (
    systemPrompt: string, history: { role: string; content: string }[],
    model: string, temperature: number, onChunk: (c: string) => void, signal?: AbortSignal,
  ): Promise<string> => {
    let full = ''
    const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal, body: JSON.stringify({ messages: history, systemPrompt, model, temperature }) })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    if (!res.body) throw new Error('No response body')
    const reader = res.body.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      full += chunk
      onChunk(chunk)
    }
    return full
  }, [])

  const sendMessage = useCallback(async (overrideText?: string) => {
    const rawText = (overrideText ?? input).trim()
    const hasAttachments = attachments.length > 0
    const hasImages      = pastedImages.length > 0
    if (!rawText && !hasAttachments && !hasImages) return
    // Se já está gerando, aborta a resposta atual antes de enviar a nova
    if (streaming) abortRef.current?.abort()

    // Build message content: prepend extracted file text(s)
    const attachmentPrefix = attachments
      .map(a => `[Arquivo: "${a.name}"]\n\n${a.text}`)
      .join('\n\n---\n\n')
    const text = attachmentPrefix
      ? (attachmentPrefix + (rawText ? '\n\n---\n\n' + rawText : ''))
      : rawText

    const snapshotImages = pastedImages.map(img => ({ data: img.data, mediaType: img.mediaType, name: img.name }))
    if (!overrideText) { setInput(''); setAttachments([]); setPastedImages([]) }
    userScrolledUp.current = false
    setShowScrollBtn(false)

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`, role: 'user', content: text,
      ...(attachments.length > 0 && { attachedFiles: attachments.map(a => a.name) }),
      ...(snapshotImages.length > 0 && { images: snapshotImages }),
    }
    addMessage(agentType, userMsg)

    const assistantId = `a-${Date.now()}`
    addMessage(agentType, { id: assistantId, role: 'assistant', content: '' })
    setStreaming(agentType, true)

    const history = [...messages, userMsg].map(m => ({
      role: m.role,
      content: m.content,
      ...(m.images?.length ? { images: m.images } : {}),
    }))

    try {
      abortRef.current = new AbortController()
      const signal = abortRef.current.signal

      const mainContent = await runStream(
        buildSystemPrompt(agent), history,
        modelOverride || agent.model,
        effortLevel === 'focado' ? 0.2 : effortLevel === 'criativo' ? 0.95 : agent.temperature,
        (chunk) => appendToLast(agentType, chunk), signal,
      )

      // ── Quick-reply options marker ───────────────────────────────────────
      const opcoesMatch = OPCOES_REGEX.exec(mainContent)
      if (opcoesMatch) {
        const choices = opcoesMatch[1].split('|').map(s => s.trim()).filter(Boolean)
        updateMessage(agentType, assistantId, mainContent.replace(opcoesMatch[0], '').trim())
        setQuickReplies(prev => ({ ...prev, [assistantId]: choices }))
        return   // wait for the user to pick before continuing
      }

      // ── Task proposal marker ─────────────────────────────────────────────
      ENTREGAVEL_REGEX.lastIndex = 0
      const tarefaMatches = Array.from(mainContent.matchAll(ENTREGAVEL_REGEX))
      if (tarefaMatches.length > 0) {
        updateMessage(agentType, assistantId, mainContent.replace(ENTREGAVEL_REGEX, '').trim())
        const proposals: TaskProposal[] = tarefaMatches.map(m => ({
          id: `tp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          triggeredByMsgId: assistantId,
          title: m[1],
          projectId: selectedProjectId,
          weekId: null,
          assignedTo: '',
          confirmed: false,
          discarded: false,
        }))
        setTaskProposals(prev => [...prev, ...proposals])
      }

      // ── Project proposal marker ──────────────────────────────────────────
      PROJETO_REGEX.lastIndex = 0
      const projetoMatches = Array.from(mainContent.matchAll(PROJETO_REGEX))
      if (projetoMatches.length > 0) {
        updateMessage(agentType, assistantId, mainContent.replace(PROJETO_REGEX, '').trim())
        const pproposals: ProjectProposal[] = projetoMatches.map(m => ({
          id: `pp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          triggeredByMsgId: assistantId,
          name: m[1],
          clientId: null,
          type: 'Other',
          startDate: (() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` })(),
          description: '',
          gestor: '',
          confirmed: false,
          discarded: false,
        }))
        setProjectProposals(prev => [...prev, ...pproposals])
      }

      // ── Artifact export marker ───────────────────────────────────────────
      ARTEFATO_REGEX.lastIndex = 0
      const artifactMatch = ARTEFATO_REGEX.exec(mainContent)
      if (artifactMatch) {
        updateMessage(agentType, assistantId, mainContent.replace(ARTEFATO_REGEX, '').trim())
        setArtifactTitles(prev => ({ ...prev, [assistantId]: artifactMatch[1] }))
      }

      // ── Consultation marker ──────────────────────────────────────────────
      const match = CONSULT_REGEX.exec(mainContent)
      if (match) {
        const toAgentType = match[1] as AgentType
        const question = match[2]
        updateMessage(agentType, assistantId, mainContent.replace(match[0], '').trim())

        const toAgent = getAgent(toAgentType)
        const consultId = `c-${Date.now()}`
        setConsultations(prev => [...prev, { id: consultId, triggeredByMsgId: assistantId, fromAgent: agent, toAgent, question, answer: '', streaming: true }])

        const consultAnswer = await runStream(
          buildSystemPrompt(toAgent), [{ role: 'user', content: question }], toAgent.model, toAgent.temperature,
          (chunk) => setConsultations(prev => prev.map(c => c.id === consultId ? { ...c, answer: c.answer + chunk } : c)),
          signal,
        )
        setConsultations(prev => prev.map(c => c.id === consultId ? { ...c, streaming: false } : c))

        const synthesisHistory = [...history, { role: 'assistant', content: mainContent.replace(match[0], '').trim() }, { role: 'user', content: `[Resultado da consulta com ${toAgent.name}]: ${consultAnswer || '(sem resposta)'}` }]
        addMessage(agentType, { id: `a-${Date.now()}`, role: 'assistant', content: '' })
        await runStream(buildSystemPrompt(agent), synthesisHistory, modelOverride || agent.model, effortLevel === 'focado' ? 0.2 : effortLevel === 'criativo' ? 0.95 : agent.temperature, (chunk) => appendToLast(agentType, chunk), signal)
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name !== 'AbortError') {
        const msg = err.message ?? 'Erro desconhecido'
        appendToLast(agentType, `_(Erro ao conectar com o agente: ${msg})_`)
      }
    } finally {
      setStreaming(agentType, false)
    }
  }, [input, attachments, streaming, messages, agentType, addMessage, appendToLast, updateMessage, setStreaming, buildSystemPrompt, agent, runStream, selectedProjectId])

  const handleAbort = useCallback(() => {
    abortRef.current?.abort()
  }, [])

  // ── Voice mode ──────────────────────────────────────────────────────────────

  /** Strip markdown and emojis so TTS reads clean prose */
  function stripMarkdownForTTS(md: string): string {
    return md
      .replace(/```[\s\S]*?```/g, '')
      .replace(/`[^`]*`/g, '')
      .replace(/\[CONSULT:[^\]]+\]/g, '')
      .replace(/\[ARTEFATO:[^\]]+\]/g, '')
      .replace(/#+\s+/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^\s*[-*+]\s/gm, '')
      .replace(/^\s*\d+\.\s/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      // Strip all emoji (supplementary planes + misc symbols + variation selectors)
      .replace(/[\u{1F300}-\u{1FAFF}]|[\u{2600}-\u{27BF}]|[\u{2300}-\u{23FF}]|️/gu, '')
      .trim()
  }

  /** How many chars of the current assistant message are already queued for TTS */
  const spokenUpToRef = useRef(0)

  const startListening = useCallback((sendFn: (t: string) => void) => {
    if (typeof window === 'undefined') return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) return
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec = new SR() as any
    rec.lang = 'pt-BR'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    rec.onresult = (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
      const text: string = e.results[0][0].transcript.trim()
      if (text) sendFn(text)
    }
    rec.onerror = () => setVoiceState('idle')
    rec.onend   = () => setVoiceState(s => s === 'listening' ? 'idle' : s)

    rec.start()
    recognitionRef.current = rec
    setVoiceState('listening')
  }, [])

  /**
   * During streaming: as soon as a complete sentence is available in the
   * assistant message, queue it for TTS immediately — no waiting for the
   * full response.
   */
  useEffect(() => {
    if (!voiceMode || !streaming) return
    const last = messages[messages.length - 1]
    if (!last || last.role !== 'assistant' || !last.content) return
    if (typeof window === 'undefined' || !window.speechSynthesis) return

    // Drain all complete sentences from the unspoken tail
    let pos = spokenUpToRef.current
    const content = last.content
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const unspoken = content.slice(pos)
      // Sentence boundary: . ! ? followed by whitespace/newline, or a lone newline
      const idx = unspoken.search(/[.!?](\s|\n|$)|\n/)
      if (idx === -1) break
      const raw = unspoken.slice(0, idx + 1)
      pos += idx + 1
      const clean = stripMarkdownForTTS(raw).trim()
      if (!clean) continue
      setVoiceState('speaking')
      const utt = new SpeechSynthesisUtterance(clean)
      utt.lang = 'pt-BR'
      utt.rate = 3.5
      window.speechSynthesis.speak(utt)
    }
    spokenUpToRef.current = pos
  }, [messages, streaming, voiceMode])

  /**
   * When streaming ends: speak any remaining text (last partial sentence),
   * then kick off listening again.
   */
  useEffect(() => {
    if (!voiceMode) { prevStreamingRef.current = streaming; return }
    const justFinished = prevStreamingRef.current && !streaming
    prevStreamingRef.current = streaming
    if (!justFinished) return

    const last = messages[messages.length - 1]
    const remaining = stripMarkdownForTTS(
      (last?.role === 'assistant' ? last.content ?? '' : '').slice(spokenUpToRef.current)
    ).trim()
    spokenUpToRef.current = 0   // reset for next turn

    const kickListen = () => startListening((t) => sendMessage(t))
    if (typeof window === 'undefined' || !window.speechSynthesis) { kickListen(); return }

    if (remaining) {
      const utt = new SpeechSynthesisUtterance(remaining)
      utt.lang = 'pt-BR'
      utt.rate = 3.5
      utt.onend   = kickListen
      utt.onerror = kickListen
      window.speechSynthesis.speak(utt)
    } else if (window.speechSynthesis.speaking) {
      // Sentences from the streaming phase are still playing — poll until done
      const poll = () => {
        if (window.speechSynthesis.speaking) setTimeout(poll, 150)
        else kickListen()
      }
      setTimeout(poll, 150)
    } else {
      kickListen()
    }
  }, [streaming, voiceMode, messages, startListening, sendMessage])

  const toggleVoiceMode = useCallback(() => {
    if (voiceMode) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(recognitionRef.current as any)?.stop?.()
      window.speechSynthesis?.cancel?.()
      setVoiceMode(false)
      setVoiceState('idle')
    } else {
      setVoiceMode(true)
      startListening((t) => sendMessage(t))
    }
  }, [voiceMode, startListening, sendMessage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (streaming) handleAbort()
      else sendMessage()
    }
  }

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploading(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      try {
        const res = await fetch('/api/extract-text', { method: 'POST', body: fd })
        const data = await res.json()
        if (data.text) {
          setAttachments(prev => [...prev, { name: file.name, text: data.text, size: file.size }])
        }
      } catch {
        // silently ignore extraction errors
      }
    }
    setUploading(false)
    e.target.value = ''
  }, [])

  const stopVoice = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(recognitionRef.current as any)?.stop?.()
    window.speechSynthesis?.cancel?.()
    setVoiceMode(false)
    setVoiceState('idle')
  }, [])

  const handleNewChat = () => { stopVoice(); clearMessages(agentType); setConsultations([]); setQuickReplies({}); setTaskProposals([]); setProjectProposals([]); setArtifactTitles({}); setInput(''); setAttachments([]) }
  const canSend = (!!(input.trim()) || attachments.length > 0 || pastedImages.length > 0) && !uploading

  return (
    <div style={{
      position: 'fixed', top: 0, bottom: 0,
      right: rightOffset, width: panelWidth,
      zIndex: 2000,
      background: 'var(--white)',
      boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
      display: 'flex', flexDirection: 'column',
      animation: 'panelSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both',
      transition: 'right 0.28s cubic-bezier(0.34,1.1,0.64,1)',
    }}>
      {/* Resize handle — drag left edge to widen */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          position: 'absolute', left: 0, top: 0, bottom: 0, width: 6,
          cursor: 'ew-resize', zIndex: 10,
          background: 'transparent',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = agent.color + '30')}
        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
      />

      {/* Header */}
      <div style={{ background: `linear-gradient(135deg, ${agent.color}14 0%, ${agent.color}05 100%)`, borderBottom: `1px solid ${agent.color}22`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px' }}>
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: agent.color + '20', border: `2px solid ${agent.color}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, boxShadow: `0 0 0 4px ${agent.color}12` }}>
              {agent.emoji}
            </div>
            <div style={{ position: 'absolute', bottom: 1, right: 1, width: 9, height: 9, borderRadius: '50%', background: '#22c55e', border: '2px solid var(--white)', boxShadow: '0 0 0 2px rgba(34,197,94,0.25)' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', lineHeight: 1.2 }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: agent.color, marginTop: 1, fontWeight: 600 }}>{agent.role}</div>
          </div>
          {/* New chat — broom/reset icon */}
          <button onClick={() => messages.length > 0 ? setConfirmModal('clear') : handleNewChat()} title="Novo chat" style={{ width: 32, height: 32, borderRadius: 10, border: `1px solid ${agent.color}30`, background: agent.color + '10', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: agent.color, flexShrink: 0, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = agent.color + '22'; e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = agent.color + '10'; e.currentTarget.style.transform = 'scale(1)' }}>
            <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
              <path d="M2 11h10M8 3l3 3-5 5-3-3 5-5z" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          {/* Open another agent alongside */}
          <AgentPicker currentAgentType={agentType} />
          <button onClick={() => messages.length > 0 ? setConfirmModal('close') : closeChat(agentType)} style={{ width: 32, height: 32, borderRadius: 10, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)', flexShrink: 0, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025'; e.currentTarget.style.transform = 'scale(1.08)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)'; e.currentTarget.style.transform = 'scale(1)' }}>
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: agent.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 2, opacity: 0.8 }}>Contexto</span>
          <ContextDropdown label="Conversa geral" value={selectedProjectId} options={projectOptions} onChange={id => setProject(agentType, id)} color={agent.color} />
          {selectedProjectId && <ContextDropdown label="Todos os entregáveis" value={selectedTaskId} options={taskOptions} onChange={id => setTask(agentType, id)} color={agent.color} disabled={taskOptions.length === 0} />}
        </div>
        {/* Model + effort controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 16px 10px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: agent.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginRight: 2, opacity: 0.8 }}>Modelo</span>
          <ContextDropdown
            label="Padrão"
            value={modelOverride || null}
            options={[
              { id: 'claude-haiku-4-5-20251001', label: 'Haiku' },
              { id: 'claude-sonnet-4-6',          label: 'Sonnet' },
              { id: 'claude-opus-4-7',            label: 'Opus' },
            ]}
            onChange={v => setModelOverride(v ?? '')}
            color={agent.color}
          />
          <span style={{ fontSize: 10, fontWeight: 700, color: agent.color, textTransform: 'uppercase', letterSpacing: '0.07em', marginLeft: 4, marginRight: 2, opacity: 0.8 }}>Esforço</span>
          <ContextDropdown
            label="Balanceado"
            value={effortLevel === 'balanceado' ? null : effortLevel}
            options={[
              { id: 'focado',    label: 'Focado' },
              { id: 'criativo',  label: 'Criativo' },
            ]}
            onChange={v => setEffortLevel((v ?? 'balanceado') as 'focado' | 'balanceado' | 'criativo')}
            color={agent.color}
          />
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <div ref={scrollAreaRef} onScroll={handleScrollAreaScroll} style={{ height: '100%', overflowY: 'auto', padding: '20px 16px 8px', display: 'flex', flexDirection: 'column', gap: 14, scrollbarWidth: 'none' }}>
          {messages.length === 0 ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '40px 24px', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: `radial-gradient(circle at 35% 35%, ${agent.color}30, ${agent.color}10)`, border: `2px solid ${agent.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, marginBottom: 4, animation: 'floatBob 3s ease-in-out infinite', boxShadow: `0 8px 28px ${agent.color}20` }}>
                {agent.emoji}
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--black)' }}>{agent.name}</div>
              <div style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.6, maxWidth: 260 }}>{agent.role}</div>
              <div style={{ marginTop: 4, padding: '8px 14px', borderRadius: 20, background: agent.color + '10', border: `1px solid ${agent.color}25`, fontSize: 11, color: agent.color, fontWeight: 600 }}>
                Como posso ajudar?
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={msg.id}>
                <MessageBubble msg={msg} agentColor={agent.color} agentEmoji={agent.emoji} isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'} />
                {consultations.filter(c => c.triggeredByMsgId === msg.id).map(c => <ConsultationBubble key={c.id} record={c} />)}
                {quickReplies[msg.id] && !streaming && (
                  <QuickReplies
                    choices={quickReplies[msg.id]}
                    color={agent.color}
                    onSelect={(choice) => {
                      setQuickReplies(prev => { const n = { ...prev }; delete n[msg.id]; return n })
                      sendMessage(choice)
                    }}
                  />
                )}
                {taskProposals.filter(p => p.triggeredByMsgId === msg.id && !p.discarded).map(p => (
                  <TaskProposalCard
                    key={p.id}
                    proposal={p}
                    agentColor={agent.color}
                    onUpdate={(patch) => setTaskProposals(prev => prev.map(x => x.id === p.id ? { ...x, ...patch } : x))}
                    onConfirm={() => setTaskProposals(prev => prev.map(x => x.id === p.id ? { ...x, confirmed: true } : x))}
                    onDiscard={() => setTaskProposals(prev => prev.map(x => x.id === p.id ? { ...x, discarded: true } : x))}
                    projects={projects}
                    weeks={weeks}
                  />
                ))}
                {projectProposals.filter(p => p.triggeredByMsgId === msg.id && !p.discarded).map(p => (
                  <ProjectProposalCard
                    key={p.id}
                    proposal={p}
                    agentColor={agent.color}
                    clients={clients}
                    onUpdate={(patch) => setProjectProposals(prev => prev.map(x => x.id === p.id ? { ...x, ...patch } : x))}
                    onConfirm={() => setProjectProposals(prev => prev.map(x => x.id === p.id ? { ...x, confirmed: true } : x))}
                    onDiscard={() => setProjectProposals(prev => prev.map(x => x.id === p.id ? { ...x, discarded: true } : x))}
                  />
                ))}
                {artifactTitles[msg.id] && (
                  <ArtifactDownloadBar
                    msgId={msg.id}
                    title={artifactTitles[msg.id]}
                    content={msg.content}
                    agentColor={agent.color}
                  />
                )}
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
        {showScrollBtn && (
          <button onClick={scrollToBottom} style={{ position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 5, padding: '6px 14px', borderRadius: 20, background: agent.color, border: 'none', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px ${agent.color}50`, animation: 'fadeIn 0.2s ease both', zIndex: 10 }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(-50%) scale(1.06)' }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateX(-50%) scale(1)' }}>
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none"><path d="M2 4l4 4 4-4" stroke="#fff" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/></svg>
            Nova mensagem
          </button>
        )}
      </div>

      {/* Input */}
      <div style={{ padding: '10px 14px 12px', borderTop: `1px solid ${inputFocused ? agent.color + '30' : 'var(--gray3)'}`, background: inputFocused ? agent.color + '04' : 'var(--white)', flexShrink: 0, transition: 'border-color 0.2s ease, background 0.2s ease' }}>

        {/* Hidden file input */}
        <input ref={fileInputRef} type="file" accept=".pdf,.docx,.doc,.pptx,.ppt,.txt,.md,.csv,.json,.xml,.html,.htm,.yaml,.yml" multiple onChange={handleFileChange} style={{ display: 'none' }} />

        {/* Attachment chips */}
        {attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {attachments.map((a, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px 4px 10px', borderRadius: 20, background: agent.color + '12', border: `1px solid ${agent.color}30`, fontSize: 11, fontWeight: 600, color: agent.color, maxWidth: 200 }}>
                <svg width={11} height={11} viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M7 1H3a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4L7 1z" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
                  <path d="M7 1v3h3" stroke="currentColor" strokeWidth={1.3} strokeLinejoin="round"/>
                </svg>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{a.name}</span>
                <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))} style={{ width: 14, height: 14, borderRadius: '50%', border: 'none', background: agent.color + '25', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                  <svg width={8} height={8} viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke={agent.color} strokeWidth={1.4} strokeLinecap="round"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Pasted image thumbnails */}
        {pastedImages.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {pastedImages.map((img, i) => (
              <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.preview}
                  alt={img.name}
                  style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 10, border: `1.5px solid ${agent.color}40`, display: 'block' }}
                />
                <button
                  onClick={() => setPastedImages(prev => prev.filter((_, j) => j !== i))}
                  style={{
                    position: 'absolute', top: -5, right: -5,
                    width: 17, height: 17, borderRadius: '50%',
                    background: 'var(--black)', border: '1.5px solid var(--white)',
                    cursor: 'pointer', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', padding: 0, zIndex: 1,
                  }}
                >
                  <svg width={7} height={7} viewBox="0 0 8 8" fill="none">
                    <path d="M1 1l6 6M7 1L1 7" stroke="#fff" strokeWidth={1.5} strokeLinecap="round"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Uploading indicator */}
        {uploading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 11, color: agent.color, fontWeight: 600 }}>
            <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${agent.color}40`, borderTopColor: agent.color, animation: 'spin-slow 0.7s linear infinite', flexShrink: 0 }} />
            Lendo arquivo…
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: inputFocused ? 'var(--white)' : 'var(--bg)', border: `1.5px solid ${inputFocused ? agent.color + '60' : 'var(--gray3)'}`, borderRadius: 14, padding: '9px 9px 9px 14px', boxShadow: inputFocused ? `0 0 0 4px ${agent.color}12` : 'none', transition: 'all 0.2s ease' }}>
          <textarea ref={textareaRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} onFocus={() => setInputFocused(true)} onBlur={() => setInputFocused(false)} placeholder={`Pergunte ao ${agent.name}…`} rows={1}
            style={{ flex: 1, border: 'none', background: 'transparent', resize: 'none', outline: 'none', fontSize: 13, color: 'var(--black)', lineHeight: 1.5, fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto' }} />
          {/* Paperclip button */}
          <button onClick={() => fileInputRef.current?.click()} disabled={uploading}
            title="Anexar arquivo (PDF, DOCX, TXT…)"
            style={{ width: 32, height: 32, borderRadius: 9, border: `1px solid ${agent.color}30`, background: 'transparent', cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: agent.color, opacity: uploading ? 0.4 : 0.7, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { if (!uploading) { e.currentTarget.style.background = agent.color + '12'; e.currentTarget.style.opacity = '1' } }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = uploading ? '0.4' : '0.7' }}>
            <svg width={15} height={15} viewBox="0 0 15 15" fill="none">
              <path d="M13.5 7.5l-6.5 6.5a4 4 0 0 1-5.657-5.657L7.5 2.5a2.5 2.5 0 0 1 3.536 3.536L4.879 12.18a1 1 0 0 1-1.415-1.414l6.157-6.157" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Voice mode button */}
          <button
            onClick={toggleVoiceMode}
            title={voiceMode ? 'Desativar modo conversa' : 'Modo conversa (voz)'}
            style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              border: voiceMode ? 'none' : `1px solid ${agent.color}30`,
              background: voiceMode ? agent.color : 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: voiceMode ? '#fff' : agent.color,
              opacity: voiceMode ? 1 : 0.7,
              boxShadow: voiceMode ? `0 2px 10px ${agent.color}50` : 'none',
              transition: 'all 0.18s ease',
              position: 'relative',
            }}
            onMouseEnter={e => { if (!voiceMode) { e.currentTarget.style.background = agent.color + '12'; e.currentTarget.style.opacity = '1' } }}
            onMouseLeave={e => { if (!voiceMode) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.opacity = '0.7' } }}
          >
            {/* Pulsing ring when listening */}
            {voiceState === 'listening' && (
              <span style={{
                position: 'absolute', inset: -4, borderRadius: 13,
                border: `2px solid ${agent.color}`,
                animation: 'breathe-ring 1.2s ease-in-out infinite',
                pointerEvents: 'none',
              }} />
            )}
            {voiceState === 'speaking' ? (
              /* Sound wave icon */
              <svg width={15} height={15} viewBox="0 0 15 15" fill="none">
                <path d="M1 5.5v4M4 3.5v8M7 1.5v12M10 3.5v8M13 5.5v4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
              </svg>
            ) : (
              /* Microphone icon */
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <rect x="4.5" y="1" width="5" height="7" rx="2.5" stroke="currentColor" strokeWidth={1.4}/>
                <path d="M2 7a5 5 0 0 0 10 0" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
                <line x1="7" y1="12" x2="7" y2="13.5" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round"/>
              </svg>
            )}
          </button>
          {streaming ? (
            <button
              onClick={handleAbort}
              onMouseEnter={() => setSendHov(true)}
              onMouseLeave={() => setSendHov(false)}
              title="Parar geração (Enter)"
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: agent.color, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: sendHov ? 'scale(1.1)' : 'scale(1)', boxShadow: sendHov ? `0 4px 14px ${agent.color}50` : `0 2px 8px ${agent.color}30`, transition: 'transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.18s ease' }}>
              <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
                <rect x="2" y="2" width="8" height="8" rx="1.5" fill="#fff"/>
              </svg>
            </button>
          ) : (
            <button onClick={() => sendMessage()} onMouseEnter={() => setSendHov(true)} onMouseLeave={() => setSendHov(false)} disabled={!canSend}
              style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: canSend ? agent.color : 'var(--gray3)', cursor: canSend ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transform: canSend && sendHov ? 'scale(1.1)' : 'scale(1)', boxShadow: canSend && sendHov ? `0 4px 14px ${agent.color}50` : canSend ? `0 2px 8px ${agent.color}30` : 'none', transition: 'transform 0.18s cubic-bezier(0.34,1.4,0.64,1), box-shadow 0.18s ease', opacity: canSend ? 1 : 0.5 }}>
              <svg width={15} height={15} viewBox="0 0 14 14" fill="none"><path d="M12 7L2 2l2 5-2 5 10-5z" fill="#fff" /></svg>
            </button>
          )}
        </div>
        <div style={{ fontSize: 9, color: voiceMode ? agent.color : 'var(--gray2)', textAlign: 'center', marginTop: 6, opacity: voiceMode ? 1 : 0.7, fontWeight: voiceMode ? 700 : 400, transition: 'color 0.2s, opacity 0.2s' }}>
          {voiceMode
            ? voiceState === 'listening' ? '🎤 Ouvindo… fale agora'
            : voiceState === 'speaking'  ? '🔊 Respondendo…'
            : '💬 Modo conversa ativo — aguardando'
            : 'Enter para enviar · Shift+Enter para quebrar linha · Cole imagem com Ctrl+V'
          }
        </div>
      </div>

      {/* ── Confirmation modal ───────────────────────────────────────────────── */}
      {confirmModal && (
        <div onClick={() => setConfirmModal(null)} style={{ position: 'fixed', inset: 0, zIndex: 99999, background: 'rgba(18,19,22,0.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--white)', borderRadius: 16, padding: '24px 24px 20px', width: 268, boxShadow: '0 20px 60px rgba(0,0,0,0.28)', animation: 'fadeIn 0.15s ease both' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 8 }}>
              {confirmModal === 'clear' ? 'Limpar conversa?' : 'Fechar chat?'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--gray2)', marginBottom: 22, lineHeight: 1.5 }}>
              {confirmModal === 'clear'
                ? 'O histórico desta conversa será apagado permanentemente.'
                : 'O chat será fechado e o histórico da conversa será perdido.'}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setConfirmModal(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', fontSize: 13, fontWeight: 600, color: 'var(--gray)', transition: 'background 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                Cancelar
              </button>
              <button
                onClick={() => { if (confirmModal === 'clear') { handleNewChat() } else { closeChat(agentType) }; setConfirmModal(null) }}
                style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: 'none', background: agent.color, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: `0 4px 12px ${agent.color}40`, transition: 'opacity 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── ChatPanels — renders all open panels ─────────────────────────────────────

export function ChatPanels() {
  const openChats = useChatStore(s => s.openChats)
  const closeAll  = useChatStore(s => s.closeAll)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])
  if (!mounted || openChats.length === 0) return null

  const totalWidth = openChats.length * PANEL_W + (openChats.length - 1) * PANEL_GAP

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={closeAll}
        style={{
          position: 'fixed', inset: 0, zIndex: 1999,
          background: `rgba(18,19,22,${openChats.length === 1 ? '0.20' : '0.12'})`,
          backdropFilter: openChats.length === 1 ? 'blur(2px)' : 'none',
          WebkitBackdropFilter: openChats.length === 1 ? 'blur(2px)' : 'none',
          animation: 'fadeIn 0.18s ease both',
        }}
      />

      {/* Clip hint — shows how many panels are open */}
      {openChats.length > 1 && (
        <div style={{
          position: 'fixed', bottom: 32, right: totalWidth + 16, zIndex: 2001,
          background: 'var(--black)', color: '#fff',
          fontSize: 11, fontWeight: 700,
          padding: '5px 10px', borderRadius: 20,
          animation: 'fadeIn 0.2s ease both',
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}>
          {openChats.length} chats abertos
        </div>
      )}

      {openChats.map((type, i) => {
        // Rightmost = last in array = right: 0
        const fromRight = (openChats.length - 1 - i) * (PANEL_W + PANEL_GAP)
        return <ChatPanelInner key={type} agentType={type} rightOffset={fromRight} />
      })}
    </>
  )
}

// Keep named export for backwards compat (AppShell uses ChatPanel)
export { ChatPanels as ChatPanel }
