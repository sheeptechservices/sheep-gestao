import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ApresentacaoData } from '@/components/documentos/types/apresentacao'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'

export function Step1_Dados() {
  const s = useDocsStore()
  const d = s.getActiveData() as ApresentacaoData
  const set = (v: Partial<ApresentacaoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Nome da Empresa"
        value={d.nomeEmpresa || ''}
        onChange={e => set({ nomeEmpresa: e.target.value })}
        placeholder="Ex: Sheep Tech"
      />
      <Input
        label="Tagline"
        value={d.tagline || ''}
        onChange={e => set({ tagline: e.target.value })}
        placeholder="Ex: Fazemos a tecnologia virar vantagem competitiva"
      />
      <Input
        label="Website"
        value={d.website || ''}
        onChange={e => set({ website: e.target.value })}
        placeholder="Ex: sheeptechnology.com.br"
      />
      <Textarea
        label="Descrição da Empresa"
        value={d.descricao || ''}
        onChange={e => set({ descricao: e.target.value })}
        rows={4}
        placeholder="Apresentação institucional da empresa..."
      />
    </div>
  )
}
