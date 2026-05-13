'use client'
import React, { useRef } from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, Cliente } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { FormSection } from '@/components/documentos/ui/FormSection'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { RemoveButton } from '@/components/documentos/ui/RemoveButton'

function LogoUploader({ logo, onChange }: { logo: string; onChange: (val: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [hov, setHov] = React.useState(false)

  function handleFile(file: File) {
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{
        fontSize: 10, fontWeight: 800, letterSpacing: '0.07em',
        textTransform: 'uppercase', color: 'var(--gray2)', display: 'block',
      }}>Logo</label>

      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {/* Preview */}
        <div style={{
          width: 72, height: 40, borderRadius: 8,
          border: '1px solid var(--gray3)', background: 'var(--bg)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flexShrink: 0,
        }}>
          {logo ? (
            <img src={logo} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <rect x="1.5" y="3" width="13" height="10" rx="1.5" stroke="var(--gray3)" strokeWidth="1.3"/>
              <circle cx="5.5" cy="6.5" r="1.2" stroke="var(--gray3)" strokeWidth="1.1"/>
              <path d="M1.5 11l3.5-3 2.5 2.5 2-2 4 4" stroke="var(--gray3)" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          )}
        </div>

        {/* Upload button */}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onMouseEnter={() => setHov(true)}
          onMouseLeave={() => setHov(false)}
          style={{
            padding: '5px 12px', borderRadius: 7, fontSize: 11, fontWeight: 700,
            border: '1px solid var(--gray3)',
            background: hov ? 'var(--bg)' : 'var(--white)',
            color: 'var(--gray)', cursor: 'pointer', transition: 'all 0.15s',
            display: 'flex', alignItems: 'center', gap: 5,
          }}
        >
          <svg width={11} height={11} viewBox="0 0 12 12" fill="none">
            <path d="M6 8V2M3 5l3-3 3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1.5 9.5h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          {logo ? 'Trocar' : 'Upload'}
        </button>

        {/* Clear */}
        {logo && (
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              padding: '5px 8px', borderRadius: 7, fontSize: 11, fontWeight: 700,
              border: '1px solid var(--gray3)', background: 'transparent',
              color: 'var(--gray2)', cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#DC2626'; e.currentTarget.style.color = '#DC2626' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--gray3)'; e.currentTarget.style.color = 'var(--gray2)' }}
            title="Remover logo"
          >×</button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

export function Step04_Clientes() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const clientes: Cliente[] = d.clientes || []

  const addCliente = () => set({ clientes: [...clientes, { id: crypto.randomUUID(), nome: '', logo: '' }] })
  const removeCliente = (id: string) => set({ clientes: clientes.filter(c => c.id !== id) })
  const updateCliente = (id: string, field: keyof Cliente, val: string) =>
    set({ clientes: clientes.map(c => c.id === id ? { ...c, [field]: val } : c) })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <FormSection title="Clientes do portfólio" description="Exibidos no slide de clientes atendidos">
        {clientes.map(c => (
          <div key={c.id} style={{
            border: '1px solid var(--gray3)', borderRadius: 10, padding: 12,
            display: 'flex', flexDirection: 'column', gap: 10,
            background: 'var(--white)',
          }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="Nome"
                  value={c.nome}
                  onChange={e => updateCliente(c.id, 'nome', e.target.value)}
                  placeholder="Ex: Vale"
                />
              </div>
              <RemoveButton onClick={() => removeCliente(c.id)} offsetTop={20} />
            </div>
            <LogoUploader
              logo={c.logo}
              onChange={val => updateCliente(c.id, 'logo', val)}
            />
          </div>
        ))}
        <AddButton onClick={addCliente}>Adicionar cliente</AddButton>
      </FormSection>
    </div>
  )
}
