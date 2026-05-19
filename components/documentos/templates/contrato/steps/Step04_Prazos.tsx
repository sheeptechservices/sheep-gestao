import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { ContratoData } from '@/components/documentos/types/contrato'
import { DatePicker } from '@/components/documentos/ui/DatePicker'
import { Textarea } from '@/components/documentos/ui/Textarea'
import { FormSection } from '@/components/documentos/ui/FormSection'

export function Step04_Prazos() {
  const s = useDocsStore()
  const d = s.getActiveData() as ContratoData
  const set = (v: Partial<ContratoData>) => s.setActiveData(v as Partial<Record<string, unknown>>)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Datas do contrato">
        <DatePicker
          label="Data de assinatura"
          value={d.dataAssinatura || ''}
          onChange={val => set({ dataAssinatura: val })}
        />
        <DatePicker
          label="Data de início dos serviços"
          value={d.dataInicio || ''}
          onChange={val => set({ dataInicio: val })}
        />
        <DatePicker
          label="Data de término / entrega final"
          value={d.dataTermino || ''}
          onChange={val => set({ dataTermino: val })}
        />
      </FormSection>

      <FormSection title="Condições especiais (opcional)">
        <Textarea
          label=""
          value={d.condicoesEspeciais || ''}
          onChange={e => set({ condicoesEspeciais: e.target.value })}
          rows={4}
          placeholder="Cláusulas adicionais, restrições específicas, acordos particulares entre as partes..."
        />
      </FormSection>
    </div>
  )
}
