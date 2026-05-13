import type { Cliente } from './proposta'

export interface Servico {
  id: string
  icone: string
  titulo: string
  descricao: string
}

export interface ApresentacaoData {
  nomeEmpresa: string
  tagline: string
  website: string
  descricao: string
  missao: string
  visao: string
  anoFundacao: string
  numProjetos: string
  numClientes: string
  numProfissionais: string
  servicos: Servico[]
  clientes: Cliente[]
  nomeContato: string
  emailContato: string
  telefoneContato: string
}

export const defaultApresentacao: ApresentacaoData = {
  nomeEmpresa: 'Sheep Tech',
  tagline: 'Fazemos a tecnologia virar vantagem competitiva',
  website: 'sheeptechnology.com.br',
  descricao: 'Somos uma empresa de tecnologia focada em transformar desafios empresariais em soluções digitais de alto impacto.',
  missao: 'Fazer a tecnologia parar de ser discurso e virar vantagem competitiva real para nossos clientes.',
  visao: 'Ser referência em inovação aplicada no Brasil, reconhecidos pela excelência técnica e pelos resultados entregues.',
  anoFundacao: '2020',
  numProjetos: '80+',
  numClientes: '30+',
  numProfissionais: '20+',
  servicos: [
    { id: crypto.randomUUID(), icone: '👥', titulo: 'Teams as a Service', descricao: 'Equipe sob demanda para seus projetos digitais.' },
    { id: crypto.randomUUID(), icone: '☁️', titulo: 'SaaS & Cloud', descricao: 'Sistemas web modernos e infraestrutura em nuvem.' },
    { id: crypto.randomUUID(), icone: '📊', titulo: 'Business Intelligence', descricao: 'Dashboards e insights com Power BI e Looker Studio.' },
    { id: crypto.randomUUID(), icone: '🤖', titulo: 'Inteligência Artificial', descricao: 'Automações com OpenAI, Gemini e LangChain.' },
    { id: crypto.randomUUID(), icone: '⚡', titulo: 'Power Platform', descricao: 'Power Automate, Power Apps e integrações Microsoft.' },
    { id: crypto.randomUUID(), icone: '🌐', titulo: 'Websites', descricao: 'Sites institucionais com painel admin.' },
  ],
  clientes: [
    { id: crypto.randomUUID(), nome: 'Vale', logo: '' },
    { id: crypto.randomUUID(), nome: 'Shell', logo: '' },
    { id: crypto.randomUUID(), nome: 'Cheirin Bão', logo: '' },
    { id: crypto.randomUUID(), nome: 'J17 Bank', logo: '' },
    { id: crypto.randomUUID(), nome: 'ProntoMed', logo: '' },
    { id: crypto.randomUUID(), nome: 'Bitka Analytics', logo: '' },
  ],
  nomeContato: 'Thales Carneiro',
  emailContato: 'contato@sheeptechnology.com.br',
  telefoneContato: '',
}
