import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { SprintReviewData, ProximoItem } from '@/components/documentos/types/sprintreview'
import { Input } from '@/components/documentos/ui/Input'

export function Step4_ProximoSprint() {
  const s = useDocsStore()
  const d = s.getActiveData() as SprintReviewData
  const set = (v: Partial<SprintReviewData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const itens: ProximoItem[] = d.proximosItens || []

  const addItem = () => set({ proximosItens: [...itens, { id: crypto.randomUUID(), texto: '' }] })
  const removeItem = (id: string) => set({ proximosItens: itens.filter(i => i.id !== id) })
  const updateItem = (id: string, val: string) =>
    set({ proximosItens: itens.map(i => i.id === id ? { ...i, texto: val } : i) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Meta do Próximo Sprint"
        value={d.proximaMeta || ''}
        onChange={e => set({ proximaMeta: e.target.value })}
        placeholder="Ex: Finalizar módulo de relatórios e deploy em staging"
      />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6 }}>
        Itens do Próximo Sprint
      </div>
      {itens.map((item, i) => (
        <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ width: 24, height: 38, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label=""
              value={item.texto}
              onChange={e => updateItem(item.id, e.target.value)}
              placeholder="Ex: Tela de dashboard com filtros"
            />
          </div>
          <button
            onClick={() => removeItem(item.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={addItem}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Item</button>
    </div>
  )
}
