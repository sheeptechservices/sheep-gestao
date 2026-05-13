import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { KickoffData } from '@/components/documentos/types/kickoff'
import { Input } from '@/components/documentos/ui/Input'

export function Step1_Dados() {
  const s = useDocsStore()
  const d = s.getActiveData() as KickoffData
  const set = (v: Partial<KickoffData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Nome do Projeto"
        value={d.nomeProjeto || ''}
        onChange={e => set({ nomeProjeto: e.target.value })}
        placeholder="Ex: Plataforma Digital B2B"
      />
      <Input
        label="Nome do Cliente"
        value={d.nomeCliente || ''}
        onChange={e => set({ nomeCliente: e.target.value })}
        placeholder="Ex: Acme Corp"
      />
      <Input
        label="Data de Início"
        type="date"
        value={d.dataInicio || ''}
        onChange={e => set({ dataInicio: e.target.value })}
      />
      <Input
        label="Responsável pela Sheep"
        value={d.nomeResponsavel || ''}
        onChange={e => set({ nomeResponsavel: e.target.value })}
        placeholder="Ex: Thales Carneiro"
      />
    </div>
  )
}
