import { create } from 'zustand'

interface DocsState {
  activeTemplateId: string | null
  totalSteps: number
  templateData: Record<string, Record<string, unknown>>
  templateDefaults: Record<string, Record<string, unknown>>
  currentStep: number
  slideStatuses: boolean[]
  hiddenSlides: boolean[]
}

interface DocsActions {
  setActiveTemplate: (id: string, defaultData: Record<string, unknown>, totalSteps: number) => void
  backToSelector: () => void
  getActiveData: () => Record<string, unknown>
  setActiveData: (data: Partial<Record<string, unknown>>) => void
  resetActiveData: () => void
  setStep: (n: number) => void
  nextStep: () => void
  prevStep: () => void
  toggleSlideStatus: (i: number) => void
  toggleHiddenSlide: (i: number) => void
}

type DocsStore = DocsState & DocsActions

export const useDocsStore = create<DocsStore>((set, get) => ({
  activeTemplateId: null,
  totalSteps: 0,
  templateData: {},
  templateDefaults: {},
  currentStep: 0,
  slideStatuses: [],
  hiddenSlides: [],

  setActiveTemplate: (id, defaultData, totalSteps) => {
    set((state) => ({
      activeTemplateId: id,
      totalSteps,
      currentStep: 0,
      slideStatuses: Array(totalSteps).fill(false),
      hiddenSlides: Array(totalSteps).fill(false),
      templateDefaults: { ...state.templateDefaults, [id]: { ...defaultData } },
      templateData: state.templateData[id]
        ? state.templateData
        : { ...state.templateData, [id]: { ...defaultData } },
    }))
  },

  backToSelector: () => {
    set({ activeTemplateId: null, currentStep: 0, hiddenSlides: [] })
  },

  getActiveData: () => {
    const { activeTemplateId, templateData } = get()
    if (!activeTemplateId) return {}
    return templateData[activeTemplateId] ?? {}
  },

  setActiveData: (data) => {
    const { activeTemplateId, templateData } = get()
    if (!activeTemplateId) return
    set({
      templateData: {
        ...templateData,
        [activeTemplateId]: { ...templateData[activeTemplateId], ...data },
      },
    })
  },

  resetActiveData: () => {
    const { activeTemplateId, templateDefaults, totalSteps } = get()
    if (!activeTemplateId) return
    set((state) => ({
      templateData: {
        ...state.templateData,
        [activeTemplateId]: { ...templateDefaults[activeTemplateId] },
      },
      currentStep: 0,
      slideStatuses: Array(totalSteps).fill(false),
      hiddenSlides: Array(totalSteps).fill(false),
    }))
  },

  setStep: (n) => set({ currentStep: n }),

  nextStep: () => {
    const { currentStep, totalSteps } = get()
    set({ currentStep: Math.min(currentStep + 1, totalSteps) })
  },

  prevStep: () => {
    const { currentStep } = get()
    set({ currentStep: Math.max(currentStep - 1, 0) })
  },

  toggleSlideStatus: (i) => {
    set((state) => {
      const s = [...state.slideStatuses]
      s[i] = !s[i]
      return { slideStatuses: s }
    })
  },

  toggleHiddenSlide: (i) => {
    set((state) => {
      const h = [...state.hiddenSlides]
      h[i] = !h[i]
      return { hiddenSlides: h }
    })
  },
}))
