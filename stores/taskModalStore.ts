import { create } from 'zustand'

interface TaskModalState {
  pendingOpenId: string | null
  /** Solicita abertura do modal de edição de um entregável pelo id */
  requestOpen: (id: string) => void
  /** Consome o id pendente (chame após abrir o modal) */
  consumeOpen: () => void
}

export const useTaskModalStore = create<TaskModalState>((set) => ({
  pendingOpenId: null,
  requestOpen: (id) => set({ pendingOpenId: id }),
  consumeOpen: () => set({ pendingOpenId: null }),
}))
