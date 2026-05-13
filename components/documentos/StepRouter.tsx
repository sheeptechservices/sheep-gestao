'use client'
import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import { TEMPLATES } from './TemplateSelector'
import { ExportScreen } from './ExportScreen'
import { Button } from './ui/Button'

function LinkButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{ fontSize: 11, color: 'var(--gray2)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Manrope, sans-serif', padding: 0, fontWeight: 600, transition: 'color 0.15s' }}
      onMouseEnter={e => { e.currentTarget.style.color = 'var(--black)' }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--gray2)' }}
    >
      {children}
    </button>
  )
}

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--gray2)' }}>
          Passo {current + 1} de {total}
        </span>
        <LinkButton onClick={() => useDocsStore.getState().backToSelector()}>← Trocar template</LinkButton>
      </div>
      <div style={{ height: 4, borderRadius: 4, background: 'var(--gray3)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 4,
          background: 'var(--primary)',
          width: `${((current + 1) / total) * 100}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
    </div>
  )
}

export function StepRouter() {
  const { activeTemplateId, currentStep, totalSteps } = useDocsStore()
  const template = TEMPLATES.find(t => t.id === activeTemplateId)

  if (!template) return null

  // Export screen shown after last step
  if (currentStep >= totalSteps) {
    return (
      <div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--primary)' }}>
              ✓ Formulário completo
            </span>
            <LinkButton onClick={() => useDocsStore.getState().backToSelector()}>← Trocar template</LinkButton>
          </div>
          <div style={{ height: 4, borderRadius: 4, background: 'var(--primary)', marginTop: 8 }} />
        </div>
        <ExportScreen />
        <div style={{ marginTop: 20 }}>
          <Button variant="ghost" onClick={prevStep}>← Voltar ao formulário</Button>
        </div>
      </div>
    )
  }

  const StepComponent = template.steps[currentStep]
  const stepLabel = template.slideLabels[currentStep] || `Passo ${currentStep + 1}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <StepIndicator current={currentStep} total={totalSteps} />

      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--black)', letterSpacing: '-0.01em' }}>
          <span style={{ color: 'var(--primary)', marginRight: 8, fontVariantNumeric: 'tabular-nums' }}>{String(currentStep + 1).padStart(2, '0')}</span>
          {stepLabel}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'visible' }}>
        <StepComponent />
      </div>

    </div>
  )
}
