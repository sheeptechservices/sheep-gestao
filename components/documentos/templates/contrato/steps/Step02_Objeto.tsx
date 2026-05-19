import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ContratoData } from '@/components/documentos/types/contrato'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step02_Objeto() {
  const s = useDocsStore()
  const d = s.getActiveData() as ContratoData
  const set = (v: Partial<ContratoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const itens = d.escopoItens || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Identificação do contrato">
        <Input
          label="Título do projeto / contrato"
          value={d.tituloContrato || ''}
          onChange={e => set({ tituloContrato: e.target.value })}
          placeholder="Ex: Desenvolvimento de Plataforma B2B"
        />
        <Textarea
          label="Descrição geral do objeto"
          value={d.descricaoObjeto || ''}
          onChange={e => set({ descricaoObjeto: e.target.value })}
          rows={3}
          placeholder="Descreva o que será desenvolvido/entregue pela Contratada..."
        />
      </FormSection>

      <FormSection title="Escopo de serviços">
        {itens.map((item, idx) => (
          <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label={`Item ${idx + 1}`}
                value={item.texto}
                onChange={e => set({
                  escopoItens: itens.map(i => i.id === item.id ? { ...i, texto: e.target.value } : i)
                })}
                placeholder="Ex: Desenvolvimento do frontend em React"
              />
            </div>
            <RemoveButton
              offsetTop={20}
              onClick={() => set({ escopoItens: itens.filter(i => i.id !== item.id) })}
            />
          </div>
        ))}
        <AddButton onClick={() => set({ escopoItens: [...itens, { id: crypto.randomUUID(), texto: '' }] })}>
          Adicionar item de escopo
        </AddButton>
      </FormSection>
    </div>
  )
}
