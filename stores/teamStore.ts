import { create } from 'zustand'
import type { TeamMember } from '@/lib/types'
import { toast } from '@/stores/toastStore'

interface TeamState {
  members:       TeamMember[]
  loading:       boolean
  fetchMembers:  () => Promise<void>
  addMember:     (data: Omit<TeamMember, 'id' | 'created_at'>) => Promise<TeamMember | null>
  updateMember:  (id: string, data: Partial<TeamMember>) => Promise<void>
  deleteMember:  (id: string) => Promise<void>
  uploadPhoto:   (id: string, file: File) => Promise<void>
  deletePhoto:   (id: string) => Promise<void>
}

export const useTeamStore = create<TeamState>((set, get) => ({
  members: [],
  loading: false,

  fetchMembers: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/team')
      const members: TeamMember[] = await res.json()
      set({ members, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addMember: async (data) => {
    try {
      const res = await fetch('/api/team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) { toast.error('Erro', 'Não foi possível criar o membro'); return null }
      const member: TeamMember = await res.json()
      set(s => ({ members: [...s.members, member].sort((a, b) => a.name.localeCompare(b.name)) }))
      toast.success('Membro adicionado', member.name)
      return member
    } catch {
      toast.error('Erro', 'Não foi possível criar o membro')
      return null
    }
  },

  updateMember: async (id, data) => {
    const prev = get().members
    set(s => ({ members: s.members.map(m => m.id === id ? { ...m, ...data } : m) }))
    try {
      const res = await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        set({ members: prev })
        toast.error('Erro ao salvar', 'Não foi possível salvar as alterações')
      } else {
        const name = get().members.find(m => m.id === id)?.name ?? ''
        toast.success('Membro atualizado', name)
      }
    } catch {
      set({ members: prev })
      toast.error('Erro ao salvar', 'Não foi possível salvar as alterações')
    }
  },

  deleteMember: async (id) => {
    const prev = get().members
    const name = prev.find(m => m.id === id)?.name ?? ''
    set(s => ({ members: s.members.filter(m => m.id !== id) }))
    try {
      const res = await fetch(`/api/team/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        set({ members: prev })
        toast.error('Erro ao remover', 'Não foi possível remover o membro')
      } else {
        toast.success('Membro removido', name)
      }
    } catch {
      set({ members: prev })
      toast.error('Erro ao remover', 'Não foi possível remover o membro')
    }
  },

  uploadPhoto: async (id, file) => {
    const form = new FormData()
    form.append('file', file)
    try {
      const res = await fetch(`/api/team/${id}/photo`, { method: 'POST', body: form })
      if (!res.ok) { toast.error('Erro', 'Foto não pôde ser salva'); return }
      const { photo_url } = await res.json()
      set(s => ({ members: s.members.map(m => m.id === id ? { ...m, photo_url } : m) }))
      toast.success('Foto atualizada', '')
    } catch {
      toast.error('Erro', 'Foto não pôde ser salva')
    }
  },

  deletePhoto: async (id) => {
    try {
      await fetch(`/api/team/${id}/photo`, { method: 'DELETE' })
      set(s => ({ members: s.members.map(m => m.id === id ? { ...m, photo_url: undefined } : m) }))
      toast.success('Foto removida', '')
    } catch {
      toast.error('Erro', 'Não foi possível remover a foto')
    }
  },
}))
