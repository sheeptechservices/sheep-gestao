'use client'
import { create } from 'zustand'
import { DEFAULT_AGENTS } from '@/lib/agents'
import type { AgentDefinition } from '@/lib/agents'

interface AgentsState {
  agents:       AgentDefinition[]
  loading:      boolean
  /** Carrega especialistas do banco (com fallback para os defaults do código) */
  fetchAgents:  () => Promise<void>
  /** Persiste a atualização no banco E atualiza o estado local */
  updateAgent:  (updated: AgentDefinition) => Promise<void>
}

export const useAgentsStore = create<AgentsState>((set, get) => ({
  agents:  DEFAULT_AGENTS,   // valor inicial imediato — substituído após fetch
  loading: false,

  fetchAgents: async () => {
    set({ loading: true })
    try {
      const res    = await fetch('/api/agents')
      const agents = await res.json() as AgentDefinition[]
      if (Array.isArray(agents)) set({ agents })
    } catch {
      // Em caso de erro de rede, continua com os defaults do código
    } finally {
      set({ loading: false })
    }
  },

  updateAgent: async (updated: AgentDefinition) => {
    // Atualiza o estado local imediatamente (optimistic update)
    set(s => ({ agents: s.agents.map(a => a.type === updated.type ? updated : a) }))
    try {
      await fetch('/api/agents', {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(updated),
      })
    } catch {
      // Em caso de falha, reverte para o estado anterior
      const prev = get().agents
      set({ agents: prev })
    }
  },
}))
