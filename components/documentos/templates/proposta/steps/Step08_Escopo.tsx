import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, Entrega } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step08_Escopo() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const entregas: Entrega[] = d.entregas || []

  const addEntrega = () => set({ entregas: [...entregas, { id: crypto.randomUUID(), descricao: '' }] })
  const removeEntrega = (id: string) => set({ entregas: entregas.filter(e => e.id !== id) })
  const updateEntrega = (id: string, val: string) =>
    set({ entregas: entregas.map(e => e.id === id ? { ...e, descricao: val } : e) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Itens do escopo" description="O que está incluído neste projeto">
        {entregas.map((e, i) => (
          <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 24, height: 34, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, color: 'var(--gray2)',
              fontWeight: 800, flexShrink: 0, letterSpacing: '0.05em',
            }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label=""
                value={e.descricao}
                onChange={ev => updateEntrega(e.id, ev.target.value)}
                placeholder="Ex: Desenvolvimento do módulo de autenticação"
              />
            </div>
            <RemoveButton onClick={() => removeEntrega(e.id)} />
          </div>
        ))}
        <AddButton onClick={addEntrega}>Adicionar entrega</AddButton>
      </FormSection>
    </div>
  )
}
