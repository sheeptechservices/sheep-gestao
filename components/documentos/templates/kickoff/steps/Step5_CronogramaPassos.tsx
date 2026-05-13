import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { KickoffData, PassoKickoff } from '@/components/documentos/types/kickoff'
import type { Fase } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6, marginTop: 4 }}>
    {children}
  </div>
)

export function Step5_CronogramaPassos() {
  const s = useDocsStore()
  const d = s.getActiveData() as KickoffData
  const set = (v: Partial<KickoffData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const fases: Fase[] = d.fases || []
  const passos: PassoKickoff[] = d.proximosPassos || []

  const addFase = () => set({ fases: [...fases, { id: crypto.randomUUID(), nome: '', mes: 1, semanas: 2 }] })
  const removeFase = (id: string) => set({ fases: fases.filter(f => f.id !== id) })
  const updateFase = (id: string, field: keyof Fase, val: string | number) =>
    set({ fases: fases.map(f => f.id === id ? { ...f, [field]: val } : f) })

  const addPasso = () => set({ proximosPassos: [...passos, { id: crypto.randomUUID(), texto: '' }] })
  const removePasso = (id: string) => set({ proximosPassos: passos.filter(p => p.id !== id) })
  const updatePasso = (id: string, val: string) =>
    set({ proximosPassos: passos.map(p => p.id === id ? { ...p, texto: val } : p) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <SectionTitle>Cronograma (Fases)</SectionTitle>
      {fases.map(f => (
        <div key={f.id} style={{ border: '1px solid var(--gray3)', borderRadius: 8, padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <Input
                label="Fase"
                value={f.nome}
                onChange={e => updateFase(f.id, 'nome', e.target.value)}
                placeholder="Ex: Discovery"
              />
            </div>
            <button
              onClick={() => removeFase(f.id)}
              style={{ marginTop: 20, height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
            >✕</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <Input
              label="Mês de Início"
              type="number"
              value={String(f.mes)}
              onChange={e => updateFase(f.id, 'mes', Number(e.target.value))}
              min={1}
            />
            <Input
              label="Duração (semanas)"
              type="number"
              value={String(f.semanas)}
              onChange={e => updateFase(f.id, 'semanas', Number(e.target.value))}
              min={1}
            />
          </div>
        </div>
      ))}
      <button
        onClick={addFase}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Fase</button>

      <SectionTitle>Próximos Passos Pós-Kickoff</SectionTitle>
      {passos.map((p, i) => (
        <div key={p.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ width: 24, height: 38, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label=""
              value={p.texto}
              onChange={e => updatePasso(p.id, e.target.value)}
              placeholder="Ex: Setup do repositório e ambientes"
            />
          </div>
          <button
            onClick={() => removePasso(p.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={addPasso}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Passo</button>
    </div>
  )
}
