'use client'
import React, { useState } from 'react'
import { useDocsStore } from '@/stores/docsStore'
import type { PropostaData, Tecnologia } from '@/components/documentos/types/proposta'
import { Input } from '@/components/documentos/ui/Input'
import { Select } from '@/components/documentos/ui/Select'
import { AddButton } from '@/components/documentos/ui/AddButton'
import { FormSection } from '@/components/documentos/ui/FormSection'
const CATEGORIAS = [
  'Frontend', 'Backend', 'Banco de Dados', 'Cloud', 'DevOps',
  'Analytics', 'IA', 'Mobile', 'Automação', 'Plataforma',
  'Produtividade', 'Design', 'Infra', 'Tooling', 'Serviço', 'Outro',
]

const CATEGORIA_COLORS: Record<string, string> = {
  Frontend: '#3b82f6',
  Backend: '#8b5cf6',
  'Banco de Dados': '#f59e0b',
  Cloud: '#06b6d4',
  DevOps: '#64748b',
  Analytics: '#10b981',
  IA: '#ec4899',
  Mobile: '#f97316',
  Automação: '#a855f7',
  Plataforma: '#14b8a6',
  Produtividade: '#6366f1',
  Design: '#e11d48',
  Infra: '#78716c',
  Tooling: '#4ade80',
  Serviço: '#fbbf24',
  Outro: '#94a3b8',
}

// Master technology list (nome + categoria only — no IDs needed here)
const ALL_TECHS: { nome: string; categoria: string }[] = [
  { nome: 'PHP', categoria: 'Backend' }, { nome: 'Dataverse', categoria: 'Plataforma' },
  { nome: 'Power Automate', categoria: 'Automação' }, { nome: 'Power BI', categoria: 'Analytics' },
  { nome: 'Looker Studio', categoria: 'Analytics' }, { nome: 'JavaScript', categoria: 'Frontend' },
  { nome: 'Google Cloud', categoria: 'Cloud' }, { nome: 'Oracle', categoria: 'Banco de Dados' },
  { nome: 'SharePoint', categoria: 'Plataforma' }, { nome: 'Power Apps', categoria: 'Plataforma' },
  { nome: 'Laravel', categoria: 'Backend' }, { nome: 'Java', categoria: 'Backend' },
  { nome: 'Supabase', categoria: 'Backend' }, { nome: 'Node.js', categoria: 'Backend' },
  { nome: 'Excel', categoria: 'Produtividade' }, { nome: 'n8n', categoria: 'Automação' },
  { nome: 'React', categoria: 'Frontend' }, { nome: 'Open AI', categoria: 'IA' },
  { nome: 'Python', categoria: 'Backend' }, { nome: 'MySQL', categoria: 'Banco de Dados' },
  { nome: 'AWS', categoria: 'Cloud' }, { nome: 'Git', categoria: 'DevOps' },
  { nome: 'Azure', categoria: 'Cloud' }, { nome: 'SQL', categoria: 'Banco de Dados' },
  { nome: 'Flutter', categoria: 'Mobile' }, { nome: 'Gemini', categoria: 'IA' },
  { nome: 'TypeScript', categoria: 'Frontend' }, { nome: 'Vue.js', categoria: 'Frontend' },
  { nome: 'Next.js', categoria: 'Frontend' }, { nome: 'Angular', categoria: 'Frontend' },
  { nome: 'Tailwind CSS', categoria: 'Frontend' }, { nome: 'Docker', categoria: 'DevOps' },
  { nome: 'Kubernetes', categoria: 'DevOps' }, { nome: 'GitHub', categoria: 'DevOps' },
  { nome: 'PostgreSQL', categoria: 'Banco de Dados' }, { nome: 'MongoDB', categoria: 'Banco de Dados' },
  { nome: 'Redis', categoria: 'Banco de Dados' }, { nome: 'Firebase', categoria: 'Backend' },
  { nome: 'FastAPI', categoria: 'Backend' }, { nome: 'Django', categoria: 'Backend' },
  { nome: '.NET', categoria: 'Backend' }, { nome: 'Go', categoria: 'Backend' },
  { nome: 'Vercel', categoria: 'Cloud' }, { nome: 'Figma', categoria: 'Design' },
  { nome: 'LangChain', categoria: 'IA' }, { nome: 'Hugging Face', categoria: 'IA' },
  { nome: 'Linux', categoria: 'DevOps' }, { nome: 'GraphQL', categoria: 'Backend' },
  { nome: 'REST API', categoria: 'Backend' }, { nome: 'Kotlin', categoria: 'Mobile' },
  { nome: 'Swift', categoria: 'Mobile' }, { nome: 'React Native', categoria: 'Mobile' },
  { nome: 'Expo', categoria: 'Mobile' }, { nome: 'Svelte', categoria: 'Frontend' },
  { nome: 'Astro', categoria: 'Frontend' }, { nome: 'Vite', categoria: 'Tooling' },
  { nome: 'Webpack', categoria: 'Tooling' }, { nome: 'Nginx', categoria: 'Infra' },
  { nome: 'Cloudflare', categoria: 'Infra' }, { nome: 'Terraform', categoria: 'DevOps' },
  { nome: 'Ansible', categoria: 'DevOps' }, { nome: 'DynamoDB', categoria: 'Banco de Dados' },
  { nome: 'BigQuery', categoria: 'Analytics' }, { nome: 'Elasticsearch', categoria: 'Banco de Dados' },
  { nome: 'Kafka', categoria: 'Backend' }, { nome: 'RabbitMQ', categoria: 'Backend' },
  { nome: 'WebSocket', categoria: 'Backend' }, { nome: 'Stripe', categoria: 'Serviço' },
  { nome: 'Twilio', categoria: 'Serviço' }, { nome: 'SendGrid', categoria: 'Serviço' },
  { nome: 'Auth0', categoria: 'Serviço' }, { nome: 'Zapier', categoria: 'Automação' },
  { nome: 'Make', categoria: 'Automação' }, { nome: 'PyTorch', categoria: 'IA' },
  { nome: 'Pandas', categoria: 'IA' }, { nome: 'Notion', categoria: 'Produtividade' },
  { nome: 'Jira', categoria: 'Produtividade' },
]

export function Step03_Tecnologias() {
  const s = useDocsStore()
  const d = s.getActiveData() as PropostaData
  const set = (v: Partial<PropostaData>) => s.setActiveData(v as Partial<Record<string, unknown>>)
  const techs: Tecnologia[] = d.tecnologias || []

  const [search, setSearch] = useState('')
  const [newNome, setNewNome] = useState('')
  const [newCat, setNewCat] = useState('Frontend')
  const [filterCat, setFilterCat] = useState('Todas')

  const selectedNames = new Set(techs.map(t => t.nome))

  const toggleTech = (nome: string, categoria: string) => {
    if (selectedNames.has(nome)) {
      set({ tecnologias: techs.filter(t => t.nome !== nome) })
    } else {
      set({ tecnologias: [...techs, { id: crypto.randomUUID(), nome, categoria }] })
    }
  }

  const addCustom = () => {
    if (!newNome.trim()) return
    if (selectedNames.has(newNome.trim())) return
    set({ tecnologias: [...techs, { id: crypto.randomUUID(), nome: newNome.trim(), categoria: newCat }] })
    setNewNome('')
  }

  const categoriesUsed = Array.from(new Set(ALL_TECHS.map(t => t.categoria))).sort()

  const filtered = ALL_TECHS.filter(t => {
    const matchSearch = !search || t.nome.toLowerCase().includes(search.toLowerCase())
    const matchCat = filterCat === 'Todas' || t.categoria === filterCat
    return matchSearch && matchCat
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Search + filter */}
      <FormSection title="Tecnologias do projeto" description="Clique para ativar ou desativar cada tecnologia">
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <Input
              label=""
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar tecnologia..."
            />
          </div>
          <div style={{ width: 140 }}>
            <Select
              label=""
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
              options={[{ value: 'Todas', label: 'Todas' }, ...categoriesUsed.map(c => ({ value: c, label: c }))]}
            />
          </div>
        </div>

        {/* Pills grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {filtered.map(t => {
            const active = selectedNames.has(t.nome)
            const color = CATEGORIA_COLORS[t.categoria] || '#94a3b8'
            return (
              <button
                key={t.nome}
                type="button"
                onClick={() => toggleTech(t.nome, t.categoria)}
                style={{
                  padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
                  transition: 'all 0.15s',
                  border: `1.5px solid ${active ? color : 'var(--gray3)'}`,
                  background: active ? `${color}18` : 'transparent',
                  color: active ? color : 'var(--gray2)',
                }}
              >
                {t.nome}
              </button>
            )
          })}
          {filtered.length === 0 && (
            <div style={{ fontSize: 12, color: 'var(--gray2)', padding: '8px 0' }}>Nenhuma tecnologia encontrada.</div>
          )}
        </div>

        {/* Selected summary */}
        {techs.length > 0 && (
          <div style={{ padding: '8px 12px', borderRadius: 8, background: 'var(--primary-dim)', border: '1px solid var(--primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--black)' }}>Selecionadas</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--primary)' }}>{techs.length}</span>
          </div>
        )}
      </FormSection>

      {/* Add custom tech */}
      <FormSection title="Adicionar personalizada">
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <Input
              label="Nome"
              value={newNome}
              onChange={e => setNewNome(e.target.value)}
              placeholder="Ex: Minha Stack"
              onKeyDown={e => { if (e.key === 'Enter') addCustom() }}
            />
          </div>
          <div style={{ width: 140 }}>
            <Select
              label="Categoria"
              value={newCat}
              onChange={e => setNewCat(e.target.value)}
              options={CATEGORIAS.map(c => ({ value: c, label: c }))}
            />
          </div>
        </div>
        <AddButton onClick={addCustom}>Adicionar tecnologia</AddButton>
      </FormSection>
    </div>
  )
}
