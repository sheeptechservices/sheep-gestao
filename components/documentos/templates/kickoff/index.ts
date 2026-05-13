import { Step1_Dados } from './steps/Step1_Dados'
import { Step2_Contexto } from './steps/Step2_Contexto'
import { Step3_Escopo } from './steps/Step3_Escopo'
import { Step4_Equipe } from './steps/Step4_Equipe'
import { Step5_CronogramaPassos } from './steps/Step5_CronogramaPassos'
import { generateKickoffHtml } from '@/components/documentos/generators/kickoff'
import { defaultKickoff } from '@/components/documentos/types/kickoff'
import type { TemplateConfig } from '@/components/documentos/templates/types'

export const kickoffTemplate: TemplateConfig = {
  id: 'kickoff',
  name: 'Reunião de Kickoff',
  badge: 'Kickoffs',
  description: 'Alinhamento inicial de projeto com escopo, equipe e cronograma.',
  icon: '🚀',
  slideLabels: ['Capa', 'Contexto', 'Escopo', 'Equipe', 'Cronograma', 'Próximos Passos'],
  steps: [Step1_Dados, Step2_Contexto, Step3_Escopo, Step4_Equipe, Step5_CronogramaPassos],
  generateHtml: generateKickoffHtml,
  downloadFileName: (d: any) => `Kickoff_${(d.nomeProjeto || 'Projeto').replace(/\s+/g, '_')}.html`,
  exportTitle: 'Seu Kickoff',
  exportSubtitle: 'Revise os 6 slides e faça o download do HTML para apresentar.',
  defaultData: defaultKickoff as unknown as Record<string, unknown>,
}
