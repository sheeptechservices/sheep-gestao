'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import type { Project, ProjectStatus, ProjectType, Client } from '@/lib/types'
import { calcProgress } from '@/lib/utils'
import { AppSelect } from '@/components/ui/AppSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { useBreakpoint } from '@/hooks/useBreakpoint'

// ── Config ────────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:      { label: 'Em curso',        color: '#B45309', bg: 'rgba(251,191,36,0.13)' },
  negotiation: { label: 'Em negociação',   color: '#0284C7', bg: 'rgba(2,132,199,0.11)'  },
  completed:   { label: 'Finalizado',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.11)'  },
  paused:      { label: 'Pausado',         color: '#7C3AED', bg: 'rgba(124,58,237,0.11)' },
  cancelled:   { label: 'Cancelado',       color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
}

export const TYPE_LABEL: Record<ProjectType, string> = {
  AI: 'IA', SaaS: 'SaaS', TaaS: 'TaaS',
  BI: 'BI', PowerPlatform: 'Power Platform', Other: 'Outro',
}

export const ALL_STATUSES: ProjectStatus[] = ['active', 'negotiation', 'paused', 'completed', 'cancelled']

// ── Shared helpers ────────────────────────────────────────────────────────────

export const inputStyle: React.CSSProperties = {
  width: '100%', padding: '8px 11px', borderRadius: 8,
  border: '1px solid var(--gray3)', background: 'var(--bg)',
  fontSize: 13, color: 'var(--black)', fontFamily: 'inherit',
  outline: 'none', transition: 'border-color 0.15s, box-shadow 0.15s',
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        {label}
      </label>
      {children}
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function fileIcon(mime: string, name: string) {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (mime.startsWith('image/')) return '🖼'
  if (ext === 'pdf' || mime === 'application/pdf') return '📄'
  if (['doc','docx'].includes(ext)) return '📝'
  if (['xls','xlsx'].includes(ext)) return '📊'
  if (['ppt','pptx'].includes(ext)) return '📑'
  return '📎'
}

interface ProjectFile { id: string; filename: string; mime_type: string; size: number; text_content: string; created_at: string }

function ProjectFilesSection({ projectId, color }: { projectId: string; color: string }) {
  const [files, setFiles]             = useState<ProjectFile[]>([])
  const [uploading, setUploading]     = useState(false)
  const [dragOver, setDragOver]       = useState(false)
  const [hovZone, setHovZone]         = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [dlOpenId, setDlOpenId]       = useState<string | null>(null)
  const [loadingDocxId, setLoadingDocxId] = useState<string | null>(null)
  const dlRef                         = useRef<HTMLDivElement>(null)
  const fileRef                       = useRef<HTMLInputElement>(null)

  // Close download dropdown on outside click
  useEffect(() => {
    if (!dlOpenId) return
    const h = (e: MouseEvent) => { if (dlRef.current && !dlRef.current.contains(e.target as Node)) setDlOpenId(null) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [dlOpenId])

  useEffect(() => {
    fetch(`/api/projects/${projectId}/files`)
      .then(r => r.json())
      .then(data => Array.isArray(data) && setFiles(data))
      .catch(() => {})
  }, [projectId])

  const uploadFile = async (file: File) => {
    setUploading(true)
    try {
      // 1. Extract text
      const fd = new FormData()
      fd.append('file', file)
      const extRes  = await fetch('/api/extract-text', { method: 'POST', body: fd })
      const extData = await extRes.json()
      if (!extRes.ok || !extData.text) { setUploading(false); return }

      // 2. Save to DB
      const saveRes = await fetch(`/api/projects/${projectId}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename:     file.name,
          mime_type:    file.type || 'application/octet-stream',
          size:         file.size,
          text_content: extData.text,
        }),
      })
      const saved = await saveRes.json()
      if (saveRes.ok && saved.id) {
        setFiles(prev => [saved, ...prev])
      }
    } catch { /* silently ignore */ }
    setUploading(false)
  }

  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return
    Array.from(fileList).forEach(uploadFile)
  }

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return
    await fetch(`/api/projects/${projectId}/files/${confirmDeleteId}`, { method: 'DELETE' })
    setFiles(prev => prev.filter(f => f.id !== confirmDeleteId))
    setConfirmDeleteId(null)
  }

  const baseName = useCallback((filename: string) =>
    filename.replace(/\.[^.]+$/, '') || filename, [])

  const handleDownloadTxt = useCallback((file: ProjectFile) => {
    setDlOpenId(null)
    const blob = new Blob([file.text_content ?? ''], { type: 'text/plain;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = baseName(file.filename) + '.txt'
    a.click()
    URL.revokeObjectURL(url)
  }, [baseName])

  const handleDownloadDocx = useCallback(async (file: ProjectFile) => {
    setDlOpenId(null)
    setLoadingDocxId(file.id)
    try {
      const res  = await fetch('/api/generate-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: file.text_content ?? '', filename: baseName(file.filename) }),
      })
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = baseName(file.filename) + '.docx'
      a.click()
      URL.revokeObjectURL(url)
    } finally {
      setLoadingDocxId(null)
    }
  }, [baseName])

  const handleDownloadPdf = useCallback((file: ProjectFile) => {
    setDlOpenId(null)
    const win = window.open('', '_blank')
    if (!win) return
    const title   = baseName(file.filename)
    const dateStr = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    // Simple markdown-to-HTML: headings, bold, italic, bullets, paragraphs
    const bodyHtml = (file.text_content ?? '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^# (.+)$/gm,  '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm,'<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g,     '<em>$1</em>')
      .replace(/^[*-] (.+)$/gm,  '<li>$1</li>')
      .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
      .replace(/\n{2,}/g, '</p><p>')
      .replace(/\n/g, '<br>')
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="utf-8"><title>${title}</title>
      <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
        body{font-family:'Manrope',sans-serif;font-size:13.5px;line-height:1.75;color:#1a1b1e;max-width:760px;margin:0 auto;padding:48px 56px 64px}
        .cover{border-left:4px solid #84CC16;padding:24px 24px 20px 24px;margin-bottom:36px;background:#84CC1609;border-radius:0 10px 10px 0}
        .cover-label{font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;color:#84CC16;margin-bottom:6px}
        .cover-title{font-size:22px;font-weight:900;color:#0f1012;margin-bottom:8px}
        .cover-meta{font-size:11px;color:#6b7280}
        .body p{margin-bottom:12px} .body h1{font-size:19px;font-weight:800;margin:32px 0 10px;padding-bottom:6px;border-bottom:2px solid #84CC1630}
        .body h2{font-size:15px;font-weight:800;margin:24px 0 8px} .body h3{font-size:13.5px;font-weight:700;margin:18px 0 5px}
        .body ul{padding-left:20px;margin-bottom:12px} .body li{margin-bottom:4px}
        .body strong{font-weight:700} .body em{font-style:italic}
        .footer{margin-top:40px;padding-top:14px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;font-size:10.5px}
        .footer-brand{color:#84CC16;font-weight:700} .footer-date{color:#9ca3af}
        @page{margin:18mm 20mm;size:A4}
        @media print{body{padding:0;max-width:100%}}
      </style></head><body>
      <div class="cover"><div class="cover-label">Sheep Tech · Base de Conhecimento</div>
        <div class="cover-title">${title}</div>
        <div class="cover-meta">${dateStr}</div></div>
      <div class="body"><p>${bodyHtml}</p></div>
      <div class="footer"><span class="footer-brand">sheep-gestao</span><span class="footer-date">Exportado em ${dateStr}</span></div>
      <script>document.fonts.ready.then(function(){window.print()})</script>
    </body></html>`)
    win.document.close()
  }, [baseName])

  const confirmFile = confirmDeleteId ? files.find(f => f.id === confirmDeleteId) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* ── Confirm delete modal ── */}
      {confirmFile && (
        <>
          <div
            onClick={() => setConfirmDeleteId(null)}
            style={{ position: 'fixed', inset: 0, zIndex: 9100, background: 'rgba(0,0,0,0.28)', backdropFilter: 'blur(2px)', animation: 'fadeIn 0.15s ease both' }}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            zIndex: 9101, background: 'var(--white)', borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.22)', padding: '28px 28px 22px',
            width: 340, animation: 'fadeIn 0.18s ease both',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(217,48,37,0.1)', border: '2px solid rgba(217,48,37,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width={18} height={18} viewBox="0 0 14 14" fill="none">
                <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 8a.5.5 0 00.5.5h6.6a.5.5 0 00.5-.5l.7-8" stroke="#D93025" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--black)', marginBottom: 6 }}>Remover arquivo?</div>
              <div style={{ fontSize: 12, color: 'var(--gray)', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700, color: 'var(--black)' }}>{confirmFile.filename}</span> será removido da base de conhecimento do projeto. Esta ação não pode ser desfeita.
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setConfirmDeleteId(null)}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', fontSize: 13, fontWeight: 600, color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' }}
              >Cancelar</button>
              <button
                onClick={handleDeleteConfirmed}
                style={{ flex: 1, padding: '9px 0', borderRadius: 8, border: 'none', background: '#D93025', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#B71C1C' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#D93025' }}
              >Remover</button>
            </div>
          </div>
        </>
      )}

      <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
        Base de conhecimento do agente
      </label>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
        onMouseEnter={() => setHovZone(true)}
        onMouseLeave={() => setHovZone(false)}
        onClick={() => !uploading && fileRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragOver ? color : hovZone ? color + '80' : 'var(--gray3)'}`,
          borderRadius: 10,
          background: dragOver ? color + '10' : hovZone ? color + '08' : 'var(--bg)',
          padding: '16px 14px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
          cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none"
          stroke={dragOver || hovZone ? color : 'var(--gray2)'}
          strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'stroke 0.15s' }}
        >
          <path d="M12 3v13M7 8l5-5 5 5M3 17v2a2 2 0 002 2h14a2 2 0 002-2v-2"/>
        </svg>
        {uploading ? (
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)' }}>Processando…</span>
        ) : (
          <>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray)' }}>
              Arraste ou{' '}
              <span style={{ color, fontWeight: 700, textDecoration: 'underline', textDecorationStyle: 'dotted' }}>
                clique para selecionar
              </span>
            </span>
            <span style={{ fontSize: 10, color: 'var(--gray2)' }}>PDF · DOCX · XLSX · PPTX · TXT · MD</span>
          </>
        )}
      </div>
      <input
        ref={fileRef} type="file" multiple style={{ display: 'none' }}
        accept=".pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.txt,.md,.csv,.json,.xml,.yaml,.yml"
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }}
      />

      {/* File list */}
      {files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map(f => (
            <div key={f.id} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px',
              borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--gray3)',
            }}>
              <span style={{ fontSize: 15, flexShrink: 0 }}>{fileIcon(f.mime_type, f.filename)}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {f.filename}
                </div>
                <div style={{ fontSize: 10, color: 'var(--gray2)' }}>{fmtSize(f.size)}</div>
              </div>
              {/* Download dropdown */}
              <div ref={dlOpenId === f.id ? dlRef : undefined} style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  onClick={() => setDlOpenId(dlOpenId === f.id ? null : f.id)}
                  title="Baixar arquivo"
                  disabled={loadingDocxId === f.id}
                  style={{
                    width: 24, height: 24, borderRadius: 6, border: '1px solid var(--gray3)',
                    background: dlOpenId === f.id ? color + '12' : 'transparent',
                    cursor: loadingDocxId === f.id ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: dlOpenId === f.id ? color : 'var(--gray2)',
                    transition: 'all 0.12s',
                    borderColor: dlOpenId === f.id ? color + '60' : 'var(--gray3)',
                  }}
                  onMouseEnter={e => { if (dlOpenId !== f.id) { e.currentTarget.style.background = color + '12'; e.currentTarget.style.borderColor = color + '60'; e.currentTarget.style.color = color } }}
                  onMouseLeave={e => { if (dlOpenId !== f.id) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' } }}
                >
                  {loadingDocxId === f.id
                    ? <div style={{ width: 9, height: 9, borderRadius: '50%', border: `1.5px solid ${color}40`, borderTopColor: color, animation: 'spin-slow 0.7s linear infinite' }} />
                    : <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                        <path d="M6 1v7M3.5 5.5L6 8l2.5-2.5M1.5 10h9" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                  }
                </button>
                {dlOpenId === f.id && (
                  <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', right: 0, zIndex: 9200, background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,0.14)', minWidth: 120, overflow: 'hidden', animation: 'fadeIn 0.12s ease both' }}>
                    {[
                      { label: 'TXT', icon: '📄', action: () => handleDownloadTxt(f) },
                      { label: 'DOCX', icon: '📝', action: () => handleDownloadDocx(f) },
                      { label: 'PDF',  icon: '📑', action: () => handleDownloadPdf(f) },
                    ].map(opt => (
                      <div
                        key={opt.label}
                        onClick={opt.action}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--black)', transition: 'background 0.1s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = color + '10')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span style={{ fontSize: 13 }}>{opt.icon}</span>
                        {opt.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Delete */}
              <button
                onClick={() => setConfirmDeleteId(f.id)}
                title="Remover arquivo"
                style={{
                  width: 24, height: 24, borderRadius: 6, border: '1px solid var(--gray3)',
                  background: 'transparent', cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
                  flexShrink: 0, transition: 'all 0.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
              >
                <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                  <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 10, color: 'var(--gray2)', lineHeight: 1.5, margin: 0 }}>
        Esses arquivos serão incluídos automaticamente no contexto do agente ao analisar este projeto.
        Ideal para transcrições de reuniões, briefings e documentos de referência.
      </p>
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function EditProjectDrawer({ project, onSave, onClose, onDelete, isNew, clients }: {
  project: Project
  onSave: (p: Project) => void
  onClose: () => void
  onDelete?: () => void
  isNew: boolean
  clients: Client[]
}) {
  const [form, setForm] = useState<Project>({ ...project })
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [teamInput, setTeamInput] = useState('')
  const { isMobile } = useBreakpoint()

  function addMember() {
    const name = teamInput.trim()
    if (!name) return
    if (form.team_members?.includes(name)) { setTeamInput(''); return }
    setForm(f => ({ ...f, team_members: [...(f.team_members ?? []), name] }))
    setTeamInput('')
  }

  function removeMember(name: string) {
    setForm(f => ({ ...f, team_members: (f.team_members ?? []).filter(m => m !== name) }))
  }

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', h)
    return () => document.removeEventListener('keydown', h)
  }, [onClose])

  const set = (key: keyof Project, val: unknown) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleClientChange = (clientId: string) => {
    const client = clients.find(c => c.id === clientId)
    setForm(f => ({ ...f, client_id: clientId, client, color_hex: client?.color_hex ?? '#84CC16' }))
  }

  const focusStyle = (field: string): React.CSSProperties => ({
    ...inputStyle,
    borderColor: focusedField === field ? 'var(--primary)' : 'var(--gray3)',
    boxShadow: focusedField === field ? '0 0 0 3px var(--primary-dim)' : 'none',
  })

  const canSave = form.name.trim().length > 0

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9000,
          background: 'rgba(18,19,22,0.22)',
          backdropFilter: 'blur(2px)',
          animation: 'fadeIn 0.18s ease both',
        }}
      />

      {/* Drawer — slides from right on desktop, from bottom on mobile */}
      <div style={isMobile ? {
        position: 'fixed', bottom: 0, left: 0, right: 0, top: 'auto',
        height: '92vh', width: '100%',
        zIndex: 9001, background: 'var(--white)',
        borderRadius: '20px 20px 0 0',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.18)',
        display: 'flex', flexDirection: 'column',
        animation: 'panelUp 0.3s cubic-bezier(0.34,1.1,0.64,1) both',
      } : {
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 480,
        zIndex: 9001, background: 'var(--white)',
        boxShadow: '-8px 0 40px rgba(0,0,0,0.14)',
        display: 'flex', flexDirection: 'column',
        animation: 'panelSlide 0.28s cubic-bezier(0.34,1.1,0.64,1) both',
      }}>

        {/* Header */}
        <div style={{
          padding: '20px 24px 16px',
          borderBottom: '1px solid var(--gray3)',
          display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0,
        }}>
          <div style={{
            width: 10, height: 36, borderRadius: 4,
            background: form.color_hex, flexShrink: 0,
            transition: 'background 0.2s',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', marginBottom: 2 }}>
              {isNew ? 'Novo projeto' : 'Editar projeto'}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {form.name || 'Sem nome'}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: 10, border: '1px solid var(--gray3)',
            background: 'transparent', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: 'var(--gray2)',
            flexShrink: 0, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
          >
            <svg width={12} height={12} viewBox="0 0 12 12" fill="none">
              <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Form body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Nome */}
          <Field label="Nome do projeto *">
            <input
              value={form.name}
              onChange={e => set('name', e.target.value)}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: Portal SaaS de Gestão"
              style={focusStyle('name')}
            />
          </Field>

          {/* Cliente + Gestor */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Cliente">
              <AppSelect
                value={form.client_id}
                onChange={handleClientChange}
                options={clients.map(c => ({ value: c.id, label: c.name }))}
              />
            </Field>
            <Field label="Gestor">
              <input
                value={form.gestor ?? ''}
                onChange={e => set('gestor', e.target.value)}
                onFocus={() => setFocusedField('gestor')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nome do gestor"
                style={focusStyle('gestor')}
              />
            </Field>
          </div>

          {/* Equipe técnica */}
          <Field label="Equipe técnica">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: (form.team_members?.length ?? 0) > 0 ? 8 : 0 }}>
              {form.team_members?.map(name => (
                <span key={name} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  fontSize: 11, fontWeight: 700, padding: '3px 8px 3px 10px', borderRadius: 20,
                  background: form.color_hex + '18', color: form.color_hex,
                  border: `1px solid ${form.color_hex}40`,
                }}>
                  {name}
                  <button
                    type="button"
                    onClick={() => removeMember(name)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: 14, height: 14, borderRadius: '50%', border: 'none',
                      background: form.color_hex + '30', color: form.color_hex,
                      cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 11, fontWeight: 800,
                    }}
                  >×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={teamInput}
                onChange={e => setTeamInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addMember() } }}
                onFocus={() => setFocusedField('team')}
                onBlur={() => setFocusedField(null)}
                placeholder="Nome do dev / membro técnico..."
                style={{ ...focusStyle('team'), flex: 1 }}
              />
              <button
                type="button"
                onClick={addMember}
                disabled={!teamInput.trim()}
                style={{
                  padding: '0 14px', borderRadius: 8, border: 'none', fontSize: 18, fontWeight: 400,
                  background: teamInput.trim() ? form.color_hex : 'var(--gray3)',
                  color: teamInput.trim() ? '#fff' : 'var(--gray2)',
                  cursor: teamInput.trim() ? 'pointer' : 'default',
                  transition: 'all 0.15s', flexShrink: 0,
                }}
              >+</button>
            </div>
          </Field>

          {/* Tipo + Status */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Tipo">
              <AppSelect
                value={form.type}
                onChange={v => set('type', v as ProjectType)}
                options={(Object.keys(TYPE_LABEL) as ProjectType[]).map(t => ({
                  value: t, label: TYPE_LABEL[t],
                }))}
              />
            </Field>
            <Field label="Status">
              <AppSelect
                value={form.status}
                onChange={v => set('status', v as ProjectStatus)}
                options={ALL_STATUSES.map(s => ({
                  value: s, label: STATUS_CONFIG[s].label,
                  color: STATUS_CONFIG[s].color, bg: STATUS_CONFIG[s].bg,
                }))}
              />
            </Field>
          </div>

          {/* Descrição */}
          <Field label="Descrição">
            <textarea
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              onFocus={() => setFocusedField('desc')}
              onBlur={() => setFocusedField(null)}
              placeholder="Descreva o escopo e objetivo do projeto…"
              rows={3}
              style={{ ...focusStyle('desc'), resize: 'vertical', minHeight: 72, lineHeight: 1.55 }}
            />
          </Field>

          {/* Início + Fim */}
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
            <Field label="Data de início">
              <AppDatePicker
                value={form.start_date}
                onChange={v => set('start_date', v)}
                clearable={false}
              />
            </Field>
            <Field label="Fim previsto">
              <AppDatePicker
                value={form.end_date ?? ''}
                onChange={v => set('end_date', v)}
              />
            </Field>
          </div>

          {/* Observações */}
          <Field label="Observações do projeto">
            <textarea
              value={form.observacoes ?? ''}
              onChange={e => set('observacoes', e.target.value || undefined)}
              onFocus={() => setFocusedField('obs')}
              onBlur={() => setFocusedField(null)}
              placeholder="Ex: cliente prefere reuniões quinzenais, exige aprovação prévia de layouts..."
              rows={4}
              style={{
                ...focusStyle('obs'),
                resize: 'vertical', minHeight: 90, lineHeight: 1.6, fontSize: 12,
              }}
            />
          </Field>

          {/* Pasta no Drive */}
          <Field label="Pasta no Drive">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                value={form.links ?? ''}
                onChange={e => set('links', e.target.value || undefined)}
                onFocus={() => setFocusedField('links')}
                onBlur={() => setFocusedField(null)}
                placeholder="https://drive.google.com/drive/folders/..."
                style={{ ...focusStyle('links'), paddingRight: form.links ? 32 : 11 }}
              />
              {form.links && (
                <a
                  href={form.links}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', right: 10,
                    color: 'var(--gray2)', display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray2)')}
                  title="Abrir pasta"
                >
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8.5M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
          </Field>

          {/* Repositório GitHub */}
          <Field label="Repositório GitHub">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              {/* Ícone GitHub à esquerda */}
              <div style={{
                position: 'absolute', left: 10, pointerEvents: 'none',
                color: form.github_repo ? 'var(--black)' : 'var(--gray2)',
                display: 'flex', alignItems: 'center',
              }}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
              </div>
              <input
                value={form.github_repo ?? ''}
                onChange={e => set('github_repo', e.target.value || undefined)}
                onFocus={() => setFocusedField('github')}
                onBlur={() => setFocusedField(null)}
                placeholder="owner/repo  (ex: sheeptechservices/sheep-gestao)"
                style={{ ...focusStyle('github'), paddingLeft: 32, paddingRight: form.github_repo ? 32 : 11 }}
              />
              {form.github_repo && (
                <a
                  href={`https://github.com/${form.github_repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{
                    position: 'absolute', right: 10,
                    color: 'var(--gray2)', display: 'flex', alignItems: 'center',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                  onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray2)')}
                  title="Abrir repositório no GitHub"
                >
                  <svg width={13} height={13} viewBox="0 0 13 13" fill="none">
                    <path d="M5.5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h8a1 1 0 001-1V8.5M8 1h4m0 0v4m0-4L5.5 7.5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </a>
              )}
            </div>
            <p style={{ fontSize: 10, color: 'var(--gray2)', margin: '4px 0 0', lineHeight: 1.4 }}>
              O agente Dev usará esse repositório para consultar issues, PRs e commits automaticamente.
            </p>
          </Field>

          {/* Progress preview */}
          {(() => {
            const prog = calcProgress(form.start_date, form.end_date)
            return (
              <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--gray3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 7 }}>
                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Progresso calculado</span>
                    <span style={{ fontSize: 9, color: 'var(--gray2)', marginLeft: 6 }}>(automático por prazo)</span>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 800, color: form.color_hex }}>{prog}%</span>
                </div>
                <div style={{ height: 6, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${prog}%`, background: form.color_hex, borderRadius: 100, transition: 'width 0.3s ease' }} />
                </div>
                {!form.end_date && (
                  <p style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 6, fontStyle: 'italic' }}>
                    Defina o fim previsto para calcular o progresso automaticamente.
                  </p>
                )}
              </div>
            )
          })()}

          {/* Base de conhecimento */}
          {!isNew ? (
            <ProjectFilesSection projectId={project.id} color={form.color_hex} />
          ) : (
            <div style={{ padding: '12px 14px', borderRadius: 10, background: 'var(--bg)', border: '1px dashed var(--gray3)', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)' }}>Base de conhecimento</div>
              <div style={{ fontSize: 10, color: 'var(--gray2)', marginTop: 3 }}>Salve o projeto primeiro para adicionar arquivos de referência para o agente.</div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          padding: '14px 24px', borderTop: '1px solid var(--gray3)',
          display: 'flex', gap: 10, justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
          background: 'var(--white)',
        }}>
          <div>
            {!isNew && onDelete && (
              <button
                onClick={onDelete}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  border: '1px solid var(--gray3)',
                  background: 'transparent', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--gray2)', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
                title="Excluir projeto"
              >
                <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                  <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 8a.5.5 0 00.5.5h6.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onClose} style={{
              padding: '8px 18px', borderRadius: 8, border: '1px solid var(--gray3)',
              background: 'transparent', fontSize: 13, fontWeight: 600,
              color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--black)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray)' }}
            >
              Cancelar
            </button>
            <button onClick={() => canSave && onSave(form)} disabled={!canSave} style={{
              padding: '8px 20px', borderRadius: 8, border: 'none',
              background: canSave ? 'var(--primary)' : 'var(--gray3)',
              fontSize: 13, fontWeight: 700,
              color: canSave ? 'var(--primary-text)' : 'var(--gray2)',
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'all 0.15s',
              boxShadow: canSave ? '0 2px 8px var(--primary-mid)' : 'none',
            }}
              onMouseEnter={e => { if (canSave) e.currentTarget.style.boxShadow = '0 4px 14px var(--primary-mid)' }}
              onMouseLeave={e => { if (canSave) e.currentTarget.style.boxShadow = '0 2px 8px var(--primary-mid)' }}
            >
              {isNew ? 'Criar projeto' : 'Salvar alterações'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
