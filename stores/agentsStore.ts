'use client'
import { create } from 'zustand'
import { DEFAULT_AGENTS } from '@/lib/agents'
import type { AgentDefinition } from '@/lib/agents'

interface AgentsState {
  agents: AgentDefinition[]
  updateAgent: (updated: AgentDefinition) => void
}

export const useAgentsStore = create<AgentsState>((set) => ({
  agents: DEFAULT_AGENTS,
  updateAgent: (updated) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.type === updated.type ? updated : a)),
    })),
}))
