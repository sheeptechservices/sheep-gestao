import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { SprintReviewData, ImpedimentoItem } from '@/components/documentos/types/sprintreview'
import { Input } from '@/components/documentos/ui/Input'

export function Step3_MetricasImpedimentos() {
  const s = useDocsStore()
  const d = s.getActiveData() as SprintReviewData
  const set = (v: Partial<SprintReviewData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const impedimentos: ImpedimentoItem[] = d.impedimentos || []

  const addImpedimento = () => set({ impedimentos: [...impedimentos, { id: crypto.randomUUID(), texto: '' }] })
  const removeImpedimento = (id: string) => set({ impedimentos: impedimentos.filter(i => i.id !== id) })
  const updateImpedimento = (id: string, val: string) =>
    set({ impedimentos: impedimentos.map(i => i.id === id ? { ...i, texto: val } : i) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6 }}>
        Métricas do Sprint
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        <Input
          label="Story Points"
          value={d.velocidade || ''}
          onChange={e => set({ velocidade: e.target.value })}
          placeholder="Ex: 42"
        />
        <Input
          label="Bugs Resolvidos"
          value={d.bugsResolvidos || ''}
          onChange={e => set({ bugsResolvidos: e.target.value })}
          placeholder="Ex: 7"
        />
        <Input
          label="Cobertura de Testes"
          value={d.cobertura || ''}
          onChange={e => set({ cobertura: e.target.value })}
          placeholder="Ex: 82%"
        />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6, marginTop: 4 }}>
        Impedimentos Encontrados
      </div>
      {impedimentos.map(imp => (
        <div key={imp.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label=""
              value={imp.texto}
              onChange={e => updateImpedimento(imp.id, e.target.value)}
              placeholder="Ex: Dependência externa atrasou integração do gateway"
            />
          </div>
          <button
            onClick={() => removeImpedimento(imp.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={addImpedimento}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Impedimento</button>
    </div>
  )
}
