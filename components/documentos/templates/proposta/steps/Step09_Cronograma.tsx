import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, Fase } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step09_Cronograma() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const fases: Fase[] = d.fases || []

  const addFase = () => set({ fases: [...fases, { id: crypto.randomUUID(), nome: '', mes: 1, semanas: 2 }] })
  const removeFase = (id: string) => set({ fases: fases.filter(f => f.id !== id) })
  const updateFase = (id: string, field: keyof Fase, val: string | number) =>
    set({ fases: fases.map(f => f.id === id ? { ...f, [field]: val } : f) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Fases do projeto" description="O Gantt é gerado automaticamente a partir das fases">
        {fases.map(f => (
          <div key={f.id} style={{ border: '1px solid var(--gray3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Nome da fase"
                  value={f.nome}
                  onChange={e => updateFase(f.id, 'nome', e.target.value)}
                  placeholder="Ex: Discovery"
                />
              </div>
              <RemoveButton offsetTop={20} onClick={() => removeFase(f.id)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input
                label="Mês de início"
                type="number"
                value={String(f.mes)}
                onChange={e => updateFase(f.id, 'mes', Number(e.target.value))}
                min={1}
              />
              <Input
                label="Duração (semanas)"
                type="number"
                value={String(f.semanas)}
                onChange={e => updateFase(f.id, 'semanas', Number(e.target.value))}
                min={1}
              />
            </div>
          </div>
        ))}
        <AddButton onClick={addFase}>Adicionar fase</AddButton>
      </FormSection>
    </div>
  )
}
