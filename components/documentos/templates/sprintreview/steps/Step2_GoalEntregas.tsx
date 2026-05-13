import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { SprintReviewData, EntregaSprint, EntregaStatus } from '@/components/documentos/types/sprintreview'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'

const STATUS_OPTIONS: { value: EntregaStatus; label: string }[] = [
  { value: 'done', label: '✓ Done' },
  { value: 'partial', label: '~ Parcial' },
  { value: 'blocked', label: '✗ Bloqueado' },
]

export function Step2_GoalEntregas() {
  const s = useDocsStore()
  const d = s.getActiveData() as SprintReviewData
  const set = (v: Partial<SprintReviewData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const entregas: EntregaSprint[] = d.entregas || []

  const addEntrega = () => set({ entregas: [...entregas, { id: crypto.randomUUID(), titulo: '', status: 'done' }] })
  const removeEntrega = (id: string) => set({ entregas: entregas.filter(e => e.id !== id) })
  const updateEntrega = (id: string, field: keyof EntregaSprint, val: string) =>
    set({ entregas: entregas.map(e => e.id === id ? { ...e, [field]: val } : e) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Input
        label="Sprint Goal (Meta)"
        value={d.meta || ''}
        onChange={e => set({ meta: e.target.value })}
        placeholder="Ex: Entregar o módulo de autenticação completo"
      />
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--black)' }}>Meta atingida?</span>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 13 }}>
          <input
            type="checkbox"
            checked={d.metaAtingida ?? true}
            onChange={e => set({ metaAtingida: e.target.checked })}
            style={{ accentColor: 'var(--primary)', width: 16, height: 16 }}
          />
          {d.metaAtingida ? '✅ Sim' : '⚠️ Não'}
        </label>
      </div>
      <Textarea
        label="Resultado / Observações"
        value={d.resultado || ''}
        onChange={e => set({ resultado: e.target.value })}
        rows={3}
        placeholder="Descreva o que foi alcançado neste sprint..."
      />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6 }}>
        Entregas do Sprint
      </div>
      {entregas.map(e => (
        <div key={e.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label=""
              value={e.titulo}
              onChange={ev => updateEntrega(e.id, 'titulo', ev.target.value)}
              placeholder="Ex: Login com OAuth2"
            />
          </div>
          <div style={{ width: 120 }}>
            <label style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', display: 'block', marginBottom: 4 }}>Status</label>
            <select
              value={e.status}
              onChange={ev => updateEntrega(e.id, 'status', ev.target.value)}
              style={{ height: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'var(--white)', padding: '0 8px', fontSize: 12, fontFamily: 'Manrope, sans-serif', color: 'var(--black)', outline: 'none', width: '100%' }}
            >
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <button
            onClick={() => removeEntrega(e.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={addEntrega}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Entrega</button>
    </div>
  )
}
