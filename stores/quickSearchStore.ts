'use client'
import { create } from 'zustand'

interface QuickSearchState {
  isOpen: boolean
  open:   () => void
  close:  () => void
  toggle: () => void
}

export const useQuickSearch = create<QuickSearchState>((set) => ({
  isOpen: false,
  open:   () => set({ isOpen: true }),
  close:  () => set({ isOpen: false }),
  toggle: () => set(s => ({ isOpen: !s.isOpen })),
}))
