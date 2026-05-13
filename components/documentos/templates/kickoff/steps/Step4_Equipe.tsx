import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { KickoffData, MembroEquipe } from '@/components/documentos/types/kickoff'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'

export function Step4_Equipe() {
  const s = useDocsStore()
  const d = s.getActiveData() as KickoffData
  const set = (v: Partial<KickoffData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const equipe: MembroEquipe[] = d.equipe || []

  const addMembro = () => set({ equipe: [...equipe, { id: crypto.randomUUID(), nome: '', papel: '', email: '' }] })
  const removeMembro = (id: string) => set({ equipe: equipe.filter(m => m.id !== id) })
  const updateMembro = (id: string, field: keyof MembroEquipe, val: string) =>
    set({ equipe: equipe.map(m => m.id === id ? { ...m, [field]: val } : m) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6 }}>
        Membros da Equipe
      </div>
      {equipe.map(m => (
        <div key={m.id} style={{ border: '1px solid var(--gray3)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Nome"
                value={m.nome}
                onChange={e => updateMembro(m.id, 'nome', e.target.value)}
                placeholder="Ex: Thales Carneiro"
              />
            </div>
            <button
              onClick={() => removeMembro(m.id)}
              style={{ marginTop: 20, height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
            >✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input
              label="Papel / Cargo"
              value={m.papel}
              onChange={e => updateMembro(m.id, 'papel', e.target.value)}
              placeholder="Ex: Tech Lead"
            />
            <Input
              label="E-mail"
              type="email"
              value={m.email}
              onChange={e => updateMembro(m.id, 'email', e.target.value)}
              placeholder="Ex: thales@sheep.com"
            />
          </div>
        </div>
      ))}
      <button
        onClick={addMembro}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Membro</button>

      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6, marginTop: 4 }}>
        Canais de Comunicação
      </div>
      <Textarea
        label=""
        value={d.canaisComunicacao || ''}
        onChange={e => set({ canaisComunicacao: e.target.value })}
        rows={3}
        placeholder="Ex: Slack para comunicação diária · Reuniões semanais às segundas"
      />
    </div>
  )
}
