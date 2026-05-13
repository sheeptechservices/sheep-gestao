import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, Diferencial } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step07_Solucao() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const diferenciais: Diferencial[] = d.diferenciais || []

  const addDif = () => set({ diferenciais: [...diferenciais, { id: crypto.randomUUID(), label: '', descricao: '' }] })
  const removeDif = (id: string) => set({ diferenciais: diferenciais.filter(d => d.id !== id) })
  const updateDif = (id: string, field: keyof Diferencial, val: string) =>
    set({ diferenciais: diferenciais.map(d => d.id === id ? { ...d, [field]: val } : d) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <Textarea
        label="Descrição da solução"
        value={d.descricaoSolucao || ''}
        onChange={e => set({ descricaoSolucao: e.target.value })}
        rows={4}
        placeholder="Como a Sheep Tech vai resolver o problema..."
      />

      <FormSection title="Diferenciais">
        {diferenciais.map(dif => (
          <div key={dif.id} style={{ border: '1px solid var(--gray3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Label"
                  value={dif.label}
                  onChange={e => updateDif(dif.id, 'label', e.target.value)}
                  placeholder="Ex: Entrega ágil"
                />
              </div>
              <RemoveButton offsetTop={20} onClick={() => removeDif(dif.id)} />
            </div>
            <Textarea
              label="Descrição"
              value={dif.descricao}
              onChange={e => updateDif(dif.id, 'descricao', e.target.value)}
              rows={2}
              placeholder="Ex: Ciclos curtos com validação contínua do cliente."
            />
          </div>
        ))}
        <AddButton onClick={addDif}>Adicionar diferencial</AddButton>
      </FormSection>
    </div>
  )
}
