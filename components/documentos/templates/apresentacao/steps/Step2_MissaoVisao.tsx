import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ApresentacaoData } from '@/components/documentos/types/apresentacao'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'

export function Step2_MissaoVisao() {
  const s = useDocsStore()
  const d = s.getActiveData() as ApresentacaoData
  const set = (v: Partial<ApresentacaoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Textarea
        label="Missão"
        value={d.missao || ''}
        onChange={e => set({ missao: e.target.value })}
        rows={3}
        placeholder="Ex: Fazer a tecnologia parar de ser discurso e virar vantagem competitiva real."
      />
      <Textarea
        label="Visão"
        value={d.visao || ''}
        onChange={e => set({ visao: e.target.value })}
        rows={3}
        placeholder="Ex: Ser referência em inovação aplicada no Brasil."
      />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6, marginTop: 4 }}>
        Números da Empresa
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <Input
          label="Ano de Fundação"
          value={d.anoFundacao || ''}
          onChange={e => set({ anoFundacao: e.target.value })}
          placeholder="Ex: 2020"
        />
        <Input
          label="Projetos Entregues"
          value={d.numProjetos || ''}
          onChange={e => set({ numProjetos: e.target.value })}
          placeholder="Ex: 80+"
        />
        <Input
          label="Clientes Atendidos"
          value={d.numClientes || ''}
          onChange={e => set({ numClientes: e.target.value })}
          placeholder="Ex: 30+"
        />
        <Input
          label="Profissionais"
          value={d.numProfissionais || ''}
          onChange={e => set({ numProfissionais: e.target.value })}
          placeholder="Ex: 20+"
        />
      </div>
    </div>
  )
}
