import { create } from 'zustand'
import type { Task } from '@/lib/types'
import { toast } from '@/stores/toastStore'

interface TasksState {
  tasks: Task[]
  loading: boolean
  fetchTasks:           (projectId?: string) => Promise<void>
  addTask:              (task: Task) => Promise<void>
  updateTask:           (id: string, data: Partial<Task>) => Promise<void>
  deleteTask:           (id: string) => Promise<void>
  toggleDone:           (id: string, done: boolean) => Promise<void>
  bumpAttachmentCount:  (taskId: string, delta: 1 | -1) => void
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (projectId?: string) => {
    set({ loading: true })
    try {
      const qs = projectId ? `?project_id=${projectId}` : ''
      const res = await fetch(`/api/tasks${qs}`)
      const tasks: Task[] = await res.json()
      set({ tasks, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  addTask: async (task: Task) => {
    set(s => ({ tasks: [...s.tasks, task] }))
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task),
      })
      if (!res.ok) set(s => ({ tasks: s.tasks.filter(t => t.id !== task.id) }))
    } catch {
      set(s => ({ tasks: s.tasks.filter(t => t.id !== task.id) }))
    }
  },

  updateTask: async (id: string, data: Partial<Task>) => {
    const prev = get().tasks
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, ...data } : t) }))
    try {
      // Replace undefined with null so JSON.stringify doesn't strip fields
      // that were intentionally cleared (e.g. description → "")
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data, (_, v) => v === undefined ? null : v),
      })
      if (!res.ok) set({ tasks: prev })
    } catch {
      set({ tasks: prev })
    }
  },

  deleteTask: async (id: string) => {
    const prev = get().tasks
    set(s => ({ tasks: s.tasks.filter(t => t.id !== id) }))
    try {
      const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' })
      if (!res.ok) set({ tasks: prev })
    } catch {
      set({ tasks: prev })
    }
  },

  bumpAttachmentCount: (taskId: string, delta: 1 | -1) => {
    set(s => ({
      tasks: s.tasks.map(t =>
        t.id === taskId
          ? { ...t, attachment_count: Math.max(0, (t.attachment_count ?? 0) + delta) }
          : t
      ),
    }))
  },

  toggleDone: async (id: string, done: boolean) => {
    const prev = get().tasks
    if (done) {
      const task = prev.find(t => t.id === id)
      if (task) toast.success('Entregável concluído', task.title)
    }
    set(s => ({ tasks: s.tasks.map(t => t.id === id ? { ...t, done } : t) }))
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ done }),
      })
      if (!res.ok) set({ tasks: prev })
    } catch {
      set({ tasks: prev })
    }
  },
}))
