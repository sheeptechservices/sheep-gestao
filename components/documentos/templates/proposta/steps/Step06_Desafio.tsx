import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, PontoDeDor } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step06_Desafio() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const pontos: PontoDeDor[] = d.pontosDeDor || []

  const addPonto = () => set({ pontosDeDor: [...pontos, { id: crypto.randomUUID(), texto: '' }] })
  const removePonto = (id: string) => set({ pontosDeDor: pontos.filter(p => p.id !== id) })
  const updatePonto = (id: string, val: string) =>
    set({ pontosDeDor: pontos.map(p => p.id === id ? { ...p, texto: val } : p) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Textarea
        label="Descrição do desafio"
        value={d.descricaoDesafio || ''}
        onChange={e => set({ descricaoDesafio: e.target.value })}
        rows={4}
        placeholder="Descreva o contexto e o problema que o cliente enfrenta..."
      />

      <FormSection title="Pontos de dor">
        {pontos.map(p => (
          <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <Input
                label=""
                value={p.texto}
                onChange={e => updatePonto(p.id, e.target.value)}
                placeholder="Ex: Processos manuais consomem horas da equipe"
              />
            </div>
            <RemoveButton onClick={() => removePonto(p.id)} />
          </div>
        ))}
        <AddButton onClick={addPonto}>Adicionar ponto de dor</AddButton>
      </FormSection>
    </div>
  )
}
