import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, CenarioInfra } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step12_CenariosInfra() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const cenarios: CenarioInfra[] = d.cenariosInfra || []

  const addCenario = () => set({ cenariosInfra: [...cenarios, { id: crypto.randomUUID(), nome: '', usuarios: '', infraMensal: 0, manutencaoMensal: 0 }] })
  const removeCenario = (id: string) => set({ cenariosInfra: cenarios.filter(c => c.id !== id) })
  const updateCenario = (id: string, field: keyof CenarioInfra, val: string | number) =>
    set({ cenariosInfra: cenarios.map(c => c.id === id ? { ...c, [field]: val } : c) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Cenários de crescimento" description="Faixas de usuários com estimativas de custo">
        {cenarios.map(c => (
          <div key={c.id} style={{ border: '1px solid var(--gray3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Nome do cenário"
                  value={c.nome}
                  onChange={e => updateCenario(c.id, 'nome', e.target.value)}
                  placeholder="Ex: Starter"
                />
              </div>
              <RemoveButton offsetTop={20} onClick={() => removeCenario(c.id)} />
            </div>
            <Input
              label="Faixa de usuários"
              value={c.usuarios}
              onChange={e => updateCenario(c.id, 'usuarios', e.target.value)}
              placeholder="Ex: até 100 usuários"
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Input
                label="Infra mensal (R$)"
                type="number"
                value={String(c.infraMensal)}
                onChange={e => updateCenario(c.id, 'infraMensal', Number(e.target.value))}
                min={0}
              />
              <Input
                label="Manutenção mensal (R$)"
                type="number"
                value={String(c.manutencaoMensal)}
                onChange={e => updateCenario(c.id, 'manutencaoMensal', Number(e.target.value))}
                min={0}
              />
            </div>
          </div>
        ))}
        <AddButton onClick={addCenario}>Adicionar cenário</AddButton>
      </FormSection>
    </div>
  )
}
