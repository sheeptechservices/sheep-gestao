'use client'
import React, { useRef, useEffect, useState, useCallback } from 'react'
import { useDocsStore } from '@/stores/docsStore'
import { TEMPLATES } from './TemplateSelector'

export function SlidePreview() {
  const { activeTemplateId, getActiveData, hiddenSlides, slideStatuses, currentStep, setStep, toggleHiddenSlide, toggleSlideStatus } = useDocsStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  const template = TEMPLATES.find(t => t.id === activeTemplateId)
  const data = getActiveData()

  // Build hidden slides index list for the generator
  const hiddenIndexes = hiddenSlides.map((h, i) => h ? i : -1).filter(i => i >= 0)

  const html = template ? template.generateHtml(data as any, hiddenIndexes) : ''

  // Debounce html so the iframe doesn't reload on every keystroke
  const [debouncedHtml, setDebouncedHtml] = useState(html)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedHtml(html), 600)
    return () => clearTimeout(t)
  }, [html])

  // Keep a ref to currentStep to avoid stale closure in onLoad
  const currentStepRef = useRef(currentStep)
  useEffect(() => { currentStepRef.current = currentStep }, [currentStep])

  // Scale iframe to fit container (16:9 = 960×540) with 40px padding
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const calc = () => {
      const w = el.clientWidth - 40
      const h = el.clientHeight - 40
      const scaleW = w / 960
      const scaleH = h / 540
      setScale(Math.min(scaleW, scaleH))
    }
    calc()
    const observer = new ResizeObserver(calc)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Navigate iframe whenever active step changes (without reloading)
  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ goSlide: currentStep }, '*')
  }, [currentStep])

  // When iframe reloads (srcDoc changed), navigate back to the current slide
  const handleIframeLoad = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ goSlide: currentStepRef.current }, '*')
  }, [])

  // Reset to first slide when hidden slides change
  useEffect(() => {
    setStep(0)
    iframeRef.current?.contentWindow?.postMessage({ goSlide: 0 }, '*')
  }, [hiddenSlides])

  if (!template) return null

  const labels = template.slideLabels

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Slide tabs */}
      <div style={{
        display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--gray3)',
        scrollbarWidth: 'none', gap: 0, flexShrink: 0, background: 'var(--white)',
      }}>
        {labels.map((label, i) => {
          const isHidden = hiddenSlides[i]
          const isDone = slideStatuses[i]
          const isActive = currentStep === i || (currentStep >= labels.length && i === labels.length - 1)
          return (
            <button
              key={i}
              onClick={() => setStep(i)}
              onDoubleClick={() => toggleSlideStatus(i)}
              onContextMenu={e => { e.preventDefault(); toggleHiddenSlide(i) }}
              title={`${label} · duplo clique para marcar pronto · clique direito para ocultar`}
              style={{
                padding: '8px 14px', fontSize: 11, fontWeight: 600, whiteSpace: 'nowrap',
                cursor: 'pointer', border: 'none', borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'transparent',
                color: isHidden ? 'var(--gray3)' : isDone ? '#22c55e' : isActive ? 'var(--primary)' : 'var(--gray2)',
                textDecoration: isHidden ? 'line-through' : 'none',
                transition: 'all 0.15s', flexShrink: 0,
                fontFamily: 'Manrope, sans-serif',
              }}
            >
              {String(i + 1).padStart(2, '0')} {label}
              {isDone && !isHidden && <span style={{ marginLeft: 4, color: '#22c55e' }}>✓</span>}
              {isHidden && <span style={{ marginLeft: 4 }}>👁</span>}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ padding: '4px 14px', fontSize: 10, color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', background: 'var(--white)', flexShrink: 0 }}>
        duplo clique = ✓ pronto · clique direito = ocultar slide
      </div>

      {/* iframe container */}
      <div
        ref={containerRef}
        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: 'var(--bg)', padding: 20 }}
      >
        <div style={{
          width: 960 * scale,
          height: 540 * scale,
          position: 'relative',
          flexShrink: 0,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
        }}>
          <iframe
            ref={iframeRef}
            srcDoc={debouncedHtml}
            onLoad={handleIframeLoad}
            style={{
              width: 960, height: 540,
              border: 'none',
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              pointerEvents: 'auto',
              display: 'block',
            }}
            title="slide-preview"
          />
        </div>
      </div>
    </div>
  )
}
