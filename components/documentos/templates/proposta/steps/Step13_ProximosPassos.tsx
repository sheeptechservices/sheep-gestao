import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, ProximoPasso } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

export function Step13_ProximosPassos() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const passos: ProximoPasso[] = d.proximosPassos || []

  const addPasso = () => set({ proximosPassos: [...passos, { id: crypto.randomUUID(), texto: '' }] })
  const removePasso = (id: string) => set({ proximosPassos: passos.filter(p => p.id !== id) })
  const updatePasso = (id: string, val: string) =>
    set({ proximosPassos: passos.map(p => p.id === id ? { ...p, texto: val } : p) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Próximos passos">
        {passos.map((p, i) => (
          <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div style={{
              width: 24, height: 34, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 10, color: 'var(--primary)',
              fontWeight: 800, flexShrink: 0, letterSpacing: '0.05em',
            }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div style={{ flex: 1 }}>
              <Input
                label=""
                value={p.texto}
                onChange={e => updatePasso(p.id, e.target.value)}
                placeholder="Ex: Validação da proposta com a equipe"
              />
            </div>
            <RemoveButton onClick={() => removePasso(p.id)} />
          </div>
        ))}
        <AddButton onClick={addPasso}>Adicionar passo</AddButton>
      </FormSection>

      <FormSection title="Contato">
        <Input
          label="Nome do contato"
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
        <Input
          label="Validade da proposta"
          value={d.validadeProposta || ''}
          onChange={e => set({ validadeProposta: e.target.value })}
          placeholder="Ex: 30 dias"
        />
      </FormSection>
    </div>
  )
}
