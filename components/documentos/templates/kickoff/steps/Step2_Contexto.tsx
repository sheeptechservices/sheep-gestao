import React from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { KickoffData, ObjetivoItem } from '@/components/documentos/types/kickoff'
import { Input } from '@/components/documentos/ui/Input'
import { Textarea } from '@/components/documentos/ui/Textarea'

export function Step2_Contexto() {
  const s = useDocsStore()
  const d = s.getActiveData() as KickoffData
  const set = (v: Partial<KickoffData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const objetivos: ObjetivoItem[] = d.objetivos || []

  const addObjetivo = () => set({ objetivos: [...objetivos, { id: crypto.randomUUID(), texto: '' }] })
  const removeObjetivo = (id: string) => set({ objetivos: objetivos.filter(o => o.id !== id) })
  const updateObjetivo = (id: string, val: string) =>
    set({ objetivos: objetivos.map(o => o.id === id ? { ...o, texto: val } : o) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Textarea
        label="Contexto do Projeto"
        value={d.contexto || ''}
        onChange={e => set({ contexto: e.target.value })}
        rows={4}
        placeholder="Descreva o contexto, histórico e motivação do projeto..."
      />
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--gray2)', borderBottom: '1px solid var(--gray3)', paddingBottom: 6 }}>
        Objetivos do Projeto
      </div>
      {objetivos.map((o, i) => (
        <div key={o.id} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ width: 24, height: 38, display: 'flex', alignItems: 'center', fontSize: 12, color: 'var(--primary)', fontWeight: 800, flexShrink: 0 }}>
            {String(i + 1).padStart(2, '0')}
          </div>
          <div style={{ flex: 1 }}>
            <Input
              label=""
              value={o.texto}
              onChange={e => updateObjetivo(o.id, e.target.value)}
              placeholder="Ex: Reduzir o tempo de operação em 40%"
            />
          </div>
          <button
            onClick={() => removeObjetivo(o.id)}
            style={{ height: 38, width: 38, borderRadius: 8, border: '1px solid var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', flexShrink: 0, fontSize: 14 }}
          >✕</button>
        </div>
      ))}
      <button
        onClick={addObjetivo}
        style={{ height: 36, borderRadius: 8, border: '1px dashed var(--gray3)', background: 'transparent', cursor: 'pointer', color: 'var(--gray2)', fontSize: 13, fontWeight: 600 }}
      >+ Adicionar Objetivo</button>
    </div>
  )
}
