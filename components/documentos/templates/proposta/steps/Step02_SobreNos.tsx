import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, ValorEmpresa } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step02_SobreNos() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const valores: ValorEmpresa[] = d.valoresEmpresa || []

  const addValor = () => set({ valoresEmpresa: [...valores, { id: crypto.randomUUID(), titulo: '', descricao: '' }] })
  const removeValor = (id: string) => set({ valoresEmpresa: valores.filter(v => v.id !== id) })
  const updateValor = (id: string, field: keyof ValorEmpresa, val: string) =>
    set({ valoresEmpresa: valores.map(v => v.id === id ? { ...v, [field]: val } : v) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Títulos do slide">
        <Input
          label="Título (parte normal)"
          value={d.sobreNosTitulo || ''}
          onChange={e => set({ sobreNosTitulo: e.target.value })}
          placeholder="Ex: Fazemos a tecnologia virar"
        />
        <Input
          label="Título (parte em destaque)"
          value={d.sobreNosTituloAcc || ''}
          onChange={e => set({ sobreNosTituloAcc: e.target.value })}
          placeholder="Ex: vantagem competitiva"
        />
      </FormSection>

      <FormSection title="Descrição">
        <Textarea
          label="Parágrafo 1"
          value={d.sobreNosDesc1 || ''}
          onChange={e => set({ sobreNosDesc1: e.target.value })}
          rows={3}
        />
      </FormSection>

      <FormSection title="Valores da empresa">
        {valores.map(v => (
          <div key={v.id} style={{ border: '1px solid var(--gray3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Título"
                  value={v.titulo}
                  onChange={e => updateValor(v.id, 'titulo', e.target.value)}
                  placeholder="Ex: Excelência"
                />
              </div>
              <RemoveButton offsetTop={20} onClick={() => removeValor(v.id)} />
            </div>
            <Input
              label="Descrição"
              value={v.descricao}
              onChange={e => updateValor(v.id, 'descricao', e.target.value)}
              placeholder="Ex: Alto padrão técnico e resultados reais."
            />
          </div>
        ))}
        <AddButton onClick={addValor}>Adicionar valor</AddButton>
      </FormSection>
    </div>
  )
}
