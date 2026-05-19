import { Step01_Partes }  from './steps/Step01_Partes'
import { Step02_Objeto }  from './steps/Step02_Objeto'
import { Step03_Valores } from './steps/Step03_Valores'
import { Step04_Prazos }  from './steps/Step04_Prazos'
import { generateContratoHtml } from '@/components/documentos/generators/contrato'
import { defaultContrato }      from '@/components/documentos/types/contrato'
import type { TemplateConfig }  from '@/components/documentos/templates/types'

export const contratoTemplate: TemplateConfig = {
  id: 'contrato',
  name: 'Contrato de Serviços',
  badge: 'Contratos',
  description: 'Contrato de prestação de serviços com partes, escopo, valores, prazos e assinaturas.',
  icon: '📝',
  slideLabels: ['Partes', 'Objeto', 'Valores', 'Prazos', 'Assinaturas'],
  steps: [Step01_Partes, Step02_Objeto, Step03_Valores, Step04_Prazos],
  generateHtml: generateContratoHtml,
  downloadFileName: (d: any) => `Contrato_${(d.nomeCliente || 'Cliente').replace(/\s+/g, '_')}_Sheep.html`,
  exportTitle: 'Seu Contrato',
  exportSubtitle: 'Revise os 5 slides e faça o download do HTML para assinar digitalmente ou imprimir.',
  defaultData: defaultContrato as unknown as Record<string, unknown>,
}
