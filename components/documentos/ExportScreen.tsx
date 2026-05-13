'use client'
import React, { useRef, useEffect, useState } from 'react'
import { useDocsStore } from '@/stores/docsStore'
import { TEMPLATES } from './TemplateSelector'
import { Button } from './ui/Button'

export function ExportScreen() {
  const { activeTemplateId, getActiveData, hiddenSlides, backToSelector, resetActiveData } = useDocsStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [currentSlide, setCurrentSlide] = useState(0)

  const template = TEMPLATES.find(t => t.id === activeTemplateId)
  const data = getActiveData()

  const hiddenIndexes = hiddenSlides.map((h, i) => h ? i : -1).filter(i => i >= 0)
  const html = template ? template.generateHtml(data as any, hiddenIndexes) : ''
  const visibleLabels = template ? template.slideLabels.filter((_, i) => !hiddenSlides[i]) : []

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const calc = () => {
      const w = el.clientWidth - 16
      const h = el.clientHeight - 16
      setScale(Math.min(w / 960, h / 540))
    }
    calc()
    const observer = new ResizeObserver(calc)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ goSlide: currentSlide }, '*')
  }, [currentSlide])

  const handleDownload = async () => {
    if (!template) return

    // Inline all relative-path images (src="/...") as base64 so the HTML is standalone
    async function inlineImages(rawHtml: string): Promise<string> {
      const srcRegex = /src="(\/[^"]+)"/g
      const matches = [...rawHtml.matchAll(srcRegex)]
      const unique = [...new Set(matches.map(m => m[1]))]
      const map: Record<string, string> = {}
      await Promise.all(unique.map(async path => {
        try {
          const res = await fetch(path)
          const blob = await res.blob()
          const b64 = await new Promise<string>(resolve => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.readAsDataURL(blob)
          })
          map[path] = b64
        } catch { /* keep original if fetch fails */ }
      }))
      return rawHtml.replace(srcRegex, (_, path) => `src="${map[path] ?? path}"`)
    }

    const inlined = await inlineImages(html)
    const blob = new Blob([inlined], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = template.downloadFileName(data)
    a.click()
    URL.revokeObjectURL(url)
  }

  if (!template) return null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--black)', marginBottom: 4 }}>{template.exportTitle}</div>
        <div style={{ fontSize: 13, color: 'var(--gray2)' }}>{template.exportSubtitle}</div>
      </div>

      {/* Slide tabs */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {visibleLabels.map((label, i) => (
          <button
            key={i}
            onClick={() => setCurrentSlide(i)}
            style={{
              padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${currentSlide === i ? 'var(--primary)' : 'var(--gray3)'}`,
              background: currentSlide === i ? 'var(--primary-dim)' : 'transparent',
              color: currentSlide === i ? 'var(--primary)' : 'var(--gray2)',
              transition: 'all 0.15s', fontFamily: 'Manrope, sans-serif',
            }}
          >{String(i + 1).padStart(2, '0')} {label}</button>
        ))}
      </div>

      {/* Preview */}
      <div
        ref={containerRef}
        style={{ height: 260, borderRadius: 12, background: 'var(--bg)', border: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 8 }}
      >
        <div style={{ width: 960 * scale, height: 540 * scale, position: 'relative', flexShrink: 0, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.10)' }}>
          <iframe
            ref={iframeRef}
            srcDoc={html}
            style={{
              width: 960, height: 540, border: 'none',
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
              pointerEvents: 'none',
              display: 'block',
            }}
            title="export-preview"
          />
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <Button onClick={handleDownload} style={{ fontSize: 14, padding: '10px 24px' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8m0 0l-3-3m3 3l3-3M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Download .html
        </Button>
        <Button variant="ghost" onClick={() => backToSelector()}>
          ← Novo documento
        </Button>
        <Button
          variant="ghost"
          onClick={resetActiveData}
          style={{ color: 'var(--red)', borderColor: 'var(--red)' }}
        >
          Resetar dados
        </Button>
      </div>

      {hiddenIndexes.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--gray2)', padding: '8px 12px', borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--gray3)' }}>
          ℹ️ {hiddenIndexes.length} slide(s) oculto(s) não serão incluídos no download.
        </div>
      )}
    </div>
  )
}
