import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number   // ms, default 4000; 0 = never auto-dismiss
}

interface ToastState {
  toasts: ToastItem[]
  push:    (toast: Omit<ToastItem, 'id'>) => string
  dismiss: (id: string) => void
  clear:   () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],

  push: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    set(s => ({ toasts: [...s.toasts, { duration: 4000, ...toast, id }] }))
    return id
  },

  dismiss: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

  clear: () => set({ toasts: [] }),
}))

// Convenience helpers — call anywhere, no hook needed
export const toast = {
  success: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'success', title, message }),
  error: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'error', title, message, duration: 0 }),
  info: (title: string, message?: string) =>
    useToastStore.getState().push({ type: 'info', title, message }),
}
