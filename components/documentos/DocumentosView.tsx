'use client'
import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import { TemplateSelector } from './TemplateSelector'
import { StepRouter } from './StepRouter'
import { SlidePreview } from './SlidePreview'

export function DocumentosView() {
  const { activeTemplateId } = useDocsStore()

  return (
    <div style={{
      display: 'flex',
      height: 'calc(100vh - 60px)',
      margin: '-32px -36px',
      overflow: 'hidden',
    }}>
      {/* Left panel — form */}
      <div style={{
        width: 420,
        minWidth: 420,
        borderRight: '1px solid var(--gray3)',
        overflowY: 'auto',
        padding: 28,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--white)',
      }}>
        {!activeTemplateId ? <TemplateSelector /> : <StepRouter />}
      </div>

      {/* Right panel — preview */}
      <div style={{
        flex: 1,
        background: 'var(--bg)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {activeTemplateId ? (
          <SlidePreview />
        ) : (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 16,
          }}>
            <div style={{ fontSize: 48, opacity: 0.15 }}>📄</div>
            <div style={{ fontSize: 14, color: 'var(--gray2)', textAlign: 'center' }}>
              Selecione um template para<br />visualizar a apresentação aqui
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
