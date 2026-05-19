export interface Diferencial {
  id: string
  label: string
  descricao: string
}

export interface PontoDeDor {
  id: string
  texto: string
}

export interface Entrega {
  id: string
  descricao: string
}

export interface SubFase {
  id: string
  nome: string
}

export interface Fase {
  id: string
  nome: string
  mes: number
  semanas: number
  subfases?: SubFase[]
}

export interface ItemInvestimento {
  id: string
  descricao: string
  valor: number
}

export interface ItemInfra {
  id: string
  descricao: string
  valorMensal: number
}

export interface CenarioInfra {
  id: string
  nome: string
  usuarios: string
  infraMensal: number
  manutencaoMensal: number
}

export interface ProximoPasso {
  id: string
  texto: string
}

export interface ValorEmpresa {
  id: string
  titulo: string
  descricao: string
}

export interface SolucaoSheep {
  id: string
  icone: string
  titulo: string
  descricao: string
}

export interface Tecnologia {
  id: string
  nome: string
  categoria: string
}

export interface Cliente {
  id: string
  nome: string
  logo: string
}

export interface PropostaData {
  nomeCliente: string
  tituloproposta: string
  dataProposta: string
  nomeVendedor: string
  website: string
  nomeEmpresa: string
  tagline: string
  sobreNosTitulo: string
  sobreNosTituloAcc: string
  sobreNosDesc1: string
  sobreNosDesc2: string
  valoresEmpresa: ValorEmpresa[]
  descricaoEmpresa: string
  anoFundacao: string
  numProjetos: string
  descricaoDesafio: string
  pontosDeDor: PontoDeDor[]
  descricaoSolucao: string
  diferenciais: Diferencial[]
  tecnologias: Tecnologia[]
  clientes: Cliente[]
  solucoesSheep: SolucaoSheep[]
  entregas: Entrega[]
  fases: Fase[]
  itensInvestimento: ItemInvestimento[]
  formaPagamento: string
  itensInfra: ItemInfra[]
  notasInfra: string
  cenariosInfra: CenarioInfra[]
  proximosPassos: ProximoPasso[]
  nomeContato: string
  emailContato: string
  telefoneContato: string
  validadeProposta: string
}

export const defaultProposta: PropostaData = {
  nomeCliente: '',
  tituloproposta: '',
  dataProposta: new Date().toISOString().split('T')[0],
  nomeVendedor: 'Thales Carneiro',
  website: 'sheeptechnology.com.br',
  nomeEmpresa: 'Sheep Tech',
  tagline: '',
  sobreNosTitulo: 'Fazemos a tecnologia virar',
  sobreNosTituloAcc: 'vantagem competitiva',
  sobreNosDesc1: 'Nossa missão é fazer a tecnologia parar de ser discurso e virar vantagem competitiva. Atuamos lado a lado com nossos clientes, entregando soluções de alto padrão técnico com foco em resultados reais para o negócio.',
  sobreNosDesc2: '',
  valoresEmpresa: [
    { id: crypto.randomUUID(), titulo: 'Excelência', descricao: 'Alto padrão técnico, atenção aos detalhes e foco total em resultados reais.' },
    { id: crypto.randomUUID(), titulo: 'Inovação', descricao: 'IA e tecnologia aplicadas de forma prática e estratégica para escalar operações.' },
    { id: crypto.randomUUID(), titulo: 'Parcerias', descricao: 'Parcerias sólidas, atuando lado a lado com clientes de forma contínua.' },
  ],
  descricaoEmpresa: '',
  anoFundacao: '',
  numProjetos: '',
  descricaoDesafio: '',
  pontosDeDor: [{ id: crypto.randomUUID(), texto: '' }],
  descricaoSolucao: '',
  diferenciais: [{ id: crypto.randomUUID(), label: '', descricao: '' }],
  tecnologias: [
    { id: crypto.randomUUID(), nome: 'PHP', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Dataverse', categoria: 'Plataforma' },
    { id: crypto.randomUUID(), nome: 'Power Automate', categoria: 'Automação' },
    { id: crypto.randomUUID(), nome: 'Power BI', categoria: 'Analytics' },
    { id: crypto.randomUUID(), nome: 'Looker Studio', categoria: 'Analytics' },
    { id: crypto.randomUUID(), nome: 'JavaScript', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Google Cloud', categoria: 'Cloud' },
    { id: crypto.randomUUID(), nome: 'Oracle', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'SharePoint', categoria: 'Plataforma' },
    { id: crypto.randomUUID(), nome: 'Power Apps', categoria: 'Plataforma' },
    { id: crypto.randomUUID(), nome: 'Laravel', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Java', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Supabase', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Node.js', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Excel', categoria: 'Produtividade' },
    { id: crypto.randomUUID(), nome: 'n8n', categoria: 'Automação' },
    { id: crypto.randomUUID(), nome: 'React', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Open AI', categoria: 'IA' },
    { id: crypto.randomUUID(), nome: 'Python', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'MySQL', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'AWS', categoria: 'Cloud' },
    { id: crypto.randomUUID(), nome: 'Git', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'Azure', categoria: 'Cloud' },
    { id: crypto.randomUUID(), nome: 'SQL', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'Flutter', categoria: 'Mobile' },
    { id: crypto.randomUUID(), nome: 'Gemini', categoria: 'IA' },
    { id: crypto.randomUUID(), nome: 'TypeScript', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Vue.js', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Next.js', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Angular', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Tailwind CSS', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Docker', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'Kubernetes', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'GitHub', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'PostgreSQL', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'MongoDB', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'Redis', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'Firebase', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'FastAPI', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Django', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: '.NET', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Go', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Vercel', categoria: 'Cloud' },
    { id: crypto.randomUUID(), nome: 'Figma', categoria: 'Design' },
    { id: crypto.randomUUID(), nome: 'LangChain', categoria: 'IA' },
    { id: crypto.randomUUID(), nome: 'Hugging Face', categoria: 'IA' },
    { id: crypto.randomUUID(), nome: 'Linux', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'GraphQL', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'REST API', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Kotlin', categoria: 'Mobile' },
    { id: crypto.randomUUID(), nome: 'Swift', categoria: 'Mobile' },
    { id: crypto.randomUUID(), nome: 'React Native', categoria: 'Mobile' },
    { id: crypto.randomUUID(), nome: 'Expo', categoria: 'Mobile' },
    { id: crypto.randomUUID(), nome: 'Svelte', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Astro', categoria: 'Frontend' },
    { id: crypto.randomUUID(), nome: 'Vite', categoria: 'Tooling' },
    { id: crypto.randomUUID(), nome: 'Webpack', categoria: 'Tooling' },
    { id: crypto.randomUUID(), nome: 'Nginx', categoria: 'Infra' },
    { id: crypto.randomUUID(), nome: 'Cloudflare', categoria: 'Infra' },
    { id: crypto.randomUUID(), nome: 'Terraform', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'Ansible', categoria: 'DevOps' },
    { id: crypto.randomUUID(), nome: 'DynamoDB', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'BigQuery', categoria: 'Analytics' },
    { id: crypto.randomUUID(), nome: 'Elasticsearch', categoria: 'Banco de Dados' },
    { id: crypto.randomUUID(), nome: 'Kafka', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'RabbitMQ', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'WebSocket', categoria: 'Backend' },
    { id: crypto.randomUUID(), nome: 'Stripe', categoria: 'Serviço' },
    { id: crypto.randomUUID(), nome: 'Twilio', categoria: 'Serviço' },
    { id: crypto.randomUUID(), nome: 'SendGrid', categoria: 'Serviço' },
    { id: crypto.randomUUID(), nome: 'Auth0', categoria: 'Serviço' },
    { id: crypto.randomUUID(), nome: 'Zapier', categoria: 'Automação' },
    { id: crypto.randomUUID(), nome: 'Make', categoria: 'Automação' },
    { id: crypto.randomUUID(), nome: 'PyTorch', categoria: 'IA' },
    { id: crypto.randomUUID(), nome: 'Pandas', categoria: 'IA' },
    { id: crypto.randomUUID(), nome: 'Notion', categoria: 'Produtividade' },
    { id: crypto.randomUUID(), nome: 'Jira', categoria: 'Produtividade' },
  ],
  clientes: [
    { id: crypto.randomUUID(), nome: 'Vale',             logo: '/logos/clientes/vale.png'         },
    { id: crypto.randomUUID(), nome: 'Shell',            logo: '/logos/clientes/shell.png'        },
    { id: crypto.randomUUID(), nome: 'bip.',             logo: '/logos/clientes/bi.png'           },
    { id: crypto.randomUUID(), nome: 'Cheirin Bão',      logo: '/logos/clientes/cheirin-bao.png'  },
    { id: crypto.randomUUID(), nome: 'click!',           logo: '/logos/clientes/click.png'        },
    { id: crypto.randomUUID(), nome: 'J17 Bank',         logo: '/logos/clientes/j17.png'          },
    { id: crypto.randomUUID(), nome: 'Bitka Analytics',  logo: '/logos/clientes/bitka.png'        },
    { id: crypto.randomUUID(), nome: 'ProntoMed',        logo: '/logos/clientes/prontomed.jpg'    },
    { id: crypto.randomUUID(), nome: '300 Franchising',  logo: '/logos/clientes/300-f.jpg'        },
    { id: crypto.randomUUID(), nome: 'Consigo Cred',     logo: '/logos/clientes/consigo-cred.png' },
  ],
  solucoesSheep: [
    { id: crypto.randomUUID(), icone: '👥', titulo: 'Teams as a Service (TaaS)', descricao: 'Equipe sob demanda para seus projetos digitais. Disponibilizamos profissionais especializados, gestão de projetos e entrega ágil.' },
    { id: crypto.randomUUID(), icone: '☁️', titulo: 'Software as a Service (SaaS)', descricao: 'Soluções escaláveis na nuvem. Criamos sistemas web modernos e infraestrutura em nuvem.' },
    { id: crypto.randomUUID(), icone: '📊', titulo: 'BI (Business Intelligence)', descricao: 'Dashboards e insights para seu negócio. Estruturamos Power BI integrado, análise de dados e relatórios automatizados.' },
    { id: crypto.randomUUID(), icone: '🤖', titulo: 'IA (Inteligência Artificial)', descricao: 'Automação e personalização inteligente. Construímos automações focadas em processos comerciais para aumentar as vendas do cliente.' },
    { id: crypto.randomUUID(), icone: '⚡', titulo: 'Power Platform', descricao: 'Automação de processos e aplicações low-code com Microsoft Power Platform. Desenvolvemos fluxos com Power Automate, aplicativos com Power Apps e dashboards com Power BI integrados ao ecossistema Microsoft.' },
    { id: crypto.randomUUID(), icone: '🌐', titulo: 'Websites', descricao: 'Desenvolvimento de sites institucionais com painel admin para personalização e administração geral do portal.' },
  ],
  entregas: [{ id: crypto.randomUUID(), descricao: '' }],
  fases: [
    { id: crypto.randomUUID(), nome: 'Discovery', mes: 1, semanas: 2 },
    { id: crypto.randomUUID(), nome: 'Desenvolvimento', mes: 2, semanas: 4 },
    { id: crypto.randomUUID(), nome: 'Testes & Deploy', mes: 3, semanas: 2 },
  ],
  itensInvestimento: [{ id: crypto.randomUUID(), descricao: '', valor: 0 }],
  formaPagamento: '',
  itensInfra: [{ id: crypto.randomUUID(), descricao: '', valorMensal: 0 }],
  notasInfra: '',
  cenariosInfra: [
    { id: crypto.randomUUID(), nome: 'Starter', usuarios: 'até 100 usuários', infraMensal: 0, manutencaoMensal: 0 },
    { id: crypto.randomUUID(), nome: 'Growth', usuarios: 'até 500 usuários', infraMensal: 0, manutencaoMensal: 0 },
  ],
  proximosPassos: [{ id: crypto.randomUUID(), texto: '' }],
  nomeContato: 'Thales Carneiro',
  emailContato: 'contato@sheeptechnology.com.br',
  telefoneContato: '',
  validadeProposta: '',
}
