import { Step01_Dados } from './steps/Step01_Dados'
import { Step02_SobreNos } from './steps/Step02_SobreNos'
import { Step03_Tecnologias } from './steps/Step03_Tecnologias'
import { Step04_Clientes } from './steps/Step04_Clientes'
import { Step05_Solucoes } from './steps/Step05_Solucoes'
import { Step06_Desafio } from './steps/Step06_Desafio'
import { Step07_Solucao } from './steps/Step07_Solucao'
import { Step09_Cronograma } from './steps/Step09_Cronograma'
import { Step10_Investimento } from './steps/Step10_Investimento'
import { Step11_Infra } from './steps/Step11_Infra'
import { Step12_CenariosInfra } from './steps/Step12_CenariosInfra'
import { Step13_ProximosPassos } from './steps/Step13_ProximosPassos'
import { generatePropostaHtml } from '@/components/documentos/generators/proposta'
import { defaultProposta } from '@/components/documentos/types/proposta'
import type { TemplateConfig } from '@/components/documentos/templates/types'

export const propostaTemplate: TemplateConfig = {
  id: 'proposta',
  name: 'Proposta Comercial',
  badge: 'Propostas',
  description: 'Apresentações de venda com escopo, cronograma e investimento.',
  icon: '📄',
  slideLabels: ['Capa','Sobre Nós','Tecnologias','Clientes','Soluções','O Desafio','A Solução','Cronograma','Investimento','Infra','Cenários','Próximos Passos'],
  steps: [Step01_Dados, Step02_SobreNos, Step03_Tecnologias, Step04_Clientes, Step05_Solucoes, Step06_Desafio, Step07_Solucao, Step09_Cronograma, Step10_Investimento, Step11_Infra, Step12_CenariosInfra, Step13_ProximosPassos],
  generateHtml: generatePropostaHtml,
  downloadFileName: (d: any) => `Proposta_${(d.nomeCliente || 'Sheep').replace(/\s+/g, '_')}.html`,
  exportTitle: 'Sua Proposta',
  exportSubtitle: 'Revise os 12 slides e faça o download do HTML para apresentar.',
  defaultData: defaultProposta as unknown as Record<string, unknown>,
}
