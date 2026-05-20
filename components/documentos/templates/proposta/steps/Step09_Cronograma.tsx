import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, Fase, SubFase } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

const MAX_SUBFASES = 8

export function Step09_Cronograma() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const fases: Fase[] = d.fases || []

  // ── Fase CRUD ──────────────────────────────────────────
  const addFase = () => set({ fases: [...fases, { id: crypto.randomUUID(), nome: '', mes: 1, semanas: 2, subfases: [] }] })
  const removeFase = (id: string) => set({ fases: fases.filter(f => f.id !== id) })
  const updateFase = (id: string, field: keyof Fase, val: string | number) =>
    set({ fases: fases.map(f => f.id === id ? { ...f, [field]: val } : f) })

  // ── SubFase CRUD ────────────────────────────────────────
  const addSubfase = (fid: string) =>
    set({ fases: fases.map(f => f.id === fid
      ? { ...f, subfases: [...(f.subfases || []), { id: crypto.randomUUID(), nome: '' }] }
      : f) })
  const removeSubfase = (fid: string, sid: string) =>
    set({ fases: fases.map(f => f.id === fid
      ? { ...f, subfases: (f.subfases || []).filter(s => s.id !== sid) }
      : f) })
  const updateSubfase = (fid: string, sid: string, val: string) =>
    set({ fases: fases.map(f => f.id === fid
      ? { ...f, subfases: (f.subfases || []).map((s: SubFase) => s.id === sid ? { ...s, nome: val } : s) }
      : f) })
  const updateSubfaseField = (fid: string, sid: string, field: keyof SubFase, val: number | undefined) =>
    set({ fases: fases.map(f => f.id === fid
      ? { ...f, subfases: (f.subfases || []).map((s: SubFase) => s.id === sid ? { ...s, [field]: val } : s) }
      : f) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Fases do projeto" description="O Gantt é gerado automaticamente a partir das fases">
        {fases.map((f, fi) => {
          const subs: SubFase[] = f.subfases || []
          return (
            <div key={f.id} style={{ border: '1px solid var(--gray3)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 8, background: 'var(--white)' }}>

              {/* Nome + remove */}
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
                <div style={{ flex: 1 }}>
                  <Input
                    label={`Fase ${fi + 1}`}
                    value={f.nome}
                    onChange={e => updateFase(f.id, 'nome', e.target.value)}
                    placeholder="Ex: Discovery"
                  />
                </div>
                <RemoveButton offsetTop={20} onClick={() => removeFase(f.id)} />
              </div>

              {/* Mês + Semanas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <Input
                  label="Mês de início"
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

              {/* Subfases / Detalhamento */}
              <div style={{ borderTop: '1px solid var(--gray3)', paddingTop: 10, marginTop: 2 }}>
                <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--gray2)', marginBottom: 8 }}>
                  Detalhamento
                </div>
                {subs.map((sub, si) => (
                  <div key={sub.id} style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: 'var(--yd)', border: '1px solid var(--yb)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 9, fontWeight: 800, color: '#2a4a00', flexShrink: 0,
                      }}>
                        {si + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <Input
                          label=""
                          value={sub.nome}
                          onChange={e => updateSubfase(f.id, sub.id, e.target.value)}
                          placeholder={`Ex: Entrevistas com stakeholders`}
                        />
                      </div>
                      <RemoveButton onClick={() => removeSubfase(f.id, sub.id)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, paddingLeft: 28 }}>
                      <Input
                        label="Mês (opcional)"
                        type="number"
                        value={sub.mes !== undefined ? String(sub.mes) : ''}
                        onChange={e => updateSubfaseField(f.id, sub.id, 'mes', e.target.value ? Number(e.target.value) : undefined)}
                        min={1}
                        placeholder="—"
                      />
                      <Input
                        label="Sem (opcional)"
                        type="number"
                        value={sub.semanas !== undefined ? String(sub.semanas) : ''}
                        onChange={e => updateSubfaseField(f.id, sub.id, 'semanas', e.target.value ? Number(e.target.value) : undefined)}
                        min={1}
                        placeholder="—"
                      />
                    </div>
                  </div>
                ))}
                {subs.length < MAX_SUBFASES && (
                  <AddButton onClick={() => addSubfase(f.id)}>Adicionar subfase</AddButton>
                )}
              </div>

            </div>
          )
        })}
        <AddButton onClick={addFase}>Adicionar fase</AddButton>
      </FormSection>
    </div>
  )
}
