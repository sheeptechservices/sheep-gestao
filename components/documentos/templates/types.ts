import type React from 'react'

export interface TemplateConfig {
  id: string
  name: string
  badge: string
  description: string
  icon: string
  slideLabels: string[]
  steps: React.ComponentType[]
  generateHtml: (data: any, hiddenSlides?: number[]) => string
  downloadFileName: (data: any) => string
  exportTitle: string
  exportSubtitle: string
  defaultData: Record<string, unknown>
}
