'use client'
import { create } from 'zustand'
import type { AgentType } from '@/lib/types'

export interface ChatImageAttachment {
  data: string                                                       // base64, without data-URL prefix
  mediaType: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp'
  name: string
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  attachedFiles?: string[]            // filenames shown in UI (content already embedded in `content`)
  images?: ChatImageAttachment[]      // pasted / attached images sent to vision API
  generatedImages?: string[]          // URLs de imagens geradas por DALL-E
}

export interface ChatInstance {
  messages: ChatMessage[]
  streaming: boolean
  selectedProjectId: string | null
  selectedTaskId: string | null
  selectedLeadId: string | null
  pendingInput?: string | null   // pre-filled context from task/project shortcut
}

const EMPTY_INSTANCE: ChatInstance = {
  messages: [],
  streaming: false,
  selectedProjectId: null,
  selectedTaskId: null,
  selectedLeadId: null,
}

interface ChatState {
  openChats: AgentType[]
  instances: Record<string, ChatInstance>

  openChat: (agentType: AgentType) => void
  closeChat: (agentType: AgentType) => void
  closeAll: () => void
  clearMessages: (agentType: AgentType) => void

  addMessage: (agentType: AgentType, msg: ChatMessage) => void
  appendToLast: (agentType: AgentType, chunk: string) => void
  updateMessage: (agentType: AgentType, id: string, content: string) => void
  setStreaming: (agentType: AgentType, v: boolean) => void
  setProject: (agentType: AgentType, id: string | null) => void
  setTask: (agentType: AgentType, id: string | null) => void
  setLead: (agentType: AgentType, id: string | null) => void
  setPendingInput: (agentType: AgentType, text: string) => void
}

function patch(
  instances: Record<string, ChatInstance>,
  type: AgentType,
  fn: (inst: ChatInstance) => ChatInstance,
): Record<string, ChatInstance> {
  return { ...instances, [type]: fn(instances[type] ?? EMPTY_INSTANCE) }
}

export const useChatStore = create<ChatState>((set) => ({
  openChats: [],
  instances: {},

  openChat: (agentType) =>
    set((s) => {
      if (s.openChats.includes(agentType)) {
        // Already open — bring to front (move to end = rightmost)
        return { openChats: [...s.openChats.filter(t => t !== agentType), agentType] }
      }
      return {
        openChats: [...s.openChats, agentType],
        instances: { ...s.instances, [agentType]: s.instances[agentType] ?? EMPTY_INSTANCE },
      }
    }),

  closeChat: (agentType) =>
    set((s) => ({ openChats: s.openChats.filter(t => t !== agentType) })),

  closeAll: () => set({ openChats: [] }),

  clearMessages: (agentType) =>
    set((s) => ({ instances: patch(s.instances, agentType, i => ({ ...i, messages: [] })) })),

  addMessage: (agentType, msg) =>
    set((s) => ({
      instances: patch(s.instances, agentType, i => ({ ...i, messages: [...i.messages, msg] })),
    })),

  appendToLast: (agentType, chunk) =>
    set((s) => ({
      instances: patch(s.instances, agentType, i => {
        if (i.messages.length === 0) return i
        const msgs = [...i.messages]
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content: msgs[msgs.length - 1].content + chunk }
        return { ...i, messages: msgs }
      }),
    })),

  updateMessage: (agentType, id, content) =>
    set((s) => ({
      instances: patch(s.instances, agentType, i => ({
        ...i,
        messages: i.messages.map(m => m.id === id ? { ...m, content } : m),
      })),
    })),

  setStreaming: (agentType, v) =>
    set((s) => ({ instances: patch(s.instances, agentType, i => ({ ...i, streaming: v })) })),

  setProject: (agentType, id) =>
    set((s) => ({ instances: patch(s.instances, agentType, i => ({ ...i, selectedProjectId: id, selectedTaskId: null, selectedLeadId: null })) })),

  setTask: (agentType, id) =>
    set((s) => ({ instances: patch(s.instances, agentType, i => ({ ...i, selectedTaskId: id })) })),

  setLead: (agentType, id) =>
    set((s) => ({ instances: patch(s.instances, agentType, i => ({ ...i, selectedLeadId: id, selectedProjectId: null, selectedTaskId: null })) })),

  setPendingInput: (agentType, text) =>
    set((s) => ({ instances: patch(s.instances, agentType, i => ({ ...i, pendingInput: text })) })),
}))
