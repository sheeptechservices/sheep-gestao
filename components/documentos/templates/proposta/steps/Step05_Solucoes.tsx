import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, SolucaoSheep } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step05_Solucoes() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const solucoes: SolucaoSheep[] = d.solucoesSheep || []

  const addSolucao = () => set({ solucoesSheep: [...solucoes, { id: crypto.randomUUID(), icone: '⚡', titulo: '', descricao: '' }] })
  const removeSolucao = (id: string) => set({ solucoesSheep: solucoes.filter(s => s.id !== id) })
  const updateSolucao = (id: string, field: keyof SolucaoSheep, val: string) =>
    set({ solucoesSheep: solucoes.map(s => s.id === id ? { ...s, [field]: val } : s) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Soluções Sheep" description="Serviços e produtos apresentados no slide">
        {solucoes.map(sol => (
          <div key={sol.id} style={{ border: '1px solid var(--gray3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ width: 64 }}>
                <Input
                  label="Ícone"
                  value={sol.icone}
                  onChange={e => updateSolucao(sol.id, 'icone', e.target.value)}
                  placeholder="👥"
                  style={{ textAlign: 'center', fontSize: 18 }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <Input
                  label="Título"
                  value={sol.titulo}
                  onChange={e => updateSolucao(sol.id, 'titulo', e.target.value)}
                  placeholder="Ex: Teams as a Service"
                />
              </div>
              <RemoveButton offsetTop={20} onClick={() => removeSolucao(sol.id)} />
            </div>
            <Textarea
              label="Descrição"
              value={sol.descricao}
              onChange={e => updateSolucao(sol.id, 'descricao', e.target.value)}
              rows={2}
              placeholder="Descreva a solução brevemente..."
            />
          </div>
        ))}
        <AddButton onClick={addSolucao}>Adicionar solução</AddButton>
      </FormSection>
    </div>
  )
}
