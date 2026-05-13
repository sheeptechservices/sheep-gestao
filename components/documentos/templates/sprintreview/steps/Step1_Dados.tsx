import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { SprintReviewData } from '@/components/documentos/types/sprintreview'
import { Input } from '@/components/documentos/ui/Input'

export function Step1_Dados() {
  const s = useDocsStore()
  const d = s.getActiveData() as SprintReviewData
  const set = (v: Partial<SprintReviewData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Nome do Projeto"
        value={d.nomeProjeto || ''}
        onChange={e => set({ nomeProjeto: e.target.value })}
        placeholder="Ex: Plataforma Digital B2B"
      />
      <Input
        label="Nome do Time"
        value={d.timeNome || ''}
        onChange={e => set({ timeNome: e.target.value })}
        placeholder="Ex: Time Sheep"
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input
          label="Número do Sprint"
          value={d.sprintNumero || ''}
          onChange={e => set({ sprintNumero: e.target.value })}
          placeholder="Ex: 1"
        />
        <Input
          label="Período"
          value={d.periodo || ''}
          onChange={e => set({ periodo: e.target.value })}
          placeholder="Ex: 01/05 – 15/05"
        />
      </div>
    </div>
  )
}
