'use client'
import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import { propostaTemplate } from './templates/proposta'
import { apresentacaoTemplate } from './templates/apresentacao'
import { kickoffTemplate } from './templates/kickoff'
import { sprintReviewTemplate } from './templates/sprintreview'
import type { TemplateConfig } from './templates/types'

type TemplateEntry = { template: TemplateConfig; locked: boolean }

const TEMPLATE_ENTRIES: TemplateEntry[] = [
  { template: propostaTemplate,    locked: false },
  { template: apresentacaoTemplate, locked: true  },
  { template: kickoffTemplate,     locked: true  },
  { template: sprintReviewTemplate, locked: true  },
]

export const TEMPLATES: TemplateConfig[] = TEMPLATE_ENTRIES.map(e => e.template)

function TemplateCard({ entry, onSelect }: { entry: TemplateEntry; onSelect: () => void }) {
  const { template: t, locked } = entry
  const [hovered, setHovered] = React.useState(false)

  if (locked) {
    return (
      <div
        style={{
          display: 'flex', flexDirection: 'column', gap: 10,
          padding: '18px 20px', borderRadius: 12,
          border: '1px solid var(--gray3)',
          background: 'var(--white)',
          opacity: 0.5,
          cursor: 'not-allowed',
          userSelect: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28, lineHeight: 1, filter: 'grayscale(1)' }}>{t.icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 2 }}>{t.name}</div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--gray2)' }}>
              {t.slideLabels.length} slides
            </div>
          </div>
          {/* Lock badge */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 8px', borderRadius: 100,
            background: 'var(--bg)', border: '1px solid var(--gray3)',
            fontSize: 10, fontWeight: 700, color: 'var(--gray2)',
            letterSpacing: '0.05em', textTransform: 'uppercase', flexShrink: 0,
          }}>
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
              <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Em breve
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.5 }}>{t.description}</div>
      </div>
    )
  }

  return (
    <button
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', gap: 10,
        padding: '18px 20px', borderRadius: 12, cursor: 'pointer',
        border: `1px solid ${hovered ? 'var(--primary)' : 'var(--gray3)'}`,
        background: hovered ? 'var(--primary-dim)' : 'var(--white)',
        textAlign: 'left', transition: 'all 0.15s', width: '100%',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 28, lineHeight: 1 }}>{t.icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--black)', marginBottom: 2 }}>{t.name}</div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: hovered ? 'var(--primary)' : 'var(--gray2)' }}>
            {t.slideLabels.length} slides
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: hovered ? 'var(--primary)' : 'var(--gray3)', flexShrink: 0 }}>
          <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div style={{ fontSize: 12, color: 'var(--gray2)', lineHeight: 1.5 }}>{t.description}</div>
    </button>
  )
}

export function TemplateSelector() {
  const { setActiveTemplate } = useDocsStore()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)', marginBottom: 4 }}>Gerador de Documentos</div>
        <div style={{ fontSize: 13, color: 'var(--gray2)' }}>Escolha um template para começar</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {TEMPLATE_ENTRIES.map(entry => (
          <TemplateCard
            key={entry.template.id}
            entry={entry}
            onSelect={() => setActiveTemplate(entry.template.id, entry.template.defaultData, entry.template.steps.length)}
          />
        ))}
      </div>
    </div>
  )
}
