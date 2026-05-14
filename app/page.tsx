'use client'
import { useState, useEffect, useMemo } from 'react'
import { calcProgress } from '@/lib/utils'
import { StatCard } from '@/components/dashboard/StatCard'
import { ProjectDonut } from '@/components/dashboard/ProjectDonut'
import { ProjectLineChart } from '@/components/dashboard/ProjectLineChart'
import { ProjectsTable } from '@/components/dashboard/ProjectsTable'
import { HorizontalBarsCard } from '@/components/dashboard/HorizontalBarsCard'
import { NpsSection } from '@/components/dashboard/NpsSection'
import { ClientMapCard } from '@/components/dashboard/ClientMapCard'
import type { Project, Task, Client } from '@/lib/types'

// ── Mock NPS surveys (always visible) ────────────────────────────────────────
const MOCK_SURVEYS = [
  { id: 'm1',  client_name: 'FM Rocket',         project_name: 'Plataforma AI',      score: 10 },
  { id: 'm2',  client_name: 'FM Rocket',         project_name: 'Plataforma AI',      score: 9  },
  { id: 'm3',  client_name: 'FM Rocket',         project_name: 'App Mobile',         score: 8  },
  { id: 'm4',  client_name: 'Multi10',           project_name: 'Dashboard BI',       score: 9  },
  { id: 'm5',  client_name: 'Multi10',           project_name: 'Dashboard BI',       score: 7  },
  { id: 'm6',  client_name: 'Click Promocional', project_name: 'Portal Web',         score: 6  },
  { id: 'm7',  client_name: 'Click Promocional', project_name: 'Portal Web',         score: 9  },
  { id: 'm8',  client_name: 'GR2',               project_name: 'Automação RPA',      score: 10 },
  { id: 'm9',  client_name: 'Prontomed',         project_name: 'SaaS Clínicas',      score: 8  },
  { id: 'm10', client_name: 'Orteconte',         project_name: 'Integração ERP',     score: 7  },
  { id: 'm11', client_name: 'GR2',               project_name: 'Automação RPA',      score: 9  },
  { id: 'm12', client_name: 'Prontomed',         project_name: 'SaaS Clínicas',      score: 10 },
]

function computeOverallNps(surveys: typeof MOCK_SURVEYS) {
  if (!surveys.length) return 0
  const p = surveys.filter(s => s.score >= 9).length
  const d = surveys.filter(s => s.score <= 6).length
  return Math.round(((p - d) / surveys.length) * 100)
}

const MOCK_NPS = computeOverallNps(MOCK_SURVEYS)

export default function DashboardPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks,    setTasks]    = useState<Task[]>([])
  const [clients,  setClients]  = useState<Client[]>([])
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/projects').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/clients').then(r => r.json()),
    ]).then(([p, t, c]) => {
      setProjects(p); setTasks(t); setClients(c)
      setLoading(false)
    })
  }, [])

  const activeProjects  = useMemo(() => projects.filter(p => p.status === 'active'), [projects])
  const inProgressTasks = useMemo(() => tasks.filter(t => !t.done), [tasks])
  const avgProgress     = useMemo(() => {
    if (activeProjects.length === 0) return 0
    return Math.round(activeProjects.reduce((s, p) => s + calcProgress(p.start_date, p.end_date), 0) / activeProjects.length)
  }, [activeProjects])

  const byGestor = useMemo(() => Array.from(
    projects.reduce((m, p) => {
      const g = p.gestor ?? 'Sem gestor'
      m.set(g, (m.get(g) ?? 0) + 1)
      return m
    }, new Map<string, number>())
  ).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count), [projects])

  const byDev = useMemo(() => Array.from(
    projects.reduce((m, p) => {
      (p.team_members ?? []).forEach(member => {
        m.set(member, (m.get(member) ?? 0) + 1)
      })
      return m
    }, new Map<string, number>())
  ).map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count), [projects])

  const byCliente = useMemo(() => {
    const map = new Map<string, { count: number; color?: string }>()
    projects.forEach(p => {
      const name = p.client?.name ?? 'Sem cliente'
      const existing = map.get(name)
      map.set(name, {
        count: (existing?.count ?? 0) + 1,
        color: existing?.color ?? p.client?.color_hex,
      })
    })
    return Array.from(map.entries())
      .map(([label, { count, color }]) => ({ label, count, color }))
      .sort((a, b) => b.count - a.count)
  }, [projects])

  const hasProjects = projects.length > 0
  const hasBars     = byGestor.length > 0 || byDev.length > 0 || byCliente.length > 0

  const sk = (w: string | number, h: number, r = 6) => (
    <div className="shimmer-bar" style={{ width: w, height: h, borderRadius: r, background: 'var(--gray3)', flexShrink: 0 }} />
  )

  if (loading) return (
    <div style={{ animation: 'fadeIn .3s ease both' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        {sk(120, 14, 5)}
        <div style={{ marginTop: 8 }}>{sk(260, 11, 5)}</div>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 16, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 10, boxShadow: 'var(--shadow)' }}>
            {sk('50%', 10, 4)}
            {sk('70%', 28, 6)}
            {sk('40%', 10, 4)}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
        {[0,1].map(i => (
          <div key={i} style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow)', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {sk(140, 10, 4)}
            <div style={{ marginTop: 4 }}>{sk('100%', 160, 8)}</div>
          </div>
        ))}
      </div>

      {/* Bars row */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 16, padding: '36px 36px', marginBottom: 28, boxShadow: 'var(--shadow)', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40 }}>
        {[0,1,2].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {sk(100, 10, 4)}
            {[0,1,2,3].map(j => (
              <div key={j} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {sk(28, 28, 100)}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {sk('70%', 10, 4)}
                  {sk('90%', 6, 3)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Table rows */}
      <div style={{ background: 'var(--white)', border: '1px solid var(--gray3)', borderRadius: 16, overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--gray3)', display: 'flex', gap: 12 }}>
          {sk(80, 10, 4)}{sk(60, 10, 4)}{sk(70, 10, 4)}
        </div>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ padding: '14px 20px', borderBottom: '1px solid var(--gray3)', display: 'flex', alignItems: 'center', gap: 16 }}>
            {sk(16, 16, 4)}
            {sk('25%', 12, 4)}
            {sk('15%', 10, 4)}
            {sk('12%', 10, 4)}
            <div style={{ flex: 1 }} />
            {sk(80, 6, 3)}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--black)' }}>Dashboard</h1>
        <p style={{ fontSize: 13, color: 'var(--gray)', marginTop: 2 }}>
          Visão geral dos projetos e prioridades da Sheep Tech
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        <StatCard label="Total de projetos" value={projects.length}       sub="projetos cadastrados" index={0} />
        <StatCard label="Em andamento"       value={activeProjects.length} sub="em execução agora"    index={1} />
        <StatCard label="Total de clientes" value={clients.length}        sub="clientes ativos"      index={2} />
        <StatCard
          label="NPS médio"
          value={MOCK_NPS}
          format={n => (n >= 0 ? `+${n}` : `${n}`)}
          accent={MOCK_NPS >= 80 ? '#1E8A3E' : MOCK_NPS >= 0 ? '#FFB400' : '#D93025'}
          sub={MOCK_NPS >= 80 ? 'Excelência' : MOCK_NPS >= 0 ? 'Qualidade' : 'Aperfeiçoamento'}
          index={3}
        />
      </div>

      {/* Empty state — no projects yet */}
      {!loading && !hasProjects && (
        <div style={{
          background: 'var(--white)', border: '1px solid var(--gray3)',
          borderRadius: 16, padding: '56px 40px', marginBottom: 28,
          boxShadow: 'var(--shadow)', textAlign: 'center',
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--black)', marginBottom: 6 }}>
            Nenhum projeto cadastrado ainda
          </div>
          <div style={{ fontSize: 13, color: 'var(--gray)', maxWidth: 360, margin: '0 auto', lineHeight: 1.6 }}>
            Comece criando um cliente em{' '}
            <a href="/clients" style={{ color: 'var(--primary-text)', fontWeight: 700, textDecoration: 'none' }}>Clientes</a>
            {' '}e depois adicione projetos em{' '}
            <a href="/projects" style={{ color: 'var(--primary-text)', fontWeight: 700, textDecoration: 'none' }}>Projetos</a>.
          </div>
        </div>
      )}

      {/* Charts — only when there's data */}
      {hasProjects && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 28 }}>
            <div
              className="animate-slide-up delay-3"
              style={{
                background: 'var(--white)', border: '1px solid var(--gray3)',
                borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Projetos ao longo do tempo
              </div>
              <ProjectLineChart projects={projects} />
            </div>

            <div
              className="animate-slide-up delay-4"
              style={{
                background: 'var(--white)', border: '1px solid var(--gray3)',
                borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow)',
              }}
            >
              <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--gray2)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                Distribuição de projetos
              </div>
              <ProjectDonut projects={projects} />
            </div>
          </div>

          {/* Client map */}
          <div className="animate-slide-up delay-5" style={{ marginBottom: 28 }}>
            <ClientMapCard clients={clients} />
          </div>

          {/* NPS — always visible with mock data */}
          <NpsSection nps={MOCK_NPS} surveys={MOCK_SURVEYS} />

          {/* Bars row */}
          {hasBars && (
            <div style={{
              background: 'var(--white)', border: '1px solid var(--gray3)',
              borderRadius: 16, padding: '36px 36px', marginBottom: 28,
              boxShadow: 'var(--shadow)',
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 40,
            }}>
              <HorizontalBarsCard title="Projetos por gestor"  items={byGestor}  />
              <HorizontalBarsCard title="Projetos por dev"     items={byDev}     />
              <HorizontalBarsCard title="Projetos por cliente" items={byCliente} />
            </div>
          )}

          {/* Projects Table */}
          <ProjectsTable projects={projects} surveys={[]} />
        </>
      )}
    </div>
  )
}
