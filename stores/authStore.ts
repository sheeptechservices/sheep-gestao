import { create } from 'zustand'
import type { AppUser } from '@/lib/types'

interface AuthState {
  user: AppUser | null
  loading: boolean
  setUser: (user: AppUser | null) => void
  fetchMe: () => Promise<void>
}

export const useAuth = create<AuthState>((set) => ({
  user:    null,
  loading: true,

  setUser: (user) => set({ user }),

  fetchMe: async () => {
    set({ loading: true })
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const user = await res.json() as AppUser
        set({ user, loading: false })
      } else {
        set({ user: null, loading: false })
      }
    } catch {
      set({ user: null, loading: false })
    }
  },
}))
