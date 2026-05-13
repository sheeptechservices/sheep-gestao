import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, ItemInvestimento } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step10_Investimento() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const itens: ItemInvestimento[] = d.itensInvestimento || []

  const total = itens.reduce((acc, i) => acc + (Number(i.valor) || 0), 0)
  const fmt = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const addItem = () => set({ itensInvestimento: [...itens, { id: crypto.randomUUID(), descricao: '', valor: 0 }] })
  const removeItem = (id: string) => set({ itensInvestimento: itens.filter(i => i.id !== id) })
  const updateItem = (id: string, field: keyof ItemInvestimento, val: string | number) =>
    set({ itensInvestimento: itens.map(i => i.id === id ? { ...i, [field]: val } : i) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Itens do investimento">
        {itens.map(item => (
          <div key={item.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Descrição"
                value={item.descricao}
                onChange={e => updateItem(item.id, 'descricao', e.target.value)}
                placeholder="Ex: Desenvolvimento da plataforma"
              />
            </div>
            <div style={{ width: 130 }}>
              <Input
                label="Valor (R$)"
                type="number"
                value={String(item.valor)}
                onChange={e => updateItem(item.id, 'valor', Number(e.target.value))}
                min={0}
              />
            </div>
            <RemoveButton offsetTop={20} onClick={() => removeItem(item.id)} />
          </div>
        ))}
        <AddButton onClick={addItem}>Adicionar item</AddButton>
        {itens.length > 0 && (
          <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--primary-dim)', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--black)', letterSpacing: '0.02em' }}>Total</span>
            <span style={{ fontSize: 15, fontWeight: 800, color: 'var(--primary)' }}>{fmt(total)}</span>
          </div>
        )}
      </FormSection>

      <FormSection title="Forma de pagamento">
        <Textarea
          label=""
          value={d.formaPagamento || ''}
          onChange={e => set({ formaPagamento: e.target.value })}
          rows={3}
          placeholder="Ex: 50% na assinatura do contrato + 50% na entrega final"
        />
      </FormSection>
    </div>
  )
}
