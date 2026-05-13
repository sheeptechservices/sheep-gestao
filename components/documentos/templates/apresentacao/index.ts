import { Step1_Dados } from './steps/Step1_Dados'
import { Step2_MissaoVisao } from './steps/Step2_MissaoVisao'
import { Step3_Numeros } from './steps/Step3_Numeros'
import { Step4_Servicos } from './steps/Step4_Servicos'
import { Step5_ClientesContato } from './steps/Step5_ClientesContato'
import { generateApresentacaoHtml } from '@/components/documentos/generators/apresentacao'
import { defaultApresentacao } from '@/components/documentos/types/apresentacao'
import type { TemplateConfig } from '@/components/documentos/templates/types'

export const apresentacaoTemplate: TemplateConfig = {
  id: 'apresentacao',
  name: 'Apresentação da Empresa',
  badge: 'Apresentações',
  description: 'Pitch institucional com missão, serviços e portfólio de clientes.',
  icon: '🏢',
  slideLabels: ['Capa', 'Missão & Visão', 'Números', 'Serviços', 'Clientes', 'Contato'],
  steps: [Step1_Dados, Step2_MissaoVisao, Step3_Numeros, Step4_Servicos, Step5_ClientesContato],
  generateHtml: generateApresentacaoHtml,
  downloadFileName: (d: any) => `Apresentacao_Sheep_Tech.html`,
  exportTitle: 'Sua Apresentação',
  exportSubtitle: 'Revise os 6 slides e faça o download do HTML para apresentar.',
  defaultData: defaultApresentacao as unknown as Record<string, unknown>,
}
