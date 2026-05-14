'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { useQuickSearch } from '@/stores/quickSearchStore'
import { useChatStore } from '@/stores/chatStore'
import { DEFAULT_AGENTS } from '@/lib/agents'
import type { Project, ProjectStatus, Client, ClientStatus, AgentType } from '@/lib/types'
import type { AgentDefinition } from '@/lib/agents'
import { ProjectDetailDrawer } from './ProjectDetailDrawer'
import { ClientDetailDrawer } from './ClientDetailDrawer'

// ── Status configs ────────────────────────────────────────────────────────────

const PROJECT_STATUS: Record<ProjectStatus, { label: string; color: string; bg: string }> = {
  active:      { label: 'Em curso',        color: '#B45309', bg: 'rgba(251,191,36,0.13)' },
  negotiation: { label: 'Em negociação',   color: '#0284C7', bg: 'rgba(2,132,199,0.11)'  },
  completed:   { label: 'Finalizado',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.11)'  },
  paused:      { label: 'Pausado',         color: '#7C3AED', bg: 'rgba(124,58,237,0.11)' },
  cancelled:   { label: 'Cancelado',       color: '#D93025', bg: 'rgba(217,48,37,0.10)'  },
}

const CLIENT_STATUS: Record<ClientStatus, { label: string; color: string; bg: string }> = {
  active:    { label: 'Ativo',      color: '#1E8A3E', bg: 'rgba(30,138,62,0.10)'   },
  inactive:  { label: 'Inativo',    color: '#666666', bg: 'rgba(18,19,22,0.06)'    },
  paused:    { label: 'Pausado',    color: '#7C3AED', bg: 'rgba(124,58,237,0.10)'  },
  cancelled: { label: 'Encerrado', color: '#D93025', bg: 'rgba(217,48,37,0.10)'   },
}

// ── Pages ─────────────────────────────────────────────────────────────────────

type PageDef = { label: string; href: string; description: string; section: string }

const PAGES: PageDef[] = [
  { label: 'Dashboard',     href: '/',           description: 'Visão geral e resumo',         section: 'Principal'  },
  { label: 'Gestão',        href: '/tasks',      description: 'Quadro semanal de entregáveis', section: 'Principal'  },
  { label: 'Gerador',       href: '/documentos', description: 'Geração de documentos',         section: 'Principal'  },
  { label: 'Projetos',      href: '/projects',   description: 'Lista de projetos',             section: 'Cadastros'  },
  { label: 'Clientes',      href: '/clients',    description: 'Cadastro de clientes',          section: 'Cadastros'  },
  { label: 'Especialistas', href: '/specialists',description: 'Agentes especialistas',         section: 'Cadastros'  },
  { label: 'Configurações', href: '/settings',   description: 'Preferências do sistema',       section: 'Sistema'    },
]

// ── Result item types ─────────────────────────────────────────────────────────

type ResultItem =
  | { kind: 'page';    data: PageDef }
  | { kind: 'project'; data: Project }
  | { kind: 'client';  data: Client }
  | { kind: 'agent';   data: AgentDefinition }

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ label, count }: { label: string; count: number }) {
  return (
    <div style={{
      padding: '8px 18px 4px',
      fontSize: 10, fontWeight: 800, color: 'var(--gray2)',
      textTransform: 'uppercase', letterSpacing: '0.10em',
    }}>
      {label} — {count}
    </div>
  )
}

// ── Component ─────────────────────────────────────────────────────────────────

export function QuickSearch() {
  const { isOpen, close }   = useQuickSearch()
  const openChat            = useChatStore(s => s.openChat)
  const router              = useRouter()

  const [mounted,       setMounted]       = useState(false)
  const [query,         setQuery]         = useState('')
  const [projects,      setProjects]      = useState<Project[]>([])
  const [clients,       setClients]       = useState<Client[]>([])
  const [selectedIdx,   setSelectedIdx]   = useState(0)
  const [detailProject, setDetailProject] = useState<Project | null>(null)
  const [detailClient,  setDetailClient]  = useState<Client | null>(null)

  const inputRef   = useRef<HTMLInputElement>(null)
  const fetchedRef = useRef(false)

  useEffect(() => { setMounted(true) }, [])

  // Fetch projects + clients once on first open
  useEffect(() => {
    if (isOpen && !fetchedRef.current) {
      fetchedRef.current = true
      Promise.all([
        fetch('/api/projects').then(r => r.json()),
        fetch('/api/clients').then(r => r.json()),
      ])
        .then(([projs, cls]: [Project[], Client[]]) => { setProjects(projs); setClients(cls) })
        .catch(console.error)
    }
  }, [isOpen])

  // Reset + focus when overlay opens
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIdx(0)
      const t = setTimeout(() => inputRef.current?.focus(), 40)
      return () => clearTimeout(t)
    }
  }, [isOpen])

  // ── Filtered results ────────────────────────────────────────────────────────

  const filteredPages = query
    ? PAGES.filter(p => {
        const q = query.toLowerCase()
        return p.label.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
      })
    : PAGES   // always show all pages when query is empty

  const filteredProjects = query
    ? projects.filter(p => {
        const q = query.toLowerCase()
        return p.name.toLowerCase().includes(q) || (p.client?.name ?? '').toLowerCase().includes(q)
      })
    : []

  const filteredClients = query
    ? clients.filter(c => c.name.toLowerCase().includes(query.toLowerCase()))
    : []

  const filteredAgents = query
    ? DEFAULT_AGENTS.filter(a => {
        const q = query.toLowerCase()
        return a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)
      })
    : []

  // Flat list for keyboard navigation: pages → projects → clients → agents
  const allResults: ResultItem[] = [
    ...filteredPages.map(p    => ({ kind: 'page'    as const, data: p })),
    ...filteredProjects.map(p => ({ kind: 'project' as const, data: p })),
    ...filteredClients.map(c  => ({ kind: 'client'  as const, data: c })),
    ...filteredAgents.map(a   => ({ kind: 'agent'   as const, data: a })),
  ]

  const totalCount = allResults.length

  useEffect(() => { setSelectedIdx(0) }, [query])

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSelectPage = useCallback((page: PageDef) => {
    close()
    router.push(page.href)
  }, [close, router])

  const handleSelectProject = useCallback((project: Project) => {
    close()
    setDetailProject(project)
  }, [close])

  const handleSelectClient = useCallback((client: Client) => {
    close()
    setDetailClient(client)
  }, [close])

  const handleSelectAgent = useCallback((agent: AgentDefinition) => {
    close()
    openChat(agent.type as AgentType)
  }, [close, openChat])

  const handleSelect = useCallback((item: ResultItem) => {
    if (item.kind === 'page')    handleSelectPage(item.data as PageDef)
    else if (item.kind === 'project') handleSelectProject(item.data as Project)
    else if (item.kind === 'client')  handleSelectClient(item.data as Client)
    else                              handleSelectAgent(item.data as AgentDefinition)
  }, [handleSelectPage, handleSelectProject, handleSelectClient, handleSelectAgent])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIdx(i => Math.min(i + 1, totalCount - 1))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIdx(i => Math.max(i - 1, 0))
        break
      case 'Enter':
        e.preventDefault()
        if (allResults[selectedIdx]) handleSelect(allResults[selectedIdx])
        break
      case 'Escape':
        close()
        break
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allResults, selectedIdx, handleSelect, close])

  if (!mounted) return null

  // Show results panel when there is a query OR when pages are shown (always)
  const showResults  = true
  const hasAny       = totalCount > 0

  // Global index offsets
  const projectOffset = filteredPages.length
  const clientOffset  = filteredPages.length + filteredProjects.length
  const agentOffset   = filteredPages.length + filteredProjects.length + filteredClients.length

  return createPortal(
    <>
      {/* ── Search overlay ─────────────────────────────────────────────── */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            onClick={close}
            style={{
              position: 'fixed', inset: 0, zIndex: 99000,
              background: 'rgba(18,19,22,0.45)',
              backdropFilter: 'blur(6px)',
              animation: 'fadeIn 0.15s ease both',
            }}
          />

          {/* Centering wrapper */}
          <div style={{
            position: 'fixed', inset: 0, zIndex: 99001,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'none',
          }}>
            <div
              role="dialog"
              aria-label="Pesquisa rápida"
              style={{
                width: 'calc(100% - 48px)', maxWidth: 560,
                background: 'var(--white)',
                borderRadius: 16,
                boxShadow: '0 24px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(0,0,0,0.06)',
                animation: 'modalSlideUp 0.22s cubic-bezier(0.34,1.1,0.64,1) both',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
              {/* Input row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px',
                borderBottom: '1px solid var(--gray3)',
              }}>
                <svg width={17} height={17} viewBox="0 0 17 17" fill="none"
                  style={{ flexShrink: 0, color: 'var(--gray2)' }}>
                  <circle cx="7.5" cy="7.5" r="5" stroke="currentColor" strokeWidth="1.6"/>
                  <path d="M11 11l3.5 3.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
                </svg>

                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ir para página, projeto, cliente…"
                  style={{
                    flex: 1, border: 'none', outline: 'none', fontSize: 15,
                    color: 'var(--black)', background: 'transparent',
                    fontFamily: 'inherit', fontWeight: 500,
                    caretColor: 'var(--primary)',
                  }}
                />

                <kbd style={{
                  fontSize: 10, fontWeight: 700, color: 'var(--gray2)',
                  background: 'var(--bg)', border: '1px solid var(--gray3)',
                  borderRadius: 5, padding: '2px 6px', flexShrink: 0,
                  fontFamily: 'inherit', letterSpacing: 0,
                }}>
                  Esc
                </kbd>
              </div>

              {/* Results */}
              {showResults && (
                <div style={{ maxHeight: '50vh', overflowY: 'auto' }}>
                  {!hasAny ? (
                    <div style={{ padding: '32px 20px', textAlign: 'center', fontSize: 13, color: 'var(--gray2)' }}>
                      Nenhum resultado para{' '}
                      <span style={{ fontWeight: 700, color: 'var(--black)' }}>"{query}"</span>
                    </div>
                  ) : (
                    <>
                      {/* ── Páginas ── */}
                      {filteredPages.length > 0 && (
                        <>
                          <SectionLabel label={query ? 'Páginas' : 'Ir para'} count={filteredPages.length} />
                          {filteredPages.map((page, i) => {
                            const globalIdx     = i
                            const isHighlighted = globalIdx === selectedIdx
                            return (
                              <div
                                key={page.href}
                                onMouseEnter={() => setSelectedIdx(globalIdx)}
                                onClick={() => handleSelectPage(page)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 18px', cursor: 'pointer',
                                  background: isHighlighted ? 'var(--primary-dim)' : 'transparent',
                                  borderLeft: `2px solid ${isHighlighted ? 'var(--primary)' : 'transparent'}`,
                                  transition: 'background 0.08s',
                                }}
                              >
                                {/* Page icon */}
                                <div style={{
                                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                  background: 'var(--primary-dim)',
                                  border: '1px solid var(--primary-dim)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--primary)',
                                }}>
                                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M6 8h4M8 6v4"/>
                                    <rect x="2" y="2" width="12" height="12" rx="3"/>
                                  </svg>
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>
                                    {page.label}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1 }}>
                                    {page.description}
                                  </div>
                                </div>

                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: 'var(--gray2)',
                                  background: 'var(--bg)',
                                  border: '1px solid var(--gray3)',
                                  padding: '2px 8px', borderRadius: 100,
                                  flexShrink: 0, whiteSpace: 'nowrap',
                                }}>
                                  {page.section}
                                </span>
                              </div>
                            )
                          })}
                        </>
                      )}

                      {/* ── Projetos ── */}
                      {filteredProjects.length > 0 && (
                        <>
                          {filteredPages.length > 0 && (
                            <div style={{ height: 1, background: 'var(--gray3)', margin: '4px 0' }} />
                          )}
                          <SectionLabel label="Projetos" count={filteredProjects.length} />
                          {filteredProjects.map((p, i) => {
                            const globalIdx     = projectOffset + i
                            const isHighlighted = globalIdx === selectedIdx
                            const status        = PROJECT_STATUS[p.status] ?? PROJECT_STATUS['active']
                            return (
                              <div
                                key={p.id}
                                onMouseEnter={() => setSelectedIdx(globalIdx)}
                                onClick={() => handleSelectProject(p)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 18px', cursor: 'pointer',
                                  background: isHighlighted ? 'var(--primary-dim)' : 'transparent',
                                  borderLeft: `2px solid ${isHighlighted ? 'var(--primary)' : 'transparent'}`,
                                  transition: 'background 0.08s',
                                }}
                              >
                                <div style={{
                                  width: 10, height: 10, borderRadius: '50%',
                                  background: p.color_hex, flexShrink: 0,
                                  boxShadow: `0 0 0 2px ${p.color_hex}30`,
                                }} />

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{
                                    fontSize: 13, fontWeight: 700, color: 'var(--black)',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {p.name}
                                  </div>
                                  {p.client?.name && (
                                    <div style={{
                                      fontSize: 11, color: 'var(--gray2)', marginTop: 1,
                                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                    }}>
                                      {p.client.name}
                                    </div>
                                  )}
                                </div>

                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: status.color, background: status.bg,
                                  padding: '2px 8px', borderRadius: 100,
                                  flexShrink: 0, whiteSpace: 'nowrap',
                                }}>
                                  {status.label}
                                </span>
                              </div>
                            )
                          })}
                        </>
                      )}

                      {/* ── Clientes ── */}
                      {filteredClients.length > 0 && (
                        <>
                          {(filteredProjects.length > 0 || filteredPages.length > 0) && (
                            <div style={{ height: 1, background: 'var(--gray3)', margin: '4px 0' }} />
                          )}
                          <SectionLabel label="Clientes" count={filteredClients.length} />
                          {filteredClients.map((c, i) => {
                            const globalIdx     = clientOffset + i
                            const isHighlighted = globalIdx === selectedIdx
                            const color         = c.color_hex ?? '#84CC16'
                            const st            = c.status ? CLIENT_STATUS[c.status] : null
                            return (
                              <div
                                key={c.id}
                                onMouseEnter={() => setSelectedIdx(globalIdx)}
                                onClick={() => handleSelectClient(c)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 18px', cursor: 'pointer',
                                  background: isHighlighted ? 'var(--primary-dim)' : 'transparent',
                                  borderLeft: `2px solid ${isHighlighted ? 'var(--primary)' : 'transparent'}`,
                                  transition: 'background 0.08s',
                                }}
                              >
                                {/* Initial avatar */}
                                <div style={{
                                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                  background: color + '18', border: `1px solid ${color}35`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 12, fontWeight: 800, color,
                                }}>
                                  {c.name.charAt(0).toUpperCase()}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {c.name}
                                  </div>
                                  {c.segmento && (
                                    <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {c.segmento}{c.cidade_estado ? ` · ${c.cidade_estado}` : ''}
                                    </div>
                                  )}
                                </div>

                                {st && (
                                  <span style={{
                                    fontSize: 10, fontWeight: 700,
                                    color: st.color, background: st.bg,
                                    padding: '2px 8px', borderRadius: 100,
                                    flexShrink: 0, whiteSpace: 'nowrap',
                                  }}>
                                    {st.label}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </>
                      )}

                      {/* ── Especialistas ── */}
                      {filteredAgents.length > 0 && (
                        <>
                          {(filteredProjects.length > 0 || filteredClients.length > 0) && (
                            <div style={{ height: 1, background: 'var(--gray3)', margin: '4px 0' }} />
                          )}
                          <SectionLabel label="Especialistas" count={filteredAgents.length} />
                          {filteredAgents.map((agent, i) => {
                            const globalIdx     = agentOffset + i
                            const isHighlighted = globalIdx === selectedIdx
                            return (
                              <div
                                key={agent.type}
                                onMouseEnter={() => setSelectedIdx(globalIdx)}
                                onClick={() => handleSelectAgent(agent)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: 12,
                                  padding: '10px 18px', cursor: 'pointer',
                                  background: isHighlighted ? 'var(--primary-dim)' : 'transparent',
                                  borderLeft: `2px solid ${isHighlighted ? 'var(--primary)' : 'transparent'}`,
                                  transition: 'background 0.08s',
                                }}
                              >
                                {/* Emoji avatar */}
                                <div style={{
                                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                                  background: agent.color + '18',
                                  border: `1px solid ${agent.color}35`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: 14, lineHeight: 1,
                                }}>
                                  {agent.emoji}
                                </div>

                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)' }}>
                                    {agent.name}
                                  </div>
                                  <div style={{ fontSize: 11, color: 'var(--gray2)', marginTop: 1 }}>
                                    {agent.role}
                                  </div>
                                </div>

                                {/* "Abrir chat" hint */}
                                <span style={{
                                  fontSize: 10, fontWeight: 700,
                                  color: agent.color,
                                  background: agent.color + '15',
                                  border: `1px solid ${agent.color}30`,
                                  padding: '2px 8px', borderRadius: 100,
                                  flexShrink: 0, whiteSpace: 'nowrap',
                                }}>
                                  Abrir chat
                                </span>
                              </div>
                            )
                          })}
                        </>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Footer hint */}
              {showResults && hasAny && (
                <div style={{
                  padding: '8px 18px',
                  borderTop: '1px solid var(--gray3)',
                  display: 'flex', gap: 16, alignItems: 'center',
                  fontSize: 10, color: 'var(--gray2)', fontWeight: 600,
                }}>
                  <span>↑↓ navegar</span>
                  <span>· Enter selecionar</span>
                  <span>· Esc fechar</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* ── Project detail drawer ───────────────────────────────────────── */}
      {detailProject && (
        <ProjectDetailDrawer
          project={detailProject}
          onClose={() => setDetailProject(null)}
        />
      )}

      {/* ── Client detail drawer ────────────────────────────────────────── */}
      {detailClient && (
        <ClientDetailDrawer
          client={detailClient}
          onClose={() => setDetailClient(null)}
        />
      )}
    </>,
    document.body
  )
}
