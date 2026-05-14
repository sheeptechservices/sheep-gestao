import { create } from 'zustand'

export type CreateKind = 'project' | 'client' | 'task'

interface CreateState {
  pendingCreate: CreateKind | null
  requestCreate: (kind: CreateKind) => void
  consumeCreate: () => void
}

export const useCreateStore = create<CreateState>((set) => ({
  pendingCreate: null,
  requestCreate: (kind) => set({ pendingCreate: kind }),
  consumeCreate: () => set({ pendingCreate: null }),
}))
