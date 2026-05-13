'use client'
import Link from 'next/link'
import type { Project } from '@/lib/types'
import { calcProgress } from '@/lib/utils'

const typeColors: Record<string, { bg: string; text: string; border: string }> = {
  AI:           { bg: 'rgba(139,92,246,0.08)', text: '#6d28d9', border: 'rgba(139,92,246,0.2)' },
  SaaS:         { bg: 'rgba(37,99,235,0.08)',  text: '#1d4ed8', border: 'rgba(37,99,235,0.2)' },
  TaaS:         { bg: 'rgba(13,148,136,0.08)', text: '#0f766e', border: 'rgba(13,148,136,0.2)' },
  BI:           { bg: 'rgba(234,88,12,0.08)',  text: '#c2410c', border: 'rgba(234,88,12,0.2)' },
  PowerPlatform:{ bg: 'rgba(219,39,119,0.08)', text: '#be185d', border: 'rgba(219,39,119,0.2)' },
  Other:        { bg: 'rgba(18,19,22,0.06)',   text: '#666666', border: 'var(--gray3)' },
}

const statusMap: Record<string, { label: string; bg: string; text: string; border: string }> = {
  active:    { label: 'Ativo',    bg: 'rgba(30,138,62,0.08)',   text: '#166534', border: 'rgba(30,138,62,0.2)' },
  paused:    { label: 'Pausado',  bg: 'rgba(234,88,12,0.08)',   text: '#c2410c', border: 'rgba(234,88,12,0.2)' },
  completed: { label: 'Concluído',bg: 'rgba(18,19,22,0.06)',    text: '#666666', border: 'var(--gray3)' },
}

interface ProjectCardProps {
  project: Project
  index: number
}

export function ProjectCard({ project, index }: ProjectCardProps) {
  const type = typeColors[project.type] ?? typeColors.Other
  const status = statusMap[project.status]

  return (
    <div
      className="animate-slide-up"
      style={{
        animationDelay: `${index * 0.07}s`,
        background: 'var(--white)',
        border: '1px solid var(--gray3)',
        borderRadius: 'var(--radius-md)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow)',
        position: 'relative',
        transition: 'transform .2s, box-shadow .2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 8px 24px rgba(0,0,0,0.09)'
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(0)'
        el.style.boxShadow = 'var(--shadow)'
      }}
    >
      {/* Color accent top bar */}
      <div style={{ height: 3, background: project.color_hex }} />

      <Link href={`/projects/${project.id}`} style={{ display: 'block', padding: '16px 18px', textDecoration: 'none', color: 'inherit' }}>
        {/* Client + title */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)', marginBottom: 3 }}>
            {project.client?.name}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', lineHeight: 1.35 }}>
            {project.name}
          </div>
        </div>

        {/* Badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
            background: type.bg, color: type.text, border: `1px solid ${type.border}`,
          }}>
            {project.type}
          </span>
          <span style={{
            fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 100,
            background: status.bg, color: status.text, border: `1px solid ${status.border}`,
          }}>
            {status.label}
          </span>
        </div>

        {/* Progress */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--gray2)' }}>Progresso</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--black)' }}>{calcProgress(project.start_date, project.end_date)}%</span>
          </div>
          <div style={{ height: 4, background: 'var(--gray3)', borderRadius: 100, overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${calcProgress(project.start_date, project.end_date)}%`,
              background: project.color_hex,
              borderRadius: 100,
              transition: 'width 0.8s ease',
            }} />
          </div>
        </div>

        {/* Date */}
        {project.end_date && (
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--gray2)', fontWeight: 500 }}>
            até {new Date(project.end_date).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
          </div>
        )}
      </Link>
    </div>
  )
}
