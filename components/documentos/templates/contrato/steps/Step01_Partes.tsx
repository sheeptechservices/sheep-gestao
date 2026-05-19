import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ContratoData } from '@/components/documentos/types/contrato'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'

export function Step01_Partes() {
  const s = useDocsStore()
  const d = s.getActiveData() as ContratoData
  const set = (v: Partial<ContratoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Contratante (Cliente)">
        <Input
          label="Nome / Razão social"
          value={d.nomeCliente || ''}
          onChange={e => set({ nomeCliente: e.target.value })}
          placeholder="Ex: Acme Tecnologia LTDA"
        />
        <Input
          label="CNPJ"
          value={d.cnpjCliente || ''}
          onChange={e => set({ cnpjCliente: e.target.value })}
          placeholder="00.000.000/0001-00"
        />
        <Input
          label="Endereço completo"
          value={d.enderecoCliente || ''}
          onChange={e => set({ enderecoCliente: e.target.value })}
          placeholder="Rua, número – Cidade/UF – CEP"
        />
        <Input
          label="Representante legal"
          value={d.representanteCliente || ''}
          onChange={e => set({ representanteCliente: e.target.value })}
          placeholder="Ex: João Silva"
        />
        <Input
          label="Cargo do representante"
          value={d.cargoRepresentanteCliente || ''}
          onChange={e => set({ cargoRepresentanteCliente: e.target.value })}
          placeholder="Ex: Diretor Executivo"
        />
      </FormSection>

      <FormSection title="Contratada (Sheep)">
        <Input
          label="Razão social"
          value={d.nomeContratada || ''}
          onChange={e => set({ nomeContratada: e.target.value })}
        />
        <Input
          label="CNPJ"
          value={d.cnpjContratada || ''}
          onChange={e => set({ cnpjContratada: e.target.value })}
        />
        <Input
          label="Endereço"
          value={d.enderecoContratada || ''}
          onChange={e => set({ enderecoContratada: e.target.value })}
        />
        <Input
          label="Representante legal"
          value={d.representanteContratada || ''}
          onChange={e => set({ representanteContratada: e.target.value })}
        />
      </FormSection>
    </div>
  )
}
