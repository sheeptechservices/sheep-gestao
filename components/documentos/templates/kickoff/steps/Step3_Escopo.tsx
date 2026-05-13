import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { KickoffData, ItemEscopo } from '@/components/documentos/types/kickoff'
import { Input } from '@/components/documentos/ui/Input'

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6, marginTop: 4 }}>
    {children}
  </div>
)

function ItemList({ items, onAdd, onRemove, onUpdate, placeholder }: {
  items: ItemEscopo[]
  onAdd: () => void
  onRemove: (id: string) => void
  onUpdate: (id: string, val: string) => void
  placeholder: string
}) {
  return (
    <>
      {items.map(item => (
        <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input label="" value={item.texto} onChange={e => onUpdate(item.id, e.target.value)} placeholder={placeholder} />
          </div>
          <button
            onClick={() => onRemove(item.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={onAdd}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar</button>
    </>
  )
}

export function Step3_Escopo() {
  const s = useDocsStore()
  const d = s.getActiveData() as KickoffData
  const set = (v: Partial<KickoffData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const incluidos: ItemEscopo[] = d.incluidos || []
  const excluidos: ItemEscopo[] = d.excluidos || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionTitle>Incluído no Escopo ✓</SectionTitle>
      <ItemList
        items={incluidos}
        onAdd={() => set({ incluidos: [...incluidos, { id: crypto.randomUUID(), texto: '' }] })}
        onRemove={id => set({ incluidos: incluidos.filter(i => i.id !== id) })}
        onUpdate={(id, val) => set({ incluidos: incluidos.map(i => i.id === id ? { ...i, texto: val } : i) })}
        placeholder="Ex: Desenvolvimento do módulo de autenticação"
      />
      <SectionTitle>Fora do Escopo ✗</SectionTitle>
      <ItemList
        items={excluidos}
        onAdd={() => set({ excluidos: [...excluidos, { id: crypto.randomUUID(), texto: '' }] })}
        onRemove={id => set({ excluidos: excluidos.filter(i => i.id !== id) })}
        onUpdate={(id, val) => set({ excluidos: excluidos.map(i => i.id === id ? { ...i, texto: val } : i) })}
        placeholder="Ex: Integrações com sistemas legados"
      />
    </div>
  )
}
