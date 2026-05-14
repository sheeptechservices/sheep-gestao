'use client'
import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { type AgentDefinition } from '@/lib/agents'
import { useAgentsStore } from '@/stores/agentsStore'

interface KnowledgeFile {
  id: string
  name: string
  size: number
  type: string
}

type Agent = AgentDefinition

const MODELS = [
  { value: 'claude-opus-4-7',        label: 'Claude Opus 4.7 — mais poderoso'   },
  { value: 'claude-sonnet-4-6',      label: 'Claude Sonnet 4.6 — balanceado'    },
  { value: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — mais rápido' },
]

const AGENT_STATUS = {
  true:  { label: 'Ativo',   color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)'  },
  false: { label: 'Inativo', color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
} as const

function EnabledPicker({ value, agentColor, onChange }: { value: boolean; agentColor: string; onChange: (v: boolean) => void }) {
  const [open, setOpen] = useState(false)
  const [hov,  setHov]  = useState(false)
  const ref             = useRef<HTMLDivElement>(null)
  const cfg             = AGENT_STATUS[String(value) as 'true' | 'false']

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <div ref={ref} style={{ position: 'relative', width: 'fit-content' }}>
      <span
        onClick={e => { e.stopPropagation(); setOpen(o => !o) }}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100,
          color: cfg.color, background: cfg.bg, whiteSpace: 'nowrap',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4,
          border: `1px solid ${hov || open ? cfg.color + '55' : 'transparent'}`,
          transition: 'border-color 0.15s',
          userSelect: 'none',
        }}
      >
        {cfg.label}
        <svg width={8} height={8} viewBox="0 0 8 8" fill="none" style={{ opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M1 3l3 3 3-3" stroke={cfg.color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>

      {open && createPortal(
        (() => {
          const rect = ref.current?.getBoundingClientRect()
          return (
            <div
              style={{
                position: 'fixed',
                top: (rect?.bottom ?? 0) + 6,
                left: rect?.left ?? 0,
                zIndex: 4000,
                background: 'var(--white)',
                border: '1px solid var(--gray3)',
                borderRadius: 10,
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                padding: 4,
                display: 'flex', flexDirection: 'column', gap: 2,
                minWidth: 120,
                animation: 'panelUp 0.18s ease both',
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              {([true, false] as const).map(v => {
                const c   = AGENT_STATUS[String(v) as 'true' | 'false']
                const sel = v === value
                return (
                  <div
                    key={String(v)}
                    onClick={e => { e.stopPropagation(); onChange(v); setOpen(false) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: 7, cursor: 'pointer',
                      background: sel ? c.bg : 'transparent',
                      transition: 'background 0.12s',
                    }}
                    onMouseEnter={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                    onMouseLeave={e => { if (!sel) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                  >
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, fontWeight: sel ? 700 : 500, color: sel ? c.color : 'var(--gray)' }}>
                      {c.label}
                    </span>
                    {sel && (
                      <svg width={10} height={10} viewBox="0 0 10 10" fill="none" style={{ marginLeft: 'auto' }}>
                        <path d="M2 5l2.5 2.5L8 3" stroke={c.color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                )
              })}
            </div>
          )
        })(),
        document.body
      )}
    </div>
  )
}

function AgentRow({ agent, onEdit, onToggleEnabled }: { agent: Agent; onEdit: () => void; onToggleEnabled: (v: boolean) => void }) {
  const [hov, setHov] = useState(false)
  const modelLabel = MODELS.find(m => m.value === agent.model)?.label.split(' — ')[0] ?? agent.model
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onEdit}
      style={{
        display: 'grid',
        gridTemplateColumns: '4px 48px 1fr 90px 160px 80px 36px',
        alignItems: 'center',
        gap: 0,
        height: 52,
        cursor: 'pointer',
        borderBottom: '1px solid var(--gray3)',
        background: hov ? 'var(--bg)' : 'transparent',
        transition: 'background 0.14s',
      }}
    >
      {/* Color stripe */}
      <div style={{ width: 4, height: 52, background: agent.color, borderRadius: '2px 0 0 2px', flexShrink: 0 }} />

      {/* Emoji */}
      <div style={{
        width: 32, height: 32, borderRadius: '50%', margin: '0 8px',
        background: agent.color + '15',
        border: `1.5px solid ${agent.color}33`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 16, flexShrink: 0,
      }}>
        {agent.emoji}
      </div>

      {/* Name + role */}
      <div style={{ minWidth: 0, paddingRight: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {agent.role}
        </div>
      </div>

      {/* Status picker */}
      <div style={{ paddingRight: 12 }} onClick={e => e.stopPropagation()}>
        <EnabledPicker
          value={agent.enabled}
          agentColor={agent.color}
          onChange={v => onToggleEnabled(v)}
        />
      </div>

      {/* Model */}
      <div style={{ paddingRight: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: agent.color, flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--gray)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {modelLabel}
          </span>
        </div>
      </div>

      {/* Temperature */}
      <div style={{ paddingRight: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ flex: 1, height: 4, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{ width: `${agent.temperature * 100}%`, height: '100%', background: agent.color, borderRadius: 100 }} />
          </div>
          <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600, flexShrink: 0, width: 22 }}>
            {agent.temperature}
          </span>
        </div>
      </div>

      {/* Edit icon */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={15} height={15} viewBox="0 0 16 16" fill="none" style={{ opacity: hov ? 0.5 : 0.2, transition: 'opacity 0.18s' }}>
          <path d="M11.5 2.5l2 2-7 7H4.5v-2l7-7zM10 4l2 2" stroke="var(--gray)" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
    </div>
  )
}

function FileTypeIcon({ type }: { type: string }) {
  const isPdf = type === 'application/pdf'
  return (
    <div style={{
      width: 32, height: 32, borderRadius: 6, flexShrink: 0,
      background: isPdf ? 'rgba(217,48,37,0.10)' : 'rgba(59,130,246,0.10)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
        {isPdf ? (
          <>
            <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="#D93025" strokeWidth="1.3"/>
            <path d="M5 7h6M5 9.5h4M5 4.5h3" stroke="#D93025" strokeWidth="1.1" strokeLinecap="round"/>
            <path d="M9 1v3.5H12" stroke="#D93025" strokeWidth="1.2" strokeLinecap="round"/>
          </>
        ) : (
          <>
            <rect x="2" y="1" width="10" height="13" rx="1.5" stroke="#3B82F6" strokeWidth="1.3"/>
            <path d="M5 6h6M5 8.5h6M5 11h4" stroke="#3B82F6" strokeWidth="1.1" strokeLinecap="round"/>
            <path d="M9 1v3.5H12" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round"/>
          </>
        )}
      </svg>
    </div>
  )
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function EditModal({ agent, onSave, onClose }: {
  agent: Agent
  onSave: (updated: Agent) => void
  onClose: () => void
}) {
  const [form, setForm]   = useState<Agent>({ ...agent })
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function addFiles(fileList: FileList) {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    const newFiles: KnowledgeFile[] = Array.from(fileList)
      .filter(f => allowed.includes(f.type))
      .map(f => ({ id: `${Date.now()}-${Math.random()}`, name: f.name, size: f.size, type: f.type }))
    if (newFiles.length === 0) return
    setForm(f => ({ ...f, knowledgeFiles: [...f.knowledgeFiles, ...newFiles] }))
  }

  function removeFile(id: string) {
    setForm(f => ({ ...f, knowledgeFiles: f.knowledgeFiles.filter(kf => kf.id !== id) }))
  }

  function update<K extends keyof Agent>(key: K, value: Agent[K]) {
    setForm(f => ({ ...f, [key]: value }))
  }

  const labelStyle: React.CSSProperties = {
    fontSize: 10, fontWeight: 800, textTransform: 'uppercase',
    letterSpacing: '0.07em', color: 'var(--gray2)', marginBottom: 6, display: 'block',
  }
  const inputStyle: React.CSSProperties = {
    width: '100%', fontSize: 13, fontWeight: 500,
    color: 'var(--black)', background: 'var(--white)',
    border: '1px solid var(--gray3)', borderRadius: 8,
    padding: '9px 12px', outline: 'none',
    transition: 'border-color 0.15s',
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 3000,
        background: 'rgba(18,19,22,0.40)',
        backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.15s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)', borderRadius: 18,
          width: '100%', maxWidth: 580,
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          animation: 'modalSlideUp 0.22s ease both',
        display: 'flex', flexDirection: 'column', maxHeight: '90vh',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '20px 24px', borderBottom: '1px solid var(--gray3)',
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: '50%',
            background: form.color + '15', border: `2px solid ${form.color}33`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18,
          }}>
            {form.emoji}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)' }}>
              Configurar · {form.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--gray2)' }}>{form.role}</div>
          </div>
          <button onClick={onClose} style={{
            marginLeft: 'auto', background: 'none', border: 'none',
            cursor: 'pointer', padding: 4, color: 'var(--gray2)',
          }}>
            <svg width={18} height={18} viewBox="0 0 18 18" fill="none">
              <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>Agente ativo</div>
              <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 2 }}>Exibe no botão flutuante e aceita conversas</div>
            </div>
            <button
              onClick={() => update('enabled', !form.enabled)}
              style={{
                width: 44, height: 24, borderRadius: 100, border: 'none', cursor: 'pointer',
                background: form.enabled ? form.color : 'var(--gray3)',
                position: 'relative', transition: 'background 0.2s',
              }}
            >
              <div style={{
                position: 'absolute', top: 2, width: 20, height: 20, borderRadius: '50%', background: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                left: form.enabled ? 22 : 2,
                transition: 'left 0.2s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </button>
          </div>

          {/* Name + Emoji */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Nome</label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={e => update('name', e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = form.color}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--gray3)'}
              />
            </div>
            <div>
              <label style={labelStyle}>Emoji</label>
              <input
                style={{ ...inputStyle, textAlign: 'center' }}
                value={form.emoji}
                onChange={e => update('emoji', e.target.value)}
                onFocus={e => e.currentTarget.style.borderColor = form.color}
                onBlur={e => e.currentTarget.style.borderColor = 'var(--gray3)'}
              />
            </div>
          </div>

          {/* Role */}
          <div>
            <label style={labelStyle}>Descrição curta</label>
            <input
              style={inputStyle}
              value={form.role}
              onChange={e => update('role', e.target.value)}
              onFocus={e => e.currentTarget.style.borderColor = form.color}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--gray3)'}
            />
          </div>

          {/* Model + Temperature */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 130px', gap: 12 }}>
            <div>
              <label style={labelStyle}>Modelo</label>
              <select
                value={form.model}
                onChange={e => update('model', e.target.value)}
                style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}
              >
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Temperatura · {form.temperature}</label>
              <input
                type="range" min={0} max={1} step={0.1}
                value={form.temperature}
                onChange={e => update('temperature', parseFloat(e.target.value))}
                style={{ width: '100%', marginTop: 10, accentColor: form.color }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--gray2)', marginTop: 2 }}>
                <span>Preciso</span><span>Criativo</span>
              </div>
            </div>
          </div>

          {/* System prompt */}
          <div>
            <label style={labelStyle}>System Prompt</label>
            <textarea
              value={form.systemPrompt}
              onChange={e => update('systemPrompt', e.target.value)}
              rows={8}
              style={{
                ...inputStyle, resize: 'vertical', lineHeight: 1.6,
                fontFamily: 'inherit',
              }}
              onFocus={e => e.currentTarget.style.borderColor = form.color}
              onBlur={e => e.currentTarget.style.borderColor = 'var(--gray3)'}
            />
          </div>

          {/* Knowledge base */}
          <div>
            <label style={labelStyle}>Base de conhecimento</label>
            <p style={{ fontSize: 11, color: 'var(--gray2)', marginBottom: 10, marginTop: -2 }}>
              Arquivos PDF e DOCX que o agente usará como referência de templates e contexto.
            </p>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true) }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? form.color : 'var(--gray3)'}`,
                borderRadius: 10,
                padding: '18px 16px',
                textAlign: 'center',
                cursor: 'pointer',
                background: dragging ? `${form.color}08` : 'var(--bg)',
                transition: 'border-color 0.18s, background 0.18s',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                multiple
                style={{ display: 'none' }}
                onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = '' }}
              />
              <svg width={20} height={20} viewBox="0 0 20 20" fill="none" style={{ margin: '0 auto 6px', display: 'block', opacity: 0.4 }}>
                <path d="M10 13V4M10 4L7 7M10 4l3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 14v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round"/>
              </svg>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray)' }}>
                Arraste arquivos ou <span style={{ color: form.color, fontWeight: 700 }}>clique para selecionar</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 3 }}>PDF · DOCX</div>
            </div>

            {/* File list */}
            {form.knowledgeFiles.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                {form.knowledgeFiles.map(file => (
                  <div key={file.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 10px', borderRadius: 8,
                    border: '1px solid var(--gray3)', background: 'var(--white)',
                  }}>
                    <FileTypeIcon type={file.type} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {file.name}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 1 }}>{formatSize(file.size)}</div>
                    </div>
                    <button
                      onClick={() => removeFile(file.id)}
                      style={{
                        width: 24, height: 24, borderRadius: 6, border: '1px solid var(--gray3)',
                        background: 'var(--bg)', cursor: 'pointer', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        color: 'var(--gray2)',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#D93025'; (e.currentTarget as HTMLButtonElement).style.color = '#D93025' }}
                      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray3)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray2)' }}
                    >
                      <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 10,
          padding: '16px 24px', borderTop: '1px solid var(--gray3)',
        }}>
          <button onClick={onClose} style={{
            padding: '9px 20px', borderRadius: 8, border: '1px solid var(--gray3)',
            background: 'var(--white)', color: 'var(--gray)', fontSize: 12, fontWeight: 600,
            cursor: 'pointer',
          }}>
            Cancelar
          </button>
          <button onClick={() => { onSave(form); onClose() }} style={{
            padding: '9px 20px', borderRadius: 8, border: 'none',
            background: form.color, color: '#fff', fontSize: 12, fontWeight: 800,
            cursor: 'pointer', boxShadow: `0 4px 14px ${form.color}44`,
          }}>
            Salvar configuração
          </button>
        </div>
      </div>
    </div>
  )
}

export function SpecialistsView() {
  const agents      = useAgentsStore(s => s.agents)
  const updateAgent = useAgentsStore(s => s.updateAgent)
  const [editing, setEditing] = useState<Agent | null>(null)

  function saveAgent(updated: Agent) {
    updateAgent(updated)
  }

  const activeCount = agents.filter(a => a.enabled).length

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Especialistas</h1>
          <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
            Configure os agentes de IA disponíveis no sistema
          </p>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
          background: 'var(--primary-dim)', color: 'var(--primary-text)',
          border: '1px solid var(--primary-mid)',
        }}>
          {activeCount} de {agents.length} ativos
        </div>
      </div>

      <div style={{
        background: 'var(--white)',
        border: '1px solid var(--gray3)',
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
      }}>
        {/* Table header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '4px 48px 1fr 90px 160px 80px 36px',
          alignItems: 'center',
          height: 36,
          borderBottom: '1px solid var(--gray3)',
          background: 'var(--bg)',
          paddingRight: 0,
        }}>
          <div />
          <div />
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 12 }}>Agente</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 12 }}>Status</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 12 }}>Modelo</div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', paddingRight: 12 }}>Temperatura</div>
          <div />
        </div>

        {agents.map(agent => (
          <AgentRow
            key={agent.type}
            agent={agent}
            onEdit={() => setEditing(agent)}
            onToggleEnabled={(v) => updateAgent({ ...agent, enabled: v })}
          />
        ))}
      </div>

      {editing && (
        <EditModal
          agent={editing}
          onSave={saveAgent}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  )
}
