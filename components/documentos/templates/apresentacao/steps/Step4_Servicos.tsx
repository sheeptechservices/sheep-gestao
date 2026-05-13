import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ApresentacaoData } from '@/components/documentos/types/apresentacao'
import type { Cliente } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'

export function Step4_Servicos() {
  const s = useDocsStore()
  const d = s.getActiveData() as ApresentacaoData
  const set = (v: Partial<ApresentacaoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const clientes: Cliente[] = d.clientes || []

  const addCliente = () => set({ clientes: [...clientes, { id: crypto.randomUUID(), nome: '', logo: '' }] })
  const removeCliente = (id: string) => set({ clientes: clientes.filter(c => c.id !== id) })
  const updateCliente = (id: string, val: string) =>
    set({ clientes: clientes.map(c => c.id === id ? { ...c, nome: val } : c) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, color: 'var(--gray2)', marginBottom: 4 }}>
        Clientes e parceiros para o slide de portfólio.
      </div>
      {clientes.map(c => (
        <div key={c.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Nome do Cliente"
              value={c.nome}
              onChange={e => updateCliente(c.id, e.target.value)}
              placeholder="Ex: Vale"
            />
          </div>
          <button
            onClick={() => removeCliente(c.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={addCliente}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Cliente</button>
    </div>
  )
}
