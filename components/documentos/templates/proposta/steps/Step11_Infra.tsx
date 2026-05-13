import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, ItemInfra } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step11_Infra() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const itens: ItemInfra[] = d.itensInfra || []

  const totalMensal = itens.reduce((acc, i) => acc + (Number(i.valorMensal) || 0), 0)
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const addItem = () => set({ itensInfra: [...itens, { id: crypto.randomUUID(), descricao: '', valorMensal: 0 }] })
  const removeItem = (id: string) => set({ itensInfra: itens.filter(i => i.id !== id) })
  const updateItem = (id: string, field: keyof ItemInfra, val: string | number) =>
    set({ itensInfra: itens.map(i => i.id === id ? { ...i, [field]: val } : i) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Itens de infraestrutura" description="Custos mensais estimados por recurso">
        {itens.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Serviço / Recurso"
                value={item.descricao}
                onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                placeholder="Ex: AWS EC2 (t3.medium)"
              />
            </div>
            <div style={{ width: 150 }}>
              <Input
                label="Custo mensal (R$)"
                type="number"
                value={String(item.valorMensal)}
                onChange={e => updateItem(item.id, 'valorMensal', Number(e.target.value))}
                min={0}
              />
            </div>
            <RemoveButton offsetTop={20} onClick={() => removeItem(item.id)} />
          </div>
        ))}
        <AddButton onClick={addItem}>Adicionar item</AddButton>
        {itens.length > 0 && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--primary-dim)', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)', letterSpacing: '0.02em' }}>Total mensal</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>{fmt(totalMensal)}/mês</span>
          </div>
        )}
      </FormSection>

      <FormSection title="Notas">
        <Textarea
          label=""
          hint="opcional"
          value={d.notasInfra || ''}
          onChange={e => set({ notasInfra: e.target.value })}
          rows={3}
          placeholder="Ex: Valores estimados. Podem variar conforme uso."
        />
      </FormSection>
    </div>
  )
}
