import { create } from 'zustand'
import type { Notification } from '@/lib/types'

interface NotificationsState {
  notifications: Notification[]
  unreadCount:   number
  loading:       boolean
  fetch:         () => Promise<void>
  markRead:      (id: string) => Promise<void>
  markAllRead:   () => Promise<void>
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  notifications: [],
  unreadCount:   0,
  loading:       false,

  fetch: async () => {
    set({ loading: true })
    try {
      const res  = await fetch('/api/notifications')
      const data = (await res.json()) as Notification[]
      set({
        notifications: data,
        unreadCount:   data.filter(n => !n.read).length,
        loading:       false,
      })
    } catch {
      set({ loading: false })
    }
  },

  markRead: async (id) => {
    await fetch(`/api/notifications/${id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ read: true }),
    })
    set(s => ({
      notifications: s.notifications.map(n => n.id === id ? { ...n, read: true } : n),
      unreadCount:   Math.max(0, s.unreadCount - 1),
    }))
  },

  markAllRead: async () => {
    await fetch('/api/notifications', {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ read_all: true }),
    })
    set(s => ({
      notifications: s.notifications.map(n => ({ ...n, read: true })),
      unreadCount:   0,
    }))
  },
}))
