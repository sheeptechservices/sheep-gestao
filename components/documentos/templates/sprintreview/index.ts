import { Step1_Dados } from './steps/Step1_Dados'
import { Step2_GoalEntregas } from './steps/Step2_GoalEntregas'
import { Step3_MetricasImpedimentos } from './steps/Step3_MetricasImpedimentos'
import { Step4_ProximoSprint } from './steps/Step4_ProximoSprint'
import { generateSprintReviewHtml } from '@/components/documentos/generators/sprintreview'
import { defaultSprintReview } from '@/components/documentos/types/sprintreview'
import type { TemplateConfig } from '@/components/documentos/templates/types'

export const sprintReviewTemplate: TemplateConfig = {
  id: 'sprintreview',
  name: 'Sprint Review',
  badge: 'Sprint Reviews',
  description: 'Retrospectiva de sprint com métricas, entregas e próximos passos.',
  icon: '⚡',
  slideLabels: ['Capa', 'Sprint Goal', 'Entregas', 'Métricas', 'Próximo Sprint'],
  steps: [Step1_Dados, Step2_GoalEntregas, Step3_MetricasImpedimentos, Step4_ProximoSprint],
  generateHtml: generateSprintReviewHtml,
  downloadFileName: (d: any) => `SprintReview_${(d.nomeProjeto || 'Projeto').replace(/\s+/g, '_')}_S${d.sprintNumero || '1'}.html`,
  exportTitle: 'Seu Sprint Review',
  exportSubtitle: 'Revise os 5 slides e faça o download do HTML para apresentar.',
  defaultData: defaultSprintReview as unknown as Record<string, unknown>,
}
