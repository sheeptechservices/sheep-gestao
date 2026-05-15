'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import type { Task, Week, Project, TaskUrgency, TaskAttachment } from '@/lib/types'
import { useTasksStore } from '@/stores/tasksStore'
import { toast } from '@/stores/toastStore'
import { AppSelect } from '@/components/ui/AppSelect'
import { WeekPickerSelect } from '@/components/ui/WeekPickerSelect'
import { AppDatePicker } from '@/components/ui/AppDatePicker'
import { localToday, localDateStr } from '@/lib/localDate'
import { playDoneSound } from '@/lib/sounds'
import { ConsultAgentButton } from '@/components/ui/ConsultAgentButton'
import { useTaskModalStore } from '@/stores/taskModalStore'
import { useCreateStore } from '@/stores/createStore'
import { stripHtml } from '@/lib/stripHtml'
import { RichTextEditor } from '@/components/ui/RichTextEditor'
import { useBreakpoint } from '@/hooks/useBreakpoint'

// ── Helpers ───────────────────────────────────────────────────────────────────

const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
               'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

function fmtD(d: string) {
  const [, m, day] = d.split('-')
  return `${day}/${m}`
}
function fmtMonth(ym: string) {
  const [y, m] = ym.split('-')
  return `${MESES[parseInt(m) - 1]} ${y}`
}

const DAY_NAMES_FULL = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex']
const DAY_ABBR       = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function weekStatus(week: Week): 'past' | 'current' | 'future' {
  const now = new Date()
  if (now > new Date(week.end_date))   return 'past'
  if (now < new Date(week.start_date)) return 'future'
  return 'current'
}

function deadlineBadge(deadline: string) {
  const today = localToday()
  const d     = new Date(deadline + 'T12:00:00')
  const label = `${DAY_ABBR[d.getDay()]} ${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`
  if (deadline < today)   return { label, color: '#DC2626', bg: 'rgba(220,38,38,0.10)' }
  if (deadline === today) return { label, color: '#D97706', bg: 'rgba(217,119,6,0.10)' }
  return { label, color: '#059669', bg: 'rgba(5,150,105,0.10)' }
}

// ── Config ────────────────────────────────────────────────────────────────────

const URGENCY_CONFIG: Record<TaskUrgency, { label: string; color: string; bg: string }> = {
  low:    { label: 'Baixa',  color: '#059669', bg: 'rgba(5,150,105,0.10)'  },
  medium: { label: 'Média',  color: '#B45309', bg: 'rgba(180,83,9,0.10)'   },
  high:   { label: 'Alta',   color: '#DC2626', bg: 'rgba(220,38,38,0.10)'  },
}

const FLAG_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  revisar:   { label: 'Revisar',   color: '#D97706', bg: 'rgba(217,119,6,0.12)'   },
  bloqueado: { label: 'Bloqueado', color: '#DC2626', bg: 'rgba(220,38,38,0.10)'   },
  atencao:   { label: 'Atenção',   color: '#7C3AED', bg: 'rgba(124,58,237,0.10)'  },
}
const ALL_FLAGS = Object.keys(FLAG_CONFIG)

// ── Form types ────────────────────────────────────────────────────────────────

interface FormState {
  title: string; description: string; urgency: TaskUrgency | ''
  done: boolean; assigned_to: string; week_id: string | null
  project_id: string; flags: string[]; flag_comment: string; deadline: string
}

// ── Delete confirmation modal ─────────────────────────────────────────────────

function WBDeleteModal({ task, onConfirm, onClose }: {
  task: Task
  onConfirm: () => void
  onClose: () => void
}) {
  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2100,
      background: 'rgba(18,19,22,0.4)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease both',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--white)', borderRadius: 16,
        padding: '28px 32px 24px',
        width: 'min(420px, calc(100vw - 32px))',
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: 'modalSlideUp 0.22s ease both',
        display: 'flex', flexDirection: 'column', gap: 16,
        margin: '0 16px',
      }}>
        {/* Icon */}
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: 'rgba(220,38,38,0.10)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M3 5h14M8 5V3h4v2M6 5l1 11h6l1-11" stroke="#DC2626" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Text */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', margin: 0 }}>
            Excluir entregável?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
            O entregável <strong style={{ color: 'var(--black)', fontWeight: 700 }}>"{task.title}"</strong> será removido permanentemente. Essa ação não pode ser desfeita.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: '1px solid var(--gray3)', background: 'transparent',
            color: 'var(--gray2)', cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={onConfirm} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
            background: '#DC2626', color: '#fff', cursor: 'pointer',
            transition: 'opacity 0.15s',
          }}
            onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
            onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
          >Excluir</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Task form modal ───────────────────────────────────────────────────────────

function WBTaskModal({ task, onSave, onClose, onDelete, weeks, projects, defaultDeadline }: {
  task?: Task
  onSave: (data: FormState) => void
  onClose: () => void
  onDelete?: () => void
  weeks: Week[]
  projects: Project[]
  defaultDeadline?: string
}) {
  const sorted = [...weeks].sort((a, b) => a.start_date.localeCompare(b.start_date))
  const [form, setForm] = useState<FormState>({
    title:        task?.title        ?? '',
    description:  task?.description  ?? '',
    urgency:      task?.urgency      ?? '',
    done:         task?.done         ?? false,
    assigned_to:  task?.assigned_to  ?? '',
    week_id:      task?.week_id      ?? null,
    project_id:   task?.project_id   ?? '',
    flags:        task?.flags        ?? [],
    flag_comment: task?.flag_comment ?? '',
    deadline:     task?.deadline     ?? defaultDeadline ?? '',
  })
  const inputRef    = useRef<HTMLInputElement>(null)
  const fileRef     = useRef<HTMLInputElement>(null)
  const { isMobile } = useBreakpoint()
  const bumpAttachmentCount = useTasksStore(s => s.bumpAttachmentCount)

  // ── Attachments state ──────────────────────────────────────────────────────
  const [attachments, setAttachments]   = useState<TaskAttachment[]>([])
  const [attLoading, setAttLoading]     = useState(false)
  const [attUploading, setAttUploading] = useState(false)

  // Carrega anexos ao abrir em modo edição
  useEffect(() => {
    if (!task?.id) return
    fetch(`/api/attachments?task_id=${task.id}`)
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setAttachments(data) })
      .catch(() => {})
  }, [task?.id])

  async function handleAttachFile(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !task?.id) return
    setAttUploading(true)
    for (const file of files) {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('task_id', task.id)
      try {
        const res  = await fetch('/api/attachments', { method: 'POST', body: fd })
        const data = await res.json() as TaskAttachment & { error?: string }
        if (data.error) { toast.error(data.error); continue }
        setAttachments(prev => [...prev, data])
        bumpAttachmentCount(task.id, 1)
      } catch {
        toast.error('Erro ao fazer upload do arquivo')
      }
    }
    setAttUploading(false)
    e.target.value = ''
  }

  async function handleDeleteAttachment(att: TaskAttachment) {
    setAttLoading(true)
    try {
      await fetch(`/api/attachments/${att.id}`, { method: 'DELETE' })
      setAttachments(prev => prev.filter(a => a.id !== att.id))
      if (task?.id) bumpAttachmentCount(task.id, -1)
    } catch {
      toast.error('Erro ao remover anexo')
    } finally {
      setAttLoading(false)
    }
  }

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => {
    function h(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const isEdit = !!task
  const valid  = form.title.trim().length > 0
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '8px 10px', borderRadius: 8,
    border: '1px solid var(--gray3)', fontSize: 12, fontWeight: 500,
    background: 'var(--bg)', color: 'var(--black)',
    outline: 'none', cursor: 'text', boxSizing: 'border-box',
  }

  return createPortal(
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(18,19,22,0.35)', backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: isMobile ? 'flex-end' : 'center',
      justifyContent: 'center',
      animation: 'fadeIn 0.15s ease both',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: 'var(--white)',
        borderRadius: isMobile ? '20px 20px 0 0' : 16,
        padding: isMobile ? '20px 20px 32px' : '28px 32px 24px',
        width: isMobile ? '100%' : 560,
        boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
        animation: isMobile ? 'panelUp 0.25s ease both' : 'modalSlideUp 0.22s ease both',
        display: 'flex', flexDirection: 'column', gap: 18,
        maxHeight: isMobile ? '92vh' : '90vh', overflowY: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', margin: 0 }}>
            {isEdit ? 'Editar entregável' : 'Novo entregável'}
          </h2>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: '50%', border: 'none',
            background: 'var(--bg)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gray2)', fontSize: 14, fontWeight: 700,
          }}>×</button>
        </div>

        {/* Title */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Título *</label>
          <input ref={inputRef} value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            placeholder="Descreva o entregável..."
            style={inputStyle}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && valid) onSave(form) }}
          />
        </div>

        {/* Description */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Descrição</label>
          <RichTextEditor
            value={form.description}
            onChange={html => setForm(f => ({ ...f, description: html }))}
            placeholder="Detalhes adicionais..."
            minHeight={120}
          />
        </div>

        {/* Urgency */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Urgência</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {(Object.keys(URGENCY_CONFIG) as TaskUrgency[]).map(level => {
              const cfg = URGENCY_CONFIG[level]; const active = form.urgency === level
              return (
                <button key={level} type="button"
                  onClick={() => setForm(f => ({ ...f, urgency: f.urgency === level ? '' : level }))}
                  style={{
                    padding: '5px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${active ? cfg.color : 'var(--gray3)'}`,
                    background: active ? cfg.bg : 'transparent',
                    color: active ? cfg.color : 'var(--gray2)', transition: 'all 0.15s',
                  }}
                >{cfg.label}</button>
              )
            })}
          </div>
        </div>

        {/* Project */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Projeto <span style={{ fontWeight: 500, textTransform: 'none' }}>(opcional)</span>
          </label>
          <AppSelect
            value={form.project_id}
            onChange={v => setForm(f => ({ ...f, project_id: v }))}
            options={[
              { value: '', label: '— Nenhum (geral) —' },
              ...projects.map(p => ({
                value:         p.id,
                label:         p.name,
                sublabel:      p.client?.name ?? undefined,
                sublabelColor: p.client?.color_hex ?? undefined,
              })),
            ]}
          />
        </div>

        {/* Responsável */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>Responsável</label>
          <input value={form.assigned_to}
            onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
            placeholder="Nome do responsável..." style={inputStyle}
          />
        </div>

        {/* Deadline */}
        <div>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Previsão de entrega <span style={{ fontWeight: 500, textTransform: 'none' }}>(opcional)</span>
          </label>
          <AppDatePicker
            value={form.deadline}
            onChange={v => {
              // Auto-select the week that contains this deadline
              const matchingWeek = v
                ? sorted.find(w => v >= w.start_date && v <= w.end_date) ?? null
                : null
              setForm(f => ({ ...f, deadline: v, week_id: matchingWeek ? matchingWeek.id : f.week_id }))
            }}
            placeholder="Selecione uma data..."
            clearable
          />
        </div>

        {/* Flags */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Flags</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {ALL_FLAGS.map(flag => {
              const cfg = FLAG_CONFIG[flag]; const active = form.flags.includes(flag)
              return (
                <button key={flag} type="button"
                  onClick={() => setForm(f => ({ ...f, flags: f.flags.includes(flag) ? f.flags.filter(x => x !== flag) : [...f.flags, flag] }))}
                  style={{
                    padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    border: `1.5px solid ${active ? cfg.color : 'var(--gray3)'}`,
                    background: active ? cfg.bg : 'transparent',
                    color: active ? cfg.color : 'var(--gray2)', transition: 'all 0.15s',
                  }}
                >{cfg.label}</button>
              )
            })}
          </div>
          {form.flags.length > 0 && (
            <textarea value={form.flag_comment}
              onChange={e => setForm(f => ({ ...f, flag_comment: e.target.value }))}
              placeholder="Explique o motivo..." rows={2}
              style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', cursor: 'text', borderColor: 'var(--gray3)' }}
            />
          )}
        </div>

        {/* Attachments */}
        {(
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Anexos {attachments.length > 0 && <span style={{ fontWeight: 600, textTransform: 'none', marginLeft: 4, color: 'var(--gray2)' }}>({attachments.length})</span>}
              </label>
              <button
                type="button"
                onClick={() => isEdit ? fileRef.current?.click() : undefined}
                disabled={!isEdit || attUploading}
                title={!isEdit ? 'Salve o entregável primeiro para anexar arquivos' : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '4px 11px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                  cursor: !isEdit || attUploading ? 'not-allowed' : 'pointer',
                  border: '1px solid var(--gray3)', background: 'var(--bg)',
                  color: !isEdit || attUploading ? 'var(--gray2)' : 'var(--black)',
                  transition: 'all 0.15s', opacity: !isEdit || attUploading ? 0.45 : 1,
                }}
                onMouseEnter={e => { if (isEdit && !attUploading) e.currentTarget.style.borderColor = 'var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)' }}
              >
                <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v7M3 4l3-3 3 3M1.5 9.5h9" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {attUploading ? 'Enviando…' : 'Anexar arquivo'}
              </button>
              <input ref={fileRef} type="file" multiple style={{ display: 'none' }} onChange={handleAttachFile} />
            </div>

            {/* Lista de anexos */}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {attachments.map(att => {
                  const isImg  = att.mime_type.startsWith('image/')
                  const isPdf  = att.mime_type === 'application/pdf'
                  const isDoc  = att.mime_type.includes('word') || att.filename.endsWith('.docx') || att.filename.endsWith('.doc')
                  const isXls  = att.mime_type.includes('spreadsheet') || att.filename.endsWith('.xlsx') || att.filename.endsWith('.xls')
                  const icon   = isImg ? '🖼' : isPdf ? '📄' : isDoc ? '📝' : isXls ? '📊' : '📎'
                  const kb     = att.size < 1024 * 1024
                    ? `${(att.size / 1024).toFixed(0)} KB`
                    : `${(att.size / 1024 / 1024).toFixed(1)} MB`
                  return (
                    <div key={att.id} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 8,
                      border: '1px solid var(--gray3)', background: 'var(--bg)',
                    }}>
                      <span style={{ fontSize: 15, flexShrink: 0 }}>{icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {att.filename}
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>{kb}</div>
                      </div>
                      {/* Download */}
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={att.filename}
                        onClick={e => e.stopPropagation()}
                        style={{ display: 'flex', alignItems: 'center', color: 'var(--gray2)', transition: 'color 0.12s', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary)')}
                        onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray2)')}
                        title="Baixar arquivo"
                      >
                        <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                          <path d="M7 2v7m-3-2.5L7 9l3-2.5M2 11.5h10" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </a>
                      {/* Delete */}
                      <button
                        type="button"
                        disabled={attLoading}
                        onClick={e => { e.stopPropagation(); handleDeleteAttachment(att) }}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          width: 22, height: 22, borderRadius: 6, border: 'none',
                          background: 'transparent', cursor: attLoading ? 'not-allowed' : 'pointer',
                          color: 'var(--gray2)', transition: 'all 0.12s', flexShrink: 0,
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.10)'; e.currentTarget.style.color = '#D93025' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gray2)' }}
                        title="Remover anexo"
                      >
                        <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
                          <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round"/>
                        </svg>
                      </button>
                    </div>
                  )
                })}
              </div>
            )}

            {attachments.length === 0 && !attUploading && (
              <div style={{ fontSize: 11, color: 'var(--gray2)', fontStyle: 'italic' }}>
                {isEdit ? 'Nenhum arquivo anexado ainda.' : 'Salve o entregável para adicionar anexos.'}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
          {/* Delete — only in edit mode */}
          {isEdit && onDelete && (
            <button onClick={onDelete} title="Excluir entregável" style={{
              width: 34, height: 34, borderRadius: 8,
              border: '1px solid var(--gray3)', background: 'transparent',
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--gray2)', transition: 'all 0.15s', flexShrink: 0,
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(217,48,37,0.08)'; e.currentTarget.style.borderColor = '#D93025'; e.currentTarget.style.color = '#D93025' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
            >
              <svg width={14} height={14} viewBox="0 0 14 14" fill="none">
                <path d="M1.5 3.5h11M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1M5.5 6.5v4M8.5 6.5v4M2.5 3.5l.7 8a.5.5 0 00.5.5h6.6a.5.5 0 00.5-.5l.7-8" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
          <ConsultAgentButton
            task={task}
            project={projects.find(p => p.id === form.project_id)}
            variant="full"
            direction="up"
          />
          <div style={{ flex: 1 }} />
          {/* Toggle concluído */}
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, done: !f.done }))}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
              border: `1.5px solid ${form.done ? '#059669' : 'var(--gray3)'}`,
              background: form.done ? 'rgba(5,150,105,0.10)' : 'transparent',
              color: form.done ? '#059669' : 'var(--gray2)',
              cursor: 'pointer', transition: 'all 0.18s',
            }}
            onMouseEnter={e => {
              if (!form.done) { e.currentTarget.style.borderColor = '#059669'; e.currentTarget.style.color = '#059669' }
            }}
            onMouseLeave={e => {
              if (!form.done) { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }
            }}
          >
            <span style={{
              width: 14, height: 14, borderRadius: 4, flexShrink: 0,
              border: `1.5px solid ${form.done ? '#059669' : 'var(--gray3)'}`,
              background: form.done ? '#059669' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.18s',
            }}>
              {form.done && (
                <svg width={9} height={9} viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2.5L8 3" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </span>
            {form.done ? 'Concluído' : 'Marcar como concluído'}
          </button>
          <button onClick={onClose} style={{
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700,
            border: '1px solid var(--gray3)', background: 'transparent',
            color: 'var(--gray2)', cursor: 'pointer',
          }}>Cancelar</button>
          <button onClick={() => valid && onSave(form)} disabled={!valid} style={{
            padding: '8px 20px', borderRadius: 8, fontSize: 12, fontWeight: 700, border: 'none',
            background: valid ? 'var(--primary)' : 'var(--gray3)',
            color: valid ? 'var(--primary-text)' : 'var(--gray2)',
            cursor: valid ? 'pointer' : 'default', transition: 'all 0.15s',
          }}>{isEdit ? 'Salvar' : 'Criar entregável'}</button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Weekly board card (top-level — avoids remount-during-drag bug) ─────────────

export function WeeklyBoardCard({ task, project, isDragging, onDragStart, onDragEnd, onClick, onToggleDone, onDelete }: {
  task: Task
  project: Project | undefined
  isDragging: boolean
  onDragStart: () => void
  onDragEnd: () => void
  onClick: () => void
  onToggleDone: () => void
  onDelete: () => void
}) {
  const [hov, setHov]   = useState(false)
  const [pop, setPop]   = useState(false)
  const color      = project?.color_hex ?? '#6366F1'
  const tag        = project?.client?.name ?? project?.name
  const bloqueado  = task.flags?.includes('bloqueado')
  const revisar    = task.flags?.includes('revisar')
  const atencao    = task.flags?.includes('atencao')
  const accentColor = bloqueado ? '#DC2626' : atencao ? '#7C3AED' : revisar ? '#D97706' : color

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.effectAllowed = 'move'; onDragStart() }}
      onDragEnd={onDragEnd}
      onClick={() => { if (!isDragging) onClick() }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: isDragging ? accentColor + '12' : bloqueado ? 'rgba(220,38,38,0.04)' : atencao ? 'rgba(124,58,237,0.04)' : revisar ? 'rgba(217,119,6,0.04)' : hov ? 'var(--white)' : 'var(--bg)',
        borderRadius: 10,
        border: `1px solid ${isDragging ? accentColor + '55' : bloqueado ? 'rgba(220,38,38,0.30)' : atencao ? 'rgba(124,58,237,0.30)' : revisar ? 'rgba(217,119,6,0.30)' : hov ? color + '44' : 'var(--gray3)'}`,
        borderLeft: `3px solid ${isDragging ? accentColor : bloqueado ? '#DC2626' : atencao ? '#7C3AED' : revisar ? '#D97706' : hov ? color : 'var(--gray3)'}`,
        padding: '9px 10px 9px 9px',
        cursor: isDragging ? 'grabbing' : 'pointer',
        opacity: isDragging ? 0.5 : task.done ? 0.65 : 1,
        transform: isDragging
          ? 'rotate(2deg) scale(1.04)'
          : hov ? 'translateY(-2px)' : 'none',
        boxShadow: isDragging
          ? `0 8px 24px ${color}44`
          : hov ? `0 4px 14px rgba(0,0,0,0.09), 0 0 0 0px ${color}22`
          : 'none',
        transition: 'all 0.18s ease',
        display: 'flex', flexDirection: 'column', gap: 6,
        userSelect: 'none', position: 'relative',
      }}
    >
      {/* Checkbox + title */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
        <button
          onClick={e => {
            e.stopPropagation()
            if (!task.done) { setPop(true); playDoneSound() }
            onToggleDone()
          }}
          onAnimationEnd={() => setPop(false)}
          style={{
            width: 15, height: 15, borderRadius: 4, flexShrink: 0, cursor: 'pointer',
            border: `1.5px solid ${task.done ? color : hov ? color + '88' : 'var(--gray3)'}`,
            background: task.done ? color : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 0, marginTop: 1,
            animation: pop ? 'checkPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
            transition: pop ? 'none' : 'all 0.15s',
          }}
        >
          {task.done && (
            <svg width={9} height={9} viewBox="0 0 10 10" fill="none">
              <path d="M2 5l2 2.5L8 3" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </button>
        <span style={{
          fontSize: 12, fontWeight: 600, lineHeight: 1.35, flex: 1,
          color: task.done ? 'var(--gray2)' : 'var(--black)',
          textDecoration: task.done ? 'line-through' : 'none',
          transition: 'color 0.15s',
        }}>
          {task.title}
        </span>
      </div>

      {/* Project tag */}
      {tag && (
        <div style={{ paddingLeft: 22 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 10,
            background: color + '18', color,
            maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: color, flexShrink: 0 }} />
            {tag}
          </span>
        </div>
      )}

      {/* Urgency + assigned + flags + attachments */}
      {(task.urgency || task.assigned_to || bloqueado || revisar || atencao || (task.attachment_count ?? 0) > 0) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, paddingLeft: 22, flexWrap: 'wrap' }}>
          {bloqueado && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              color: '#DC2626', background: 'rgba(220,38,38,0.10)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <svg width={7} height={7} viewBox="0 0 10 10" fill="none">
                <circle cx="5" cy="5" r="4" stroke="#DC2626" strokeWidth="1.5"/>
                <path d="M3 3l4 4M7 3L3 7" stroke="#DC2626" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Bloqueado
            </span>
          )}
          {atencao && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              color: '#7C3AED', background: 'rgba(124,58,237,0.10)',
              display: 'flex', alignItems: 'center', gap: 3,
            }}>
              <svg width={7} height={7} viewBox="0 0 10 10" fill="none">
                <path d="M5 1l4 8H1L5 1z" stroke="#7C3AED" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M5 4v2.5M5 7.5v.5" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Atenção
            </span>
          )}
          {revisar && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              color: '#D97706', background: 'rgba(217,119,6,0.10)',
            }}>Revisar</span>
          )}
          {task.urgency && URGENCY_CONFIG[task.urgency] && (
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              color: URGENCY_CONFIG[task.urgency].color,
              background: URGENCY_CONFIG[task.urgency].bg,
            }}>{URGENCY_CONFIG[task.urgency].label}</span>
          )}
          {task.assigned_to && (
            <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500 }}>
              {task.assigned_to.split(' ')[0]}
            </span>
          )}
          {(task.attachment_count ?? 0) > 0 && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
              color: 'var(--gray2)', background: 'var(--gray3)',
            }}>
              <svg width={8} height={8} viewBox="0 0 12 12" fill="none">
                <path d="M10.5 6.5L5.5 11a3 3 0 01-4.24-4.24l5-5a2 2 0 012.83 2.83L4.09 9.59a1 1 0 01-1.42-1.42l5-5" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              {task.attachment_count}
            </span>
          )}
        </div>
      )}

      {/* Action icons on hover */}
      {hov && !isDragging && (
        <div style={{
          position: 'absolute', top: 7, right: 7,
          display: 'flex', gap: 4,
          animation: 'fadeIn 0.12s ease both',
        }}>
          {/* Consult agent */}
          <ConsultAgentButton task={task} project={project} variant="icon" direction="down" />
          {/* Delete */}
          <div
            onClick={e => { e.stopPropagation(); onDelete() }}
            style={{
              width: 20, height: 20, borderRadius: 5,
              background: 'var(--white)', border: '1px solid rgba(220,38,38,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)', cursor: 'pointer',
              transition: 'background 0.12s, border-color 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,0.08)'; e.currentTarget.style.borderColor = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'var(--white)'; e.currentTarget.style.borderColor = 'rgba(220,38,38,0.25)' }}
          >
            <svg width={10} height={10} viewBox="0 0 12 12" fill="none">
              <path d="M2 3h8M4.5 3V2h3v1M3.5 3l.6 7h3.8l.6-7" stroke="#DC2626" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Week navigator ─────────────────────────────────────────────────────────────

function WeekNav({ weeks, idx, onChange }: {
  weeks: Week[]
  idx: number
  onChange: (idx: number) => void
}) {
  const [pickerOpen,     setPicker]     = useState(false)
  const [pickerMonthKey, setPickerMonth] = useState('')
  const centerRef                        = useRef<HTMLButtonElement>(null)
  const week                             = weeks[idx]

  useEffect(() => {
    if (!pickerOpen) return
    function h(e: MouseEvent) {
      if (centerRef.current && !centerRef.current.contains(e.target as Node)) setPicker(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [pickerOpen])

  if (!week) return null

  const today  = localToday()
  const ws     = today > week.end_date ? 'past' : today < week.start_date ? 'future' : 'current'
  const wsLabel = ws === 'past' ? 'Passada' : ws === 'current' ? 'Atual' : 'Planejada'
  const wsColor = ws === 'past' ? '#94A3B8' : ws === 'current' ? 'var(--primary)' : '#3B82F6'

  // Jump to today's week
  const todayIdx = weeks.findIndex(w => today >= w.start_date && today <= w.end_date)

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {/* Prev */}
      <button onClick={() => onChange(idx - 1)} disabled={idx === 0} style={{
        width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--gray3)',
        background: 'var(--white)', cursor: idx === 0 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: idx === 0 ? 0.3 : 1, transition: 'opacity 0.15s', flexShrink: 0,
      }}>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
          <path d="M6 2L3 5l3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Center — opens picker */}
      <div style={{ position: 'relative' }}>
        <button
          ref={centerRef}
          onClick={() => { setPickerMonth(weeks[idx].start_date.slice(0, 7)); setPicker(o => !o) }}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '7px 18px', borderRadius: 10, cursor: 'pointer',
            border: `1px solid ${pickerOpen ? 'var(--primary)' : 'var(--gray3)'}`,
            background: pickerOpen ? 'var(--primary-dim)' : 'var(--white)',
            transition: 'all 0.15s', minWidth: 230, justifyContent: 'center',
          }}
        >
          {ws === 'current' && (
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', flexShrink: 0 }} />
          )}
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--black)' }}>
            Sem {week.week_number} · {fmtD(week.start_date)} – {fmtD(week.end_date)}
          </span>
          <span style={{ fontSize: 10, fontWeight: 700, color: wsColor }}>{wsLabel}</span>
          <svg width={9} height={6} viewBox="0 0 9 6" fill="none"
            style={{ opacity: 0.4, transform: pickerOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s', flexShrink: 0 }}>
            <path d="M1 1L4.5 5L8 1" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        {/* Picker dropdown */}
        {pickerOpen && typeof document !== 'undefined' && createPortal(
          (() => {
            const rect = centerRef.current?.getBoundingClientRect()
            const seen = new Set<string>()
            const availableMonths = weeks.map(w => w.start_date.slice(0, 7)).filter(m => seen.has(m) ? false : (seen.add(m), true)).sort()
            const monthIdx     = availableMonths.indexOf(pickerMonthKey)
            const weeksInMonth = weeks.filter(w => w.start_date.slice(0, 7) === pickerMonthKey)

            const navBtnStyle = (disabled: boolean): React.CSSProperties => ({
              width: 22, height: 22, borderRadius: '50%',
              border: '1px solid var(--gray3)', background: 'transparent',
              cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.3 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 14, lineHeight: 1, color: 'var(--gray)', flexShrink: 0,
            })

            return (
              <div onMouseDown={e => e.stopPropagation()} style={{
                position: 'fixed',
                top: (rect?.bottom ?? 0) + 6,
                left: (rect?.left ?? 0) + (rect?.width ?? 0) / 2,
                transform: 'translateX(-50%)',
                zIndex: 3000, background: 'var(--white)',
                border: '1px solid var(--gray3)', borderRadius: 12,
                boxShadow: '0 8px 28px rgba(0,0,0,0.12)',
                padding: '6px 6px 6px', minWidth: 240,
                animation: 'fadeIn 0.12s ease both',
              }}>
                {/* Month header */}
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '4px 6px 8px', borderBottom: '1px solid var(--gray3)', marginBottom: 4,
                }}>
                  <button disabled={monthIdx === 0} onClick={e => { e.stopPropagation(); setPickerMonth(availableMonths[monthIdx - 1]) }} style={navBtnStyle(monthIdx === 0)}>‹</button>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--black)' }}>{fmtMonth(pickerMonthKey)}</span>
                  <button disabled={monthIdx === availableMonths.length - 1} onClick={e => { e.stopPropagation(); setPickerMonth(availableMonths[monthIdx + 1]) }} style={navBtnStyle(monthIdx === availableMonths.length - 1)}>›</button>
                </div>

                {/* Weeks list */}
                {weeksInMonth.map(w => {
                  const gIdx = weeks.findIndex(x => x.start_date === w.start_date)
                  const ws2  = today > w.end_date ? 'past' : today < w.start_date ? 'future' : 'current'
                  const act  = gIdx === idx
                  return (
                    <button key={w.start_date} onClick={() => { onChange(gIdx); setPicker(false) }} style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                      background: act ? 'var(--primary-dim)' : 'transparent',
                      transition: 'background 0.12s', textAlign: 'left',
                    }}
                      onMouseEnter={e => { if (!act) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
                      onMouseLeave={e => { if (!act) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
                    >
                      <div style={{
                        width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                        background: ws2 === 'current' ? 'var(--primary)' : ws2 === 'past' ? '#CBD5E1' : '#93C5FD',
                      }} />
                      <span style={{
                        fontSize: 12, fontWeight: act ? 800 : 600, flex: 1,
                        color: ws2 === 'past' ? 'var(--gray2)' : act ? 'var(--primary-text)' : 'var(--black)',
                        opacity: ws2 === 'past' ? 0.7 : 1,
                      }}>
                        Sem {w.week_number} · {fmtD(w.start_date)} – {fmtD(w.end_date)}
                      </span>
                      <span style={{ fontSize: 10, fontWeight: 600, color: ws2 === 'current' ? 'var(--primary)' : ws2 === 'past' ? '#94A3B8' : '#3B82F6' }}>
                        {ws2 === 'current' ? 'Atual' : ws2 === 'past' ? 'Passada' : 'Planejada'}
                      </span>
                      {act && (
                        <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                          <path d="M2 5l2.5 2.5L8 3" stroke="var(--primary)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })(),
          document.body
        )}
      </div>

      {/* Next */}
      <button onClick={() => onChange(idx + 1)} disabled={idx === weeks.length - 1} style={{
        width: 30, height: 30, borderRadius: '50%', border: '1px solid var(--gray3)',
        background: 'var(--white)', cursor: idx === weeks.length - 1 ? 'default' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        opacity: idx === weeks.length - 1 ? 0.3 : 1, transition: 'opacity 0.15s', flexShrink: 0,
      }}>
        <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
          <path d="M4 2l3 3-3 3" stroke="var(--gray)" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Hoje button — only shown when not on current week */}
      {todayIdx !== -1 && todayIdx !== idx && (
        <button onClick={() => onChange(todayIdx)} style={{
          padding: '5px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700,
          border: '1px solid var(--primary)', background: 'var(--primary-dim)',
          color: 'var(--primary-text)', cursor: 'pointer', transition: 'all 0.15s',
        }}>
          Hoje
        </button>
      )}
    </div>
  )
}

// ── Main WeeklyBoard component ────────────────────────────────────────────────

// ── List view row ─────────────────────────────────────────────────────────────
function WBListRow({ task, projName, projColor, urgency, isLast, onClick, onToggleDone }: {
  task: Task
  projName: string
  projColor: string
  urgency: { label: string; color: string; bg: string } | null
  isLast: boolean
  onClick: () => void
  onToggleDone: () => void
}) {
  const [hov, setHov] = useState(false)
  const [pop, setPop] = useState(false)
  const isBloqueado = task.flags?.includes('bloqueado')
  const isRevisar   = task.flags?.includes('revisar')
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
      style={{
        display: 'grid', gridTemplateColumns: '28px 1fr 110px 90px 90px',
        alignItems: 'center', gap: 0,
        padding: '9px 16px',
        paddingLeft: isBloqueado || isRevisar ? 13 : 16,
        borderLeft: isBloqueado ? '3px solid #DC2626' : isRevisar ? '3px solid #D97706' : 'none',
        background: isBloqueado ? 'rgba(220,38,38,0.03)' : isRevisar ? 'rgba(217,119,6,0.03)' : hov ? 'var(--bg)' : 'var(--white)',
        borderBottom: isLast ? 'none' : '1px solid var(--gray3)',
        cursor: 'pointer', transition: 'background 0.12s',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={e => {
          e.stopPropagation()
          if (!task.done) { setPop(true); playDoneSound() }
          onToggleDone()
        }}
        style={{ display: 'flex', alignItems: 'center' }}
      >
        <div
          onAnimationEnd={() => setPop(false)}
          style={{
          width: 16, height: 16, borderRadius: 4,
          border: task.done ? 'none' : '1.5px solid var(--gray2)',
          background: task.done ? 'var(--primary)' : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', flexShrink: 0,
          animation: pop ? 'checkPop 0.45s cubic-bezier(0.34,1.56,0.64,1) both' : undefined,
          transition: pop ? 'none' : 'all 0.15s',
        }}>
          {task.done && (
            <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
              <path d="M1 3.5L3.5 6L8 1" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>
      </div>

      {/* Title */}
      <span style={{
        fontSize: 12, fontWeight: 600,
        color: task.done ? 'var(--gray2)' : 'var(--black)',
        textDecoration: task.done ? 'line-through' : 'none',
        paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{task.title}</span>

      {/* Project */}
      <div style={{ paddingLeft: 8 }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          fontSize: 10, fontWeight: 700,
          color: projColor, background: `${projColor}18`,
          padding: '2px 7px', borderRadius: 100,
          maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: projColor, flexShrink: 0 }} />
          {projName}
        </span>
      </div>

      {/* Urgency */}
      <div style={{ paddingLeft: 8 }}>
        {urgency ? (
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: urgency.color, background: urgency.bg,
            padding: '2px 7px', borderRadius: 100,
          }}>{urgency.label}</span>
        ) : <span style={{ color: 'var(--gray3)', fontSize: 11 }}>—</span>}
      </div>

      {/* Assigned */}
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--gray2)', paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {task.assigned_to ?? '—'}
      </span>
    </div>
  )
}

// ── New entregável button (same hover animation as ProjectsView's AddTaskButton) ─
function NewEntregavelBtn({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 11, fontWeight: 800, color: '#fff',
        background: 'var(--primary)', border: 'none',
        padding: '6px 14px', borderRadius: 100, cursor: 'pointer',
        boxShadow: hov ? '0 3px 10px rgba(99,102,241,0.35)' : 'none',
        transform: hov ? 'translateY(-1px)' : 'translateY(0)',
        opacity: hov ? 0.88 : 1,
        transition: 'all 0.2s ease',
        letterSpacing: '0.01em',
      }}
    >
      <span style={{
        fontSize: 16, lineHeight: 1, fontWeight: 400,
        display: 'inline-block',
        transform: hov ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 0.2s ease',
      }}>+</span>
      Novo entregável
    </button>
  )
}

const URGENCY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 }
function byUrgency(a: Task, b: Task) {
  // Concluídos sempre vão para o fundo
  if (a.done !== b.done) return a.done ? 1 : -1
  const ao = a.urgency ? URGENCY_ORDER[a.urgency] ?? 3 : 3
  const bo = b.urgency ? URGENCY_ORDER[b.urgency] ?? 3 : 3
  return ao - bo
}

// ── Filter pill dropdown ───────────────────────────────────────────────────────
function FilterPill({ label, value, options, onChange }: {
  label: string
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  const active = value !== ''
  const selected = options.find(o => o.value === value)

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 4,
          padding: '5px 10px', borderRadius: 8,
          border: `1px solid ${active ? 'var(--primary)' : 'var(--gray3)'}`,
          background: active ? 'var(--primary-dim)' : 'var(--white)',
          color: active ? 'var(--primary)' : 'var(--gray)',
          fontSize: 11, fontWeight: 700, cursor: 'pointer',
          fontFamily: 'inherit', transition: 'all 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {active ? selected?.label ?? label : label}
        {active && (
          <span
            onClick={e => { e.stopPropagation(); onChange('') }}
            style={{ marginLeft: 2, opacity: 0.6, fontWeight: 400, fontSize: 13, lineHeight: 1 }}
          >×</span>
        )}
        {!active && (
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 4l3 3 3-3"/>
          </svg>
        )}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 400,
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
          minWidth: 160, overflow: 'hidden',
        }}>
          {options.map(opt => (
            <div
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false) }}
              style={{
                padding: '8px 12px', fontSize: 12, fontWeight: 600,
                cursor: 'pointer', color: opt.value === value ? 'var(--primary)' : 'var(--black)',
                background: opt.value === value ? 'var(--primary-dim)' : 'transparent',
                transition: 'background 0.1s',
              }}
              onMouseEnter={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'var(--bg)' }}
              onMouseLeave={e => { if (opt.value !== value) (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function WeeklyBoard() {
  const { tasks, fetchTasks, updateTask, toggleDone, addTask, deleteTask } = useTasksStore()
  const [weeks,    setWeeks]    = useState<Week[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [weekIdx,  setWeekIdx]  = useState(0)
  const [loading,  setLoading]  = useState(true)

  // Responsive
  const { isMobile } = useBreakpoint()

  // View mode
  const [view,    setView]    = useState<'kanban' | 'list'>('kanban')
  const [viewKey, setViewKey] = useState(0)

  function switchView(v: 'kanban' | 'list') {
    if (v === view) return
    setView(v)
    setViewKey(k => k + 1)
  }

  // Collapsed day sections (list view)
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set())
  function toggleDay(date: string) {
    setCollapsedDays(prev => {
      const next = new Set(prev)
      next.has(date) ? next.delete(date) : next.add(date)
      return next
    })
  }

  // Filter state
  const [filterClient, setFilterClient] = useState('')
  const [filterDev,    setFilterDev]    = useState('')

  // Drag state
  const [dragId,   setDragId]   = useState<string | null>(null)
  const [overZone, setOverZone] = useState<string | null>(null)

  // Modal state
  const [editing,      setEditing]      = useState<Task | null | 'new'>(null)
  const [newTaskDate,  setNewTaskDate]  = useState<string>('')
  const [deleting,     setDeleting]     = useState<Task | null>(null)

  // Open modal from Quick Search (taskModalStore)
  const pendingOpenId = useTaskModalStore(s => s.pendingOpenId)
  const consumeOpen   = useTaskModalStore(s => s.consumeOpen)
  useEffect(() => {
    if (!pendingOpenId || tasks.length === 0) return
    const task = tasks.find(t => t.id === pendingOpenId)
    if (task) {
      setEditing(task)
      consumeOpen()
    }
  }, [pendingOpenId, tasks, consumeOpen])

  // Open new task modal from Quick Search (createStore)
  const pendingCreate  = useCreateStore(s => s.pendingCreate)
  const consumeCreate  = useCreateStore(s => s.consumeCreate)
  useEffect(() => {
    if (pendingCreate !== 'task') return
    setEditing('new')
    consumeCreate()
  }, [pendingCreate, consumeCreate])

  // Load data
  useEffect(() => {
    Promise.all([
      fetchTasks(),
      fetch('/api/weeks').then(r => r.json()),
      fetch('/api/projects').then(r => r.json()),
    ]).then(([, w, p]) => {
      const sorted: Week[] = [...w].sort((a: Week, b: Week) => a.start_date.localeCompare(b.start_date))
      setWeeks(sorted)
      setProjects(p)
      // Jump to current week
      const today = localToday()
      const ci = sorted.findIndex((wk: Week) => today >= wk.start_date && today <= wk.end_date)
      if (ci !== -1) setWeekIdx(ci)
      setLoading(false)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Derived
  const currentWeek = weeks[weekIdx] ?? null

  const days = currentWeek
    ? Array.from({ length: 5 }, (_, i) => {
        const d = new Date(currentWeek.start_date + 'T12:00:00')
        d.setDate(d.getDate() + i)
        return localDateStr(d)
      })
    : []

  const today = localToday()

  // All tasks of the current week (unfiltered, for stats and option building)
  const weekTasksAll = currentWeek ? tasks.filter(t => t.week_id === currentWeek.id) : []

  // Filter options — derive from week tasks
  const clientOptions = (() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const t of weekTasksAll) {
      const proj = projects.find(p => p.id === t.project_id)
      const cid  = proj?.client?.id ?? proj?.client_id
      const name = proj?.client?.name
      if (cid && name && !seen.has(cid)) { seen.add(cid); opts.push({ value: cid, label: name }) }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  })()

  const devOptions = (() => {
    const seen = new Set<string>()
    const opts: { value: string; label: string }[] = []
    for (const t of weekTasksAll) {
      if (t.assigned_to && !seen.has(t.assigned_to)) {
        seen.add(t.assigned_to)
        opts.push({ value: t.assigned_to, label: t.assigned_to })
      }
    }
    return opts.sort((a, b) => a.label.localeCompare(b.label))
  })()

  // Filtered tasks (with urgency sort)
  const weekTasks = weekTasksAll.filter(t => {
    if (filterDev && t.assigned_to !== filterDev) return false
    if (filterClient) {
      const proj = projects.find(p => p.id === t.project_id)
      const cid  = proj?.client?.id ?? proj?.client_id
      if (cid !== filterClient) return false
    }
    return true
  })

  // Group tasks by day (sorted by urgency)
  const tasksByDay: Record<string, Task[]> = {}
  const noDateTasks: Task[] = []
  for (const task of weekTasks) {
    if (task.deadline && days.includes(task.deadline)) {
      if (!tasksByDay[task.deadline]) tasksByDay[task.deadline] = []
      tasksByDay[task.deadline].push(task)
    } else {
      noDateTasks.push(task)
    }
  }
  for (const key of Object.keys(tasksByDay)) tasksByDay[key].sort(byUrgency)
  noDateTasks.sort(byUrgency)

  // Drag-and-drop helpers
  function handleDrop(zone: string) {
    if (!dragId) return
    const task = tasks.find(t => t.id === dragId)
    if (!task) return
    const newDeadline = zone === 'no-date' ? undefined : zone
    const curZone = task.deadline && days.includes(task.deadline) ? task.deadline : 'no-date'
    if (zone !== curZone) updateTask(dragId, { deadline: newDeadline })
    setDragId(null)
    setOverZone(null)
  }

  function dropZoneProps(zone: string) {
    const draggedTask = tasks.find(t => t.id === dragId)
    const curZone = draggedTask
      ? (draggedTask.deadline && days.includes(draggedTask.deadline) ? draggedTask.deadline : 'no-date')
      : null
    const canDrop = dragId !== null && curZone !== zone
    return {
      onDragOver:  (e: React.DragEvent) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setOverZone(zone) },
      onDragLeave: (e: React.DragEvent) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setOverZone(null) },
      onDrop:      (e: React.DragEvent) => { e.preventDefault(); handleDrop(zone) },
      isOver:      overZone === zone && canDrop,
    }
  }

  // Save handler
  function handleSave(data: FormState) {
    if (editing && editing !== 'new') {
      updateTask(editing.id, {
        title:        data.title,
        description:  data.description  || undefined,
        urgency:      data.urgency      || undefined,
        done:         data.done,
        assigned_to:  data.assigned_to  || undefined,
        week_id:      data.week_id      ?? undefined,
        project_id:   data.project_id   || undefined,
        flags:        data.flags.length ? data.flags : undefined,
        flag_comment: data.flag_comment || undefined,
        deadline:     data.deadline     || undefined,
      })
      toast.success('Entregável atualizado', data.title)
    } else {
      const newTask: Task = {
        id:           crypto.randomUUID(),
        title:        data.title,
        description:  data.description  || undefined,
        urgency:      data.urgency      || undefined,
        done:         false,
        assigned_to:  data.assigned_to  || undefined,
        week_id:      data.week_id      ?? currentWeek?.id,
        project_id:   data.project_id   || undefined,
        flags:        data.flags.length ? data.flags : undefined,
        flag_comment: data.flag_comment || undefined,
        deadline:     data.deadline     || undefined,
        created_at:   new Date().toISOString(),
      }
      addTask(newTask)
      toast.success('Entregável criado', data.title)
    }
    setEditing(null)
  }

  // Delete handler
  function handleDelete() {
    if (!deleting) return
    deleteTask(deleting.id)
    toast.success('Entregável excluído', deleting.title)
    setDeleting(null)
    setEditing(null)
  }

  // Stats for header (always based on full week, not filtered)
  const doneCount  = weekTasksAll.filter(t => t.done).length
  const totalCount = weekTasksAll.length

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 16 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div className="shimmer-bar" style={{ width: 100, height: 22, borderRadius: 6, background: 'var(--gray3)' }} />
          <div className="shimmer-bar" style={{ width: 220, height: 13, borderRadius: 4, background: 'var(--gray3)' }} />
        </div>
        <div className="shimmer-bar" style={{ width: 220, height: 34, borderRadius: 100, background: 'var(--gray3)' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <div className="shimmer-bar" style={{ width: 60, height: 28, borderRadius: 8, background: 'var(--gray3)' }} />
          <div className="shimmer-bar" style={{ width: 120, height: 34, borderRadius: 100, background: 'var(--gray3)' }} />
        </div>
      </div>
      {/* Filter bar skeleton */}
      <div style={{ display: 'flex', gap: 8 }}>
        <div className="shimmer-bar" style={{ width: 50, height: 28, borderRadius: 8, background: 'var(--gray3)' }} />
        <div className="shimmer-bar" style={{ width: 90, height: 28, borderRadius: 8, background: 'var(--gray3)' }} />
        <div className="shimmer-bar" style={{ width: 130, height: 28, borderRadius: 8, background: 'var(--gray3)' }} />
      </div>
      {/* Kanban columns skeleton */}
      <div
        className={isMobile ? 'kanban-scroll-row' : undefined}
        style={isMobile ? {} : { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}
      >
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={isMobile ? 'kanban-day-col' : undefined} style={{ borderRadius: 12, border: '1.5px solid var(--gray3)', background: 'var(--bg)', overflow: 'hidden', minHeight: 300 }}>
            <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <div className="shimmer-bar" style={{ width: 36, height: 12, borderRadius: 4, background: 'var(--gray3)', animationDelay: `${i * 0.07}s` }} />
                <div className="shimmer-bar" style={{ width: 28, height: 10, borderRadius: 4, background: 'var(--gray3)', animationDelay: `${i * 0.07}s` }} />
              </div>
              <div className="shimmer-bar" style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--gray3)', animationDelay: `${i * 0.07}s` }} />
            </div>
            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {Array.from({ length: i === 2 ? 4 : i === 4 ? 3 : 2 }, (_, j) => (
                <div key={j} className="shimmer-bar" style={{
                  background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 10,
                  padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
                  animationDelay: `${(i * 3 + j) * 0.05}s`,
                }}>
                  <div style={{ height: 11, borderRadius: 4, background: 'var(--gray3)', width: '85%' }} />
                  <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ height: 18, width: 70, borderRadius: 100, background: 'var(--gray3)' }} />
                    <div style={{ height: 18, width: 40, borderRadius: 100, background: 'var(--gray3)' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header — título + WeekNav + ações */}
      {isMobile ? (
        /* Mobile: stack em coluna */
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)' }}>Semana</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {totalCount > 0 && (
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)' }}>
                  {doneCount}/{totalCount}
                </span>
              )}
              <NewEntregavelBtn onClick={() => setEditing('new')} />
            </div>
          </div>
          <WeekNav weeks={weeks} idx={weekIdx} onChange={setWeekIdx} />
        </div>
      ) : (
        /* Desktop: 3-column grid */
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
          gap: 16,
        }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Semana</h1>
            <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>Visão global de todos os entregáveis da semana</p>
          </div>
          <WeekNav weeks={weeks} idx={weekIdx} onChange={setWeekIdx} />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 12 }}>
            {totalCount > 0 && (
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)' }}>
                {doneCount}/{totalCount} feito{totalCount !== 1 ? 's' : ''}
              </span>
            )}
            <NewEntregavelBtn onClick={() => setEditing('new')} />
          </div>
        </div>
      )}

      {/* Filter bar + botão "Novo entregável" */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>
          Filtrar
        </span>
        {clientOptions.length > 0 && (
          <FilterPill
            label="Cliente"
            value={filterClient}
            options={clientOptions}
            onChange={setFilterClient}
          />
        )}
        {devOptions.length > 0 && (
          <FilterPill
            label="Dev / Responsável"
            value={filterDev}
            options={devOptions}
            onChange={setFilterDev}
          />
        )}
        {(filterClient || filterDev) && (
          <button
            onClick={() => { setFilterClient(''); setFilterDev('') }}
            style={{
              fontSize: 11, fontWeight: 600, color: 'var(--gray2)',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '4px 6px', borderRadius: 6,
            }}
          >
            Limpar filtros
          </button>
        )}
        {/* View toggle — sliding indicator igual ao ProjectsView */}
        <div style={{ marginLeft: 'auto', position: 'relative', display: 'flex', background: 'var(--bg)', border: '1px solid var(--gray3)', borderRadius: 8, padding: 2 }}>
          {/* Sliding pill */}
          <div style={{
            position: 'absolute', top: 2, bottom: 2,
            width: 'calc(50% - 2px)',
            left: view === 'kanban' ? 2 : 'calc(50%)',
            background: 'var(--white)', borderRadius: 6,
            boxShadow: '0 1px 4px rgba(0,0,0,0.10)',
            transition: 'left 0.22s cubic-bezier(0.4,0,0.2,1)',
            pointerEvents: 'none',
          }} />
          {(['kanban', 'list'] as const).map(key => (
            <button
              key={key}
              onClick={() => switchView(key)}
              style={{
                position: 'relative', zIndex: 1,
                width: 56, padding: '4px 0',
                borderRadius: 6, border: 'none', cursor: 'pointer',
                fontSize: 11, fontWeight: 700, textAlign: 'center',
                background: 'transparent',
                color: view === key ? 'var(--black)' : 'var(--gray2)',
                transition: 'color 0.2s ease',
              }}
            >
              {key === 'kanban' ? 'Kanban' : 'Lista'}
            </button>
          ))}
        </div>
      </div>

      {/* No week found */}
      {!currentWeek && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray2)', fontSize: 13 }}>
          Nenhuma semana disponível.
        </div>
      )}

      {currentWeek && (
      <div key={viewKey} style={{ animation: 'viewSwitch 0.22s ease both' }}>
      {view === 'kanban' && (
        <>
          {/* Day columns — Kanban */}
          <div
            className={isMobile ? 'kanban-scroll-row' : undefined}
            style={isMobile ? {} : { display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}
          >
            {days.map((date, i) => {
              const isToday  = date === today
              const dayTasks = tasksByDay[date] ?? []
              const { onDragOver, onDragLeave, onDrop, isOver } = dropZoneProps(date)

              return (
                <div
                  key={date}
                  className={isMobile ? 'kanban-day-col' : undefined}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  style={{
                    borderRadius: 12,
                    border: `1.5px ${isOver ? 'dashed' : 'solid'} ${isOver ? 'var(--primary)' : isToday ? 'var(--primary)' : 'var(--gray3)'}`,
                    background: isOver ? 'var(--primary-dim)' : isToday ? 'rgba(var(--primary-rgb,99,102,241),0.04)' : 'var(--bg)',
                    overflow: 'hidden',
                    transition: 'border-color 0.15s, background 0.15s',
                    minHeight: 200,
                  }}
                >
                  <div style={{
                    padding: '10px 12px',
                    borderBottom: `1px solid ${isToday ? 'var(--primary-mid,rgba(99,102,241,0.25))' : 'var(--gray3)'}`,
                    background: isToday ? 'var(--primary-dim)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--black)' }}>
                        {DAY_NAMES_FULL[i]}
                        {isToday && (
                          <span style={{
                            marginLeft: 6, fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                            background: 'var(--primary)', color: 'var(--primary-text)',
                          }}>Hoje</span>
                        )}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, marginTop: 1 }}>{fmtD(date)}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <button
                        onClick={() => { setNewTaskDate(date); setEditing('new') }}
                        title={`Novo entregável em ${DAY_NAMES_FULL[i]}`}
                        style={{
                          width: 20, height: 20, borderRadius: 6,
                          border: '1px solid var(--gray3)', background: 'transparent',
                          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--gray2)', fontSize: 14, lineHeight: 1, fontWeight: 400,
                          transition: 'all 0.15s', flexShrink: 0, padding: 0,
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.background = 'var(--primary-dim)'
                          e.currentTarget.style.borderColor = 'var(--primary)'
                          e.currentTarget.style.color = 'var(--primary)'
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.borderColor = 'var(--gray3)'
                          e.currentTarget.style.color = 'var(--gray2)'
                        }}
                      >+</button>
                      {dayTasks.length > 0 && (
                        <span style={{
                          fontSize: 10, fontWeight: 800, minWidth: 18, height: 18, borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: isToday ? 'var(--primary)' : 'var(--gray3)',
                          color: isToday ? 'var(--primary-text)' : 'var(--gray2)',
                        }}>{dayTasks.length}</span>
                      )}
                    </div>
                  </div>
                  <div style={{ padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {dayTasks.length === 0 && !isOver ? (
                      <div style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ fontSize: 11, color: 'var(--gray3)' }}>—</span>
                      </div>
                    ) : (
                      <>
                        {dayTasks.map(task => (
                          <WeeklyBoardCard
                            key={task.id}
                            task={task}
                            project={projects.find(p => p.id === task.project_id)}
                            isDragging={dragId === task.id}
                            onDragStart={() => setDragId(task.id)}
                            onDragEnd={() => { setDragId(null); setOverZone(null) }}
                            onClick={() => setEditing(task)}
                            onToggleDone={() => toggleDone(task.id, !task.done)}
                            onDelete={() => setDeleting(task)}
                          />
                        ))}
                        {isOver && (
                          <div style={{
                            height: 52, borderRadius: 8,
                            background: 'var(--primary-dim)',
                            border: '1.5px dashed var(--primary)',
                            animation: 'fadeIn 0.15s ease both',
                          }} />
                        )}
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* No-date footer — Kanban */}
          {(() => {
            const { onDragOver, onDragLeave, onDrop, isOver } = dropZoneProps('no-date')
            if (noDateTasks.length === 0 && !isOver) return null
            return (
              <div
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                style={{
                  borderRadius: 10, padding: '12px 14px',
                  background: 'var(--bg)',
                  border: `1px dashed ${isOver ? 'var(--gray2)' : 'var(--gray3)'}`,
                  transition: 'border-color 0.15s',
                }}
              >
                <div style={{ fontSize: 9, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  Sem data definida · {noDateTasks.length}
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {noDateTasks.map(task => (
                    <div key={task.id} style={{ width: 'calc(20% - 8px)', minWidth: 160 }}>
                      <WeeklyBoardCard
                        task={task}
                        project={projects.find(p => p.id === task.project_id)}
                        isDragging={dragId === task.id}
                        onDragStart={() => setDragId(task.id)}
                        onDragEnd={() => { setDragId(null); setOverZone(null) }}
                        onClick={() => setEditing(task)}
                        onToggleDone={() => toggleDone(task.id, !task.done)}
                        onDelete={() => setDeleting(task)}
                      />
                    </div>
                  ))}
                  {isOver && (
                    <div style={{
                      width: 'calc(20% - 8px)', minWidth: 160, height: 60, borderRadius: 8,
                      background: 'rgba(100,116,139,0.08)',
                      border: '1.5px dashed var(--gray2)',
                      animation: 'fadeIn 0.15s ease both',
                    }} />
                  )}
                </div>
              </div>
            )
          })()}
        </>
      )}

      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0, border: '1px solid var(--gray3)', borderRadius: 12, overflow: 'hidden', background: 'var(--white)' }}>
          {/* Column headers */}
          <div style={{
            display: 'grid', gridTemplateColumns: '28px 1fr 110px 90px 90px',
            gap: 0, padding: '7px 16px',
            background: 'var(--bg)', borderBottom: '1px solid var(--gray3)',
          }}>
            {['', 'Entregável', 'Projeto', 'Urgência', 'Responsável'].map((h, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.08em', paddingLeft: i === 0 ? 0 : 8 }}>{h}</span>
            ))}
          </div>

          {/* Day sections */}
          {[...days, 'no-date'].map((date, i) => {
            const isNoDate   = date === 'no-date'
            const dayTasks   = isNoDate ? noDateTasks : (tasksByDay[date] ?? [])
            const isToday    = date === today
            const dayIdx     = isNoDate ? -1 : i
            const isCollapsed = collapsedDays.has(date)

            if (dayTasks.length === 0) return null

            return (
              <div key={date}>
                {/* Day header — clicável para colapsar */}
                <div
                  onClick={() => toggleDay(date)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '7px 16px', cursor: 'pointer',
                    background: isToday ? 'rgba(var(--primary-rgb,99,102,241),0.05)' : 'var(--bg)',
                    borderTop: i === 0 ? 'none' : '1px solid var(--gray3)',
                    borderBottom: isCollapsed ? 'none' : '1px solid var(--gray3)',
                    userSelect: 'none',
                    transition: 'background 0.12s',
                  }}
                >
                  {/* Chevron */}
                  <svg
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                    stroke={isToday ? 'var(--primary)' : 'var(--gray2)'}
                    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
                    style={{ transition: 'transform 0.2s', transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)', flexShrink: 0 }}
                  >
                    <path d="M2 4l4 4 4-4"/>
                  </svg>

                  <span style={{ fontSize: 11, fontWeight: 800, color: isToday ? 'var(--primary)' : 'var(--black)' }}>
                    {isNoDate ? 'Sem data' : `${DAY_NAMES_FULL[dayIdx]} · ${fmtD(date)}`}
                  </span>
                  {isToday && (
                    <span style={{
                      fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 8,
                      background: 'var(--primary)', color: 'var(--primary-text)',
                    }}>Hoje</span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 700, color: 'var(--gray2)',
                    background: 'var(--gray3)', borderRadius: 8, padding: '1px 6px',
                  }}>{dayTasks.length}</span>

                  {/* Done count */}
                  {dayTasks.filter(t => t.done).length > 0 && (
                    <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 500, marginLeft: 2 }}>
                      · {dayTasks.filter(t => t.done).length} feito{dayTasks.filter(t => t.done).length !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>

                {/* Task rows — hidden when collapsed */}
                {!isCollapsed && dayTasks.map((task, ri) => {
                  const proj      = projects.find(p => p.id === task.project_id)
                  const urgency   = task.urgency ? URGENCY_CONFIG[task.urgency] : null
                  const projName  = proj?.client?.name ?? proj?.name ?? '—'
                  const projColor = proj?.color_hex ?? '#94a3b8'

                  return (
                    <WBListRow
                      key={task.id}
                      task={task}
                      projName={projName}
                      projColor={projColor}
                      urgency={urgency}
                      isLast={ri === dayTasks.length - 1}
                      onClick={() => setEditing(task)}
                      onToggleDone={() => toggleDone(task.id, !task.done)}
                    />
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
      </div>
      )}

      {/* Task modal */}
      {editing !== null && (
        <WBTaskModal
          task={editing === 'new' ? undefined : editing}
          onSave={handleSave}
          onClose={() => { setEditing(null); setNewTaskDate('') }}
          onDelete={editing !== 'new' ? () => setDeleting(editing) : undefined}
          weeks={weeks}
          projects={projects}
          defaultDeadline={editing === 'new' ? newTaskDate : undefined}
        />
      )}

      {/* Delete confirmation modal */}
      {deleting !== null && (
        <WBDeleteModal
          task={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
