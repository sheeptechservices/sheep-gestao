import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { DatePicker } from '@/components/documentos/ui/DatePicker'

export function Step01_Dados() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Nome do cliente"
        value={d.nomeCliente || ''}
        onChange={e => set({ nomeCliente: e.target.value })}
        placeholder="Ex: Acme Corp"
      />
      <Input
        label="Título da proposta"
        value={d.tituloproposta || ''}
        onChange={e => set({ tituloproposta: e.target.value })}
        placeholder="Ex: Plataforma Digital B2B"
      />
      <DatePicker
        label="Data da proposta"
        value={d.dataProposta || ''}
        onChange={val => set({ dataProposta: val })}
      />
      <Input
        label="Vendedor / Responsável"
        value={d.nomeVendedor || ''}
        onChange={e => set({ nomeVendedor: e.target.value })}
        placeholder="Ex: Thales Carneiro"
      />
      <Input
        label="Website"
        value={d.website || ''}
        onChange={e => set({ website: e.target.value })}
        placeholder="Ex: sheeptechnology.com.br"
      />
      <Input
        label="Tagline"
        hint={`${(d.tagline || '').length}/70`}
        value={d.tagline || ''}
        onChange={e => set({ tagline: e.target.value.slice(0, 70) })}
        placeholder="Ex: Fazemos a tecnologia virar vantagem competitiva"
        maxLength={70}
      />
    </div>
  )
}
