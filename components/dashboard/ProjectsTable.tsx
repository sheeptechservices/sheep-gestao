'use client'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import type { Project } from '@/lib/types'
import { calcProgress } from '@/lib/utils'

interface NpsSurvey { id: string; client_name: string; project_name: string; score: number }

function fmt(date?: string) {
  if (!date) return '—'
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

function isLate(end_date?: string) {
  if (!end_date) return false
  return new Date(end_date) < new Date()
}

function npsColor(nps: number) {
  if (nps >= 80) return '#1E8A3E'
  if (nps >= 0)  return '#FFB400'
  return '#D93025'
}

function npsLabel(nps: number) {
  if (nps >= 80) return 'Excelência'
  if (nps >= 0)  return 'Qualidade'
  return 'Aperfeiçoamento'
}

function computeNps(project: Project, surveys: NpsSurvey[]) {
  const relevant = surveys.filter(s => s.client_name === project.client?.name)
  if (!relevant.length) return null
  const p = relevant.filter(s => s.score >= 9).length
  const d = relevant.filter(s => s.score <= 6).length
  return Math.round(((p - d) / relevant.length) * 100)
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  active:      { label: 'Em curso',       color: '#B45309', bg: 'rgba(251,191,36,0.12)' },
  negotiation: { label: 'Em negociação',  color: '#0284C7', bg: 'rgba(2,132,199,0.10)'  },
  completed:   { label: 'Finalizado',     color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)'  },
  paused:      { label: 'Pausado',        color: '#7C3AED', bg: 'rgba(124,58,237,0.10)' },
  cancelled:   { label: 'Cancelado',      color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
}

const TYPE_LABEL: Record<string, string> = {
  AI: 'Inteligência Artificial', SaaS: 'SaaS', TaaS: 'TaaS',
  BI: 'Business Intelligence', PowerPlatform: 'Power Platform', Other: 'Outro',
}

const COLS = [
  { key: 'name',             label: 'Projeto',      width: 180 },
  { key: 'start_date',       label: 'Início',       width: 90  },
  { key: 'end_date',         label: 'Fim (prev.)',  width: 90  },
  { key: 'status',           label: 'Status',       width: 110 },
  { key: 'prazo',            label: 'Prazo',        width: 100 },
  { key: 'flag',             label: 'Flag',         width: 80  },
  { key: 'client',           label: 'Cliente',      width: 140 },
  { key: 'gestor',           label: 'Gestor',       width: 140 },
  { key: 'nps',              label: 'NPS',          width: 60  },
  { key: 'progress',         label: '% Conclusão',  width: 130 },
]

// ── Project Modal ─────────────────────────────────────────────────────────────
function ProjectModal({ project, surveys, onClose }: { project: Project; surveys: NpsSurvey[]; onClose: () => void }) {
  const status = STATUS_CONFIG[project.status]
  const nps    = computeNps(project, surveys)
  const late   = isLate(project.end_date) && project.status === 'active'
  const flag   = calcProgress(project.start_date, project.end_date) > 100

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const progressColor = calcProgress(project.start_date, project.end_date) >= 100 ? '#1E8A3E' : calcProgress(project.start_date, project.end_date) >= 60 ? 'var(--primary)' : '#FFB400'

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        background: 'rgba(15,23,42,0.35)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        animation: 'fadeIn 0.18s ease both',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--white)',
          borderRadius: 20,
          width: 560,
          maxWidth: 'calc(100vw - 48px)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.22s cubic-bezier(0.34,1.2,0.64,1) both',
          overflow: 'hidden',
        }}
      >
        {/* Color bar + header */}
        <div style={{ background: project.color_hex, height: 5 }} />
        <div style={{ padding: '24px 28px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                  color: status.color, background: status.bg,
                }}>
                  {status.label}
                </span>
                <span style={{ fontSize: 10, color: 'var(--gray2)', fontWeight: 600 }}>
                  {TYPE_LABEL[project.type] ?? project.type}
                </span>
              </div>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--black)', lineHeight: 1.2, marginBottom: 4 }}>
                {project.name}
              </h2>
              {project.description && (
                <p style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.6 }}>
                  {project.description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28, height: 28, borderRadius: '50%', border: 'none',
                background: 'var(--gray3)', color: 'var(--gray)', fontSize: 16,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, lineHeight: 1,
                transition: 'background 0.15s',
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--gray3)', margin: '0 28px' }} />

        {/* Body */}
        <div style={{ padding: '20px 28px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Info grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <InfoItem label="Cliente"  value={project.client?.name ?? '—'} />
            <InfoItem label="Gestor"   value={project.gestor ?? '—'} />
            <InfoItem label="Início"   value={fmt(project.start_date)} />
            <InfoItem label="Fim (prev.)" value={fmt(project.end_date)} />
            {late && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  color: '#D93025', background: 'rgba(217,48,37,0.08)',
                }}>
                  ⚠ Prazo vencido
                </span>
              </div>
            )}
            {flag && (
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  padding: '3px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700,
                  color: '#B45309', background: 'rgba(251,191,36,0.12)',
                }}>
                  Atenção — progresso acima do projetado
                </span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Progresso
              </span>
              <span style={{ fontSize: 18, fontWeight: 900, color: progressColor }}>
                {calcProgress(project.start_date, project.end_date)}%
              </span>
            </div>
            <div style={{ height: 8, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${Math.min(calcProgress(project.start_date, project.end_date), 100)}%`,
                background: progressColor,
                borderRadius: 100,
                transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)',
              }} />
            </div>
          </div>

          {/* NPS */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
            <div style={{
              background: 'var(--gray3)', borderRadius: 12, padding: '12px 16px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                NPS
              </span>
              {nps !== null ? (
                <>
                  <span style={{ fontSize: 22, fontWeight: 900, color: npsColor(nps), lineHeight: 1 }}>{nps}</span>
                  <span style={{ fontSize: 10, color: npsColor(nps), fontWeight: 700 }}>{npsLabel(nps)}</span>
                </>
              ) : (
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray2)' }}>—</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>
        {label}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>{value}</div>
    </div>
  )
}

function MetricBox({ label, value, unit }: { label: string; value: number | null; unit: string }) {
  return (
    <div style={{
      background: 'var(--gray3)', borderRadius: 12, padding: '12px 16px',
      display: 'flex', flexDirection: 'column', gap: 4,
    }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--gray2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </span>
      {value !== null ? (
        <span style={{ fontSize: 22, fontWeight: 900, color: 'var(--black)', lineHeight: 1 }}>
          {value}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray2)', marginLeft: 3 }}>{unit}</span>
        </span>
      ) : (
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--gray2)' }}>—</span>
      )}
    </div>
  )
}

// ── Clear Button ──────────────────────────────────────────────────────────────
function ClearButton({ onClear }: { onClear: () => void }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClear}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '5px 10px', borderRadius: 8,
        border: `1px solid ${hov ? 'var(--gray2)' : 'var(--gray3)'}`,
        background: hov ? 'rgba(0,0,0,0.04)' : 'transparent',
        color: hov ? 'var(--black)' : 'var(--gray2)',
        fontSize: 11, fontWeight: 600, cursor: 'pointer',
        transition: 'border-color 0.15s, background 0.15s, color 0.15s',
      }}
    >
      Limpar
    </button>
  )
}

// ── Filter Dropdown ───────────────────────────────────────────────────────────
function FilterDropdown({ label, value, onChange, options }: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  const [open,     setOpen]    = useState(false)
  const [pos,      setPos]     = useState<{ top: number; left: number; width: number } | null>(null)
  const [hovTrig,  setHovTrig] = useState(false)
  const [hovItem,  setHovItem] = useState<string | null>(null)
  const ref      = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const active   = value !== ''
  const selected = options.find(o => o.value === value)

  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      const t = e.target as Node
      if (
        ref.current   && !ref.current.contains(t) &&
        panelRef.current && !panelRef.current.contains(t)
      ) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  function toggle() {
    if (!open && ref.current) {
      const r = ref.current.getBoundingClientRect()
      setPos({ top: r.bottom + 6, left: r.left, width: Math.max(r.width, 160) })
    }
    setOpen(o => !o)
  }

  function pick(v: string) {
    onChange(v)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={ref}
        onClick={toggle}
        onMouseEnter={() => setHovTrig(true)}
        onMouseLeave={() => setHovTrig(false)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '5px 10px',
          borderRadius: 8,
          border: `1px solid ${active || open ? 'var(--primary)' : hovTrig ? 'var(--gray2)' : 'var(--gray3)'}`,
          background: active || open
            ? hovTrig ? 'var(--primary-dim)' : 'var(--primary-dim)'
            : hovTrig ? 'rgba(0,0,0,0.04)' : 'var(--white)',
          color: active || open ? 'var(--primary-text)' : hovTrig ? 'var(--black)' : 'var(--gray)',
          fontSize: 11,
          fontWeight: active ? 700 : 500,
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s, background 0.15s, color 0.15s',
          whiteSpace: 'nowrap',
        }}
      >
        {selected ? selected.label : label}
        <svg width="9" height="6" viewBox="0 0 9 6" fill="none" style={{ flexShrink: 0, opacity: 0.6, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.18s' }}>
          <path d="M1 1L4.5 5L8 1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && pos && typeof document !== 'undefined' && createPortal(
        <div
          ref={panelRef}
          style={{
            position: 'fixed', top: pos.top, left: pos.left, minWidth: pos.width,
            background: 'var(--white)',
            border: '1px solid var(--gray3)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.10)',
            zIndex: 2000,
            overflow: 'hidden',
            animation: 'fadeIn 0.12s ease both',
          }}
        >
          {/* Clear option */}
          <button
            onClick={() => pick('')}
            onMouseEnter={() => setHovItem('__all__')}
            onMouseLeave={() => setHovItem(null)}
            style={{
              width: '100%', textAlign: 'left', padding: '8px 12px',
              background: value === '' ? 'var(--primary-dim)' : hovItem === '__all__' ? 'rgba(0,0,0,0.04)' : 'transparent',
              border: 'none', borderBottom: '1px solid var(--gray3)',
              fontSize: 11, fontWeight: 600,
              color: value === '' ? 'var(--primary-text)' : hovItem === '__all__' ? 'var(--black)' : 'var(--gray2)',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {label} — todos
          </button>
          {options.map(o => (
            <button
              key={o.value}
              onClick={() => pick(o.value)}
              onMouseEnter={() => setHovItem(o.value)}
              onMouseLeave={() => setHovItem(null)}
              style={{
                width: '100%', textAlign: 'left', padding: '8px 12px',
                background: value === o.value ? 'var(--primary-dim)' : hovItem === o.value ? 'rgba(0,0,0,0.04)' : 'transparent',
                border: 'none',
                fontSize: 11, fontWeight: value === o.value ? 700 : 500,
                color: value === o.value ? 'var(--primary-text)' : hovItem === o.value ? 'var(--black)' : 'var(--black)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                transition: 'background 0.12s',
              }}
            >
              {o.label}
              {value === o.value && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </>
  )
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function ProjectsTable({ projects, surveys }: { projects: Project[]; surveys: NpsSurvey[] }) {
  const [hovRow,     setHovRow]   = useState<string | null>(null)
  const [selected,   setSelected] = useState<Project | null>(null)
  const [fStatus,    setFStatus]  = useState('')
  const [fCliente,   setFCliente] = useState('')
  const [fPrazo,     setFPrazo]   = useState('')
  const [fGestor,    setFGestor]  = useState('')
  const [filterKey,  setFilterKey] = useState(0)

  useEffect(() => { setFilterKey(k => k + 1) }, [fStatus, fCliente, fPrazo, fGestor])

  const uniqueClientes = Array.from(new Set(projects.map(p => p.client?.name).filter(Boolean))) as string[]
  const uniqueGestores = Array.from(new Set(projects.map(p => p.gestor).filter(Boolean))) as string[]

  const filtered = projects.filter(p => {
    if (fStatus  && p.status !== fStatus) return false
    if (fCliente && p.client?.name !== fCliente) return false
    if (fGestor  && p.gestor !== fGestor) return false
    if (fPrazo) {
      const late = isLate(p.end_date) && p.status === 'active'
      if (fPrazo === 'atrasado' && !late) return false
      if (fPrazo === 'no_prazo' && (late || p.status !== 'active')) return false
    }
    return true
  })

  const anyFilter = fStatus || fCliente || fPrazo || fGestor

  const npsValues = filtered.map(p => computeNps(p, surveys)).filter((v): v is number => v !== null)
  const avgNps  = npsValues.length ? Math.round(npsValues.reduce((a, b) => a + b, 0) / npsValues.length) : null
  const avgProg = filtered.length ? Math.round(filtered.reduce((a, p) => a + calcProgress(p.start_date, p.end_date), 0) / filtered.length) : 0

  return (
    <>
      <div
        className="animate-slide-up delay-5"
        style={{
          background: 'var(--white)',
          border: '1px solid var(--gray3)',
          borderRadius: 16,
          padding: '28px 36px',
          marginBottom: 28,
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Header + filtros */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Detalhes dos projetos
            {anyFilter && (
              <span style={{ marginLeft: 8, color: 'var(--primary-text)', fontWeight: 700 }}>
                · {filtered.length} resultado{filtered.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <FilterDropdown
              label="Status" value={fStatus} onChange={setFStatus}
              options={[
                { value: 'active',    label: 'Em curso'   },
                { value: 'completed', label: 'Finalizado' },
                { value: 'paused',    label: 'Pausado'    },
                { value: 'cancelled', label: 'Cancelado'  },
              ]}
            />
            <FilterDropdown
              label="Cliente" value={fCliente} onChange={setFCliente}
              options={uniqueClientes.map(c => ({ value: c, label: c }))}
            />
            <FilterDropdown
              label="Prazo" value={fPrazo} onChange={setFPrazo}
              options={[
                { value: 'no_prazo',  label: 'No prazo'  },
                { value: 'atrasado',  label: 'Atrasado'  },
              ]}
            />
            <FilterDropdown
              label="Gestor" value={fGestor} onChange={setFGestor}
              options={uniqueGestores.map(g => ({ value: g, label: g }))}
            />
            {anyFilter && <ClearButton onClear={() => { setFStatus(''); setFCliente(''); setFPrazo(''); setFGestor('') }} />}
          </div>
        </div>

        <div style={{ overflowX: 'auto' }} className="scrollbar-hide">
          <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', minWidth: 1100 }}>
            <colgroup>
              {COLS.map(c => <col key={c.key} style={{ width: c.width }} />)}
            </colgroup>

            <thead>
              <tr>
                {COLS.map(c => (
                  <th key={c.key} style={{
                    fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
                    letterSpacing: '0.07em', textTransform: 'uppercase',
                    textAlign: 'left', padding: '0 10px 10px',
                    borderBottom: '1px solid var(--gray3)',
                    whiteSpace: 'nowrap',
                  }}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ padding: '32px 10px', textAlign: 'center', fontSize: 12, color: 'var(--gray2)', fontWeight: 500 }}>
                    Nenhum projeto encontrado para os filtros selecionados.
                  </td>
                </tr>
              )}
              {filtered.map((p, i) => {
                const status = STATUS_CONFIG[p.status]
                const late   = isLate(p.end_date) && p.status === 'active'
                const flag   = calcProgress(p.start_date, p.end_date) > 100
                const nps    = computeNps(p, surveys)
                const isH    = hovRow === p.id

                return (
                  <tr
                    key={`${p.id}-${filterKey}`}
                    onMouseEnter={() => setHovRow(p.id)}
                    onMouseLeave={() => setHovRow(null)}
                    onClick={() => setSelected(p)}
                    style={{
                      background: isH ? 'rgba(0,0,0,0.025)' : 'transparent',
                      transition: 'background 0.15s',
                      cursor: 'pointer',
                      animation: 'fadeIn 0.25s ease both',
                      animationDelay: `${i * 35}ms`,
                    }}
                  >
                    <td style={td()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: p.color_hex, flexShrink: 0 }} />
                        <span style={{ fontWeight: 600, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.name}
                        </span>
                      </div>
                    </td>
                    <td style={td()}>{fmt(p.start_date)}</td>
                    <td style={td()}>{fmt(p.end_date)}</td>
                    <td style={td()}>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                        fontSize: 10, fontWeight: 700, color: status.color, background: status.bg, whiteSpace: 'nowrap',
                      }}>
                        {status.label}
                      </span>
                    </td>
                    <td style={td()}>
                      {p.status === 'active' || p.status === 'paused' ? (
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                          color: late ? '#D93025' : '#1E8A3E',
                          background: late ? 'rgba(217,48,37,0.08)' : 'rgba(30,138,62,0.08)',
                        }}>
                          {late ? '⚠ Atrasado' : '✓ No prazo'}
                        </span>
                      ) : <span style={{ color: 'var(--gray2)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={td()}>
                      {flag ? (
                        <span style={{
                          display: 'inline-block', padding: '2px 8px', borderRadius: 100,
                          fontSize: 10, fontWeight: 700, color: '#B45309', background: 'rgba(251,191,36,0.12)',
                        }}>
                          Atenção
                        </span>
                      ) : <span style={{ color: 'var(--gray2)', fontSize: 12 }}>—</span>}
                    </td>
                    <td style={td()}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {p.client?.name ?? '—'}
                      </span>
                    </td>
                    <td style={td()}>
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        {p.gestor ?? '—'}
                      </span>
                    </td>
                    <td style={td()}>
                      {nps !== null
                        ? <span style={{ fontWeight: 800, color: npsColor(nps) }}>{nps}</span>
                        : <span style={{ color: 'var(--gray2)' }}>—</span>}
                    </td>
                    <td style={td()}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 5, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${Math.min(calcProgress(p.start_date, p.end_date), 100)}%`,
                            background: calcProgress(p.start_date, p.end_date) >= 100 ? '#1E8A3E' : calcProgress(p.start_date, p.end_date) >= 60 ? 'var(--primary)' : '#FFB400',
                            borderRadius: 100,
                          }} />
                        </div>
                        <span style={{
                          fontSize: 11, fontWeight: 800, minWidth: 36, textAlign: 'right',
                          color: calcProgress(p.start_date, p.end_date) >= 100 ? '#1E8A3E' : 'var(--black)',
                        }}>
                          {calcProgress(p.start_date, p.end_date)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>

            <tfoot>
              <tr style={{ borderTop: '2px solid var(--gray3)' }}>
                <td colSpan={8} style={{ padding: '12px 10px 0', fontSize: 11, fontWeight: 700, color: 'var(--gray2)' }}>
                  Média geral
                </td>
                <td style={{ padding: '12px 10px 0', fontSize: 11, fontWeight: 800, color: avgNps !== null ? npsColor(avgNps) : 'var(--gray2)' }}>
                  {avgNps ?? '—'}
                </td>
                <td style={{ padding: '12px 10px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 5, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${Math.min(avgProg, 100)}%`,
                        background: avgProg >= 100 ? '#1E8A3E' : avgProg >= 60 ? 'var(--primary)' : '#FFB400',
                        borderRadius: 100,
                      }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, minWidth: 36, textAlign: 'right', color: 'var(--black)' }}>
                      {avgProg}%
                    </span>
                  </div>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {selected && (
        <ProjectModal
          project={selected}
          surveys={surveys}
          onClose={() => setSelected(null)}
        />
      )}
    </>
  )
}

function td(): React.CSSProperties {
  return {
    padding: '0 10px',
    height: 44,
    fontSize: 12,
    color: 'var(--gray)',
    borderBottom: '1px solid var(--gray3)',
    verticalAlign: 'middle',
    overflow: 'hidden',
  }
}
