import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ApresentacaoData } from '@/components/documentos/types/apresentacao'
import { Input } from '@/components/documentos/ui/Input'

export function Step5_ClientesContato() {
  const s = useDocsStore()
  const d = s.getActiveData() as ApresentacaoData
  const set = (v: Partial<ApresentacaoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6 }}>
        Contato
      </div>
      <Input
        label="Nome do Contato"
        value={d.nomeContato || ''}
        onChange={e => set({ nomeContato: e.target.value })}
        placeholder="Ex: Thales Carneiro"
      />
      <Input
        label="E-mail"
        type="email"
        value={d.emailContato || ''}
        onChange={e => set({ emailContato: e.target.value })}
        placeholder="Ex: contato@sheeptechnology.com.br"
      />
      <Input
        label="Telefone"
        value={d.telefoneContato || ''}
        onChange={e => set({ telefoneContato: e.target.value })}
        placeholder="Ex: (11) 99999-9999"
      />
    </div>
  )
}
