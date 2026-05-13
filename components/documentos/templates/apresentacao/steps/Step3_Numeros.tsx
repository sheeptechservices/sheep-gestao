import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ApresentacaoData, Servico } from '@/components/documentos/types/apresentacao'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'

export function Step3_Numeros() {
  const s = useDocsStore()
  const d = s.getActiveData() as ApresentacaoData
  const set = (v: Partial<ApresentacaoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const servicos: Servico[] = d.servicos || []

  const addServico = () => set({ servicos: [...servicos, { id: crypto.randomUUID(), icone: '⚡', titulo: '', descricao: '' }] })
  const removeServico = (id: string) => set({ servicos: servicos.filter(s => s.id !== id) })
  const updateServico = (id: string, field: keyof Servico, val: string) =>
    set({ servicos: servicos.map(s => s.id === id ? { ...s, [field]: val } : s) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--gray2)', marginBottom: 4 }}>
        Serviços e soluções da empresa.
      </div>
      {servicos.map(sv => (
        <div key={sv.id} style={{ border: '1px solid var(--gray3)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ width: 70 }}>
              <Input
                label="Ícone"
                value={sv.icone}
                onChange={e => updateServico(sv.id, 'icone', e.target.value)}
                placeholder="👥"
              />
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label="Título"
                value={sv.titulo}
                onChange={e => updateServico(sv.id, 'titulo', e.target.value)}
                placeholder="Ex: Teams as a Service"
              />
            </div>
            <button
              onClick={() => removeServico(sv.id)}
              style={{ marginTop: 20, height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
            >✕</button>
          </div>
          <Textarea
            label="Descrição"
            value={sv.descricao}
            onChange={e => updateServico(sv.id, 'descricao', e.target.value)}
            rows={2}
            placeholder="Ex: Equipe sob demanda para seus projetos digitais."
          />
        </div>
      ))}
      <button
        onClick={addServico}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Serviço</button>
    </div>
  )
}
