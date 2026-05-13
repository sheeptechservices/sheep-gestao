import type { Client, Project, Task, Week } from "./types";

export const mockClients: Client[] = [
  { id: "c1", name: "Nexum Digital", contact_name: "Rafael Lima", contact_email: "rafael@nexum.com", created_at: "2024-01-10" },
  { id: "c2", name: "Orion Saúde", contact_name: "Carla Mendes", contact_email: "carla@orionsaude.com.br", created_at: "2024-02-15" },
  { id: "c3", name: "BlueStar Logistics", contact_name: "Marcos Costa", contact_email: "marcos@bluestar.com", created_at: "2024-03-01" },
  { id: "c4", name: "Rede Varejo Plus", contact_name: "Juliana Torres", contact_email: "juliana@redevarejo.com.br", created_at: "2024-03-20" },
];

export const mockProjects: Project[] = [
  {
    id: "p1",
    client_id: "c1",
    client: mockClients[0],
    name: "Plataforma IA de Atendimento",
    description: "Chatbot com IA generativa para atendimento ao cliente 24/7",
    status: "active",
    type: "AI",
    color_hex: "#84CC16",
    start_date: "2025-02-01",
    end_date: "2025-07-31",
    progress: 62,
    created_at: "2025-01-28",
    gestor: "Guilherme Zaidan",
  },
  {
    id: "p2",
    client_id: "c2",
    client: mockClients[1],
    name: "Portal SaaS de Gestão Clínica",
    description: "Sistema web para agendamento, prontuário e faturamento",
    status: "active",
    type: "SaaS",
    color_hex: "#6366F1",
    start_date: "2025-01-15",
    end_date: "2025-09-30",
    progress: 38,
    created_at: "2025-01-12",
    gestor: "Guilherme Zaidan",
  },
  {
    id: "p3",
    client_id: "c3",
    client: mockClients[2],
    name: "Dashboard BI Logístico",
    description: "Power BI com rastreio de frota, KPIs de entrega e forecasting",
    status: "active",
    type: "BI",
    color_hex: "#F59E0B",
    start_date: "2025-03-01",
    end_date: "2025-06-30",
    progress: 80,
    created_at: "2025-02-25",
    gestor: "Guilherme Zaidan",
  },
  {
    id: "p4",
    client_id: "c4",
    client: mockClients[3],
    name: "Automação Power Platform",
    description: "Fluxos Power Automate + Apps para equipe de campo",
    status: "paused",
    type: "PowerPlatform",
    color_hex: "#EC4899",
    start_date: "2024-11-01",
    end_date: "2025-05-31",
    progress: 45,
    created_at: "2024-10-28",
    gestor: "Rafael Carneiro",
  },
  {
    id: "p5",
    client_id: "c1",
    client: mockClients[0],
    name: "TaaS — Squad Dedicado Frontend",
    description: "Alocação de 3 devs React para o time de produto do cliente",
    status: "active",
    type: "TaaS",
    color_hex: "#14B8A6",
    start_date: "2025-01-01",
    end_date: "2025-12-31",
    progress: 30,
    created_at: "2024-12-20",
    gestor: "Guilherme Zaidan",
  },
  {
    id: "p6",
    client_id: "c2",
    client: mockClients[1],
    name: "Migração de Dados Legacy",
    description: "ETL e migração do banco legado para novo ambiente cloud",
    status: "completed",
    type: "Other",
    color_hex: "#1E8A3E",
    start_date: "2024-08-01",
    end_date: "2024-12-31",
    progress: 100,
    created_at: "2024-07-25",
    gestor: "Guilherme Zaidan",
  },
  {
    id: "p7",
    client_id: "c3",
    client: mockClients[2],
    name: "App Mobile de Rastreio",
    description: "Aplicativo React Native para rastreio de entregas em campo",
    status: "cancelled",
    type: "Other",
    color_hex: "#D93025",
    start_date: "2024-06-01",
    end_date: "2024-09-30",
    progress: 20,
    created_at: "2024-05-28",
    gestor: "Rafael Carneiro",
  },
];

// ── Semanas ───────────────────────────────────────────────────────────────────
// Referência (2026-05-07):
//   Sem 13: 2026-03-23 → 2026-03-29
//   Sem 14: 2026-03-30 → 2026-04-05
//   Sem 15: 2026-04-06 → 2026-04-12
//   Sem 16: 2026-04-13 → 2026-04-19
//   Sem 17: 2026-04-20 → 2026-04-26  ← passada (2 sem atrás)
//   Sem 18: 2026-04-27 → 2026-05-03  ← passada (1 sem atrás)  [era w1a]
//   Sem 19: 2026-05-04 → 2026-05-10  ← ATUAL                  [era w1b]
//   Sem 20: 2026-05-11 → 2026-05-17  ← próxima                [era w1c]
//   Sem 21: 2026-05-18 → 2026-05-24
//   Sem 22: 2026-05-25 → 2026-05-31

export const mockWeeks: Week[] = [
  // ── p1 — Plataforma IA (8 semanas: 13–20) ────────────────────────────────
  { id: "w1_13", project_id: "p1", week_number: 13, start_date: "2026-03-23", end_date: "2026-03-29",
    goals: "Kick-off do projeto e alinhamento de escopo com o cliente",
    notes: "Escopo aprovado. Contrato assinado.", created_at: "2026-03-23" },
  { id: "w1_14", project_id: "p1", week_number: 14, start_date: "2026-03-30", end_date: "2026-04-05",
    goals: "Setup do ambiente e definição da stack de IA",
    notes: "LangChain + Anthropic Claude escolhidos como base.", created_at: "2026-03-30" },
  { id: "w1_15", project_id: "p1", week_number: 15, start_date: "2026-04-06", end_date: "2026-04-12",
    goals: "Protótipo do pipeline de RAG e primeiro fluxo de conversa",
    notes: "Pipeline funcionando com 78% de recall nos primeiros testes.", created_at: "2026-04-06" },
  { id: "w1_16", project_id: "p1", week_number: 16, start_date: "2026-04-13", end_date: "2026-04-19",
    goals: "Refinamento dos prompts e integração com base de conhecimento",
    notes: "Base importada com 1.200 artigos. Chunking ajustado.", created_at: "2026-04-13" },
  { id: "w1_17", project_id: "p1", week_number: 17, start_date: "2026-04-20", end_date: "2026-04-26",
    goals: "Testes de stress do chatbot e ajuste de fallbacks",
    notes: "Taxa de fallback reduzida de 18% para 6%.", created_at: "2026-04-20" },
  { id: "w1a",   project_id: "p1", week_number: 18, start_date: "2026-04-27", end_date: "2026-05-03",
    goals: "Finalizar arquitetura de embeddings e validar base de conhecimento",
    notes: "Embeddings aprovados — recall 92% nos testes internos", created_at: "2026-04-27" },
  { id: "w1b",   project_id: "p1", week_number: 19, start_date: "2026-05-04", end_date: "2026-05-10",
    goals: "Integração com WhatsApp Business API e testes de regressão do chatbot",
    notes: "API retornou 403 na quarta — aguardando aprovação do Meta", created_at: "2026-05-04" },
  { id: "w1c",   project_id: "p1", week_number: 20, start_date: "2026-05-11", end_date: "2026-05-17",
    goals: "Ajuste de prompts de fallback e documentação de escalação humana",
    notes: "", created_at: "2026-05-04" },
  { id: "w1_21", project_id: "p1", week_number: 21, start_date: "2026-05-18", end_date: "2026-05-24",
    goals: "Homologação com o cliente e treinamento do time de suporte",
    notes: "", created_at: "2026-05-04" },
  { id: "w1_22", project_id: "p1", week_number: 22, start_date: "2026-05-25", end_date: "2026-05-31",
    goals: "Go-live em produção e monitoramento pós-lançamento",
    notes: "", created_at: "2026-05-04" },

  // ── p2 — Portal SaaS (8 semanas: 11–20) ───────────────────────────────────
  { id: "w2_11", project_id: "p2", week_number: 11, start_date: "2026-03-09", end_date: "2026-03-15",
    goals: "Definição da arquitetura multi-tenant e setup do banco",
    notes: "PostgreSQL com RLS configurado para isolamento de dados.", created_at: "2026-03-09" },
  { id: "w2_12", project_id: "p2", week_number: 12, start_date: "2026-03-16", end_date: "2026-03-22",
    goals: "Módulo de autenticação e onboarding de clínicas",
    notes: "SSO com Google Workspace integrado.", created_at: "2026-03-16" },
  { id: "w2_13", project_id: "p2", week_number: 13, start_date: "2026-03-23", end_date: "2026-03-29",
    goals: "CRUD de pacientes e primeiras telas de prontuário",
    notes: "Fluxo de cadastro de paciente aprovado em review.", created_at: "2026-03-23" },
  { id: "w2_14", project_id: "p2", week_number: 14, start_date: "2026-03-30", end_date: "2026-04-05",
    goals: "Sistema de agendamento v1 — calendário + slots disponíveis",
    notes: "Integração com Google Calendar descartada — solução própria.", created_at: "2026-03-30" },
  { id: "w2_15", project_id: "p2", week_number: 15, start_date: "2026-04-06", end_date: "2026-04-12",
    goals: "Notificações por e-mail e SMS de consultas agendadas",
    notes: "Twilio integrado. Templates aprovados pelo cliente.", created_at: "2026-04-06" },
  { id: "w2a",   project_id: "p2", week_number: 16, start_date: "2026-04-27", end_date: "2026-05-03",
    goals: "Tela de prontuário v2 em review + ajustes de UX",
    notes: "Cliente pediu mudança no fluxo de confirmação de consulta", created_at: "2026-04-27" },
  { id: "w2b",   project_id: "p2", week_number: 17, start_date: "2026-05-04", end_date: "2026-05-10",
    goals: "Módulo de agendamento online — entrega parcial",
    notes: "Integração com convênios ainda pendente de credencial de homologação", created_at: "2026-05-04" },
  { id: "w2c",   project_id: "p2", week_number: 18, start_date: "2026-05-11", end_date: "2026-05-17",
    goals: "Integração com convênios (TISS) e relatório de faturamento mensal",
    notes: "", created_at: "2026-05-04" },
  { id: "w2_19", project_id: "p2", week_number: 19, start_date: "2026-05-18", end_date: "2026-05-24",
    goals: "Testes de homologação com operadoras de saúde",
    notes: "", created_at: "2026-05-04" },
  { id: "w2_20", project_id: "p2", week_number: 20, start_date: "2026-05-25", end_date: "2026-05-31",
    goals: "Beta fechado com 3 clínicas piloto",
    notes: "", created_at: "2026-05-04" },

  // ── p3 — Dashboard BI (8 semanas: 14–21) ─────────────────────────────────
  { id: "w3_14", project_id: "p3", week_number: 14, start_date: "2026-03-30", end_date: "2026-04-05",
    goals: "Levantamento de KPIs e fontes de dados com o cliente",
    notes: "8 KPIs definidos. Acesso ao ERP concedido.", created_at: "2026-03-30" },
  { id: "w3_15", project_id: "p3", week_number: 15, start_date: "2026-04-06", end_date: "2026-04-12",
    goals: "Modelagem dimensional e primeiros relatórios no Power BI",
    notes: "Star schema aprovado. 3 relatórios rascunhados.", created_at: "2026-04-06" },
  { id: "w3_16", project_id: "p3", week_number: 16, start_date: "2026-04-13", end_date: "2026-04-19",
    goals: "Integração com fonte de dados de frota e pipeline ETL",
    notes: "ETL rodando a cada 4h. Dados de frota chegando limpos.", created_at: "2026-04-13" },
  { id: "w3_17", project_id: "p3", week_number: 17, start_date: "2026-04-20", end_date: "2026-04-26",
    goals: "Dashboard de atrasos e mapa de rotas interativo",
    notes: "Mapa com Bing Maps integrado. Performance OK.", created_at: "2026-04-20" },
  { id: "w3a",   project_id: "p3", week_number: 18, start_date: "2026-04-27", end_date: "2026-05-03",
    goals: "Conexão com API de rastreio de frota e pipeline de dados",
    notes: "API de rastreio entregou latência alta — otimização de cache aplicada", created_at: "2026-04-27" },
  { id: "w3b",   project_id: "p3", week_number: 19, start_date: "2026-05-04", end_date: "2026-05-10",
    goals: "Dashboard de KPIs em review e início do modelo preditivo de atrasos",
    notes: "Cliente aprovou paleta de cores — verde e laranja aprovados", created_at: "2026-05-04" },
  { id: "w3c",   project_id: "p3", week_number: 20, start_date: "2026-05-11", end_date: "2026-05-17",
    goals: "Publicar relatório final no Power BI Service",
    notes: "", created_at: "2026-05-04" },
  { id: "w3_21", project_id: "p3", week_number: 21, start_date: "2026-05-18", end_date: "2026-05-24",
    goals: "Treinamento do time do cliente e entrega do manual",
    notes: "", created_at: "2026-05-04" },

  // ── p4 — Power Platform (6 semanas: 15–20) ────────────────────────────────
  { id: "w4_15", project_id: "p4", week_number: 15, start_date: "2026-04-06", end_date: "2026-04-12",
    goals: "Mapeamento dos processos de aprovação e fluxo de RH",
    notes: "6 fluxos mapeados. Prioridade: aprovação de despesas e RH.", created_at: "2026-04-06" },
  { id: "w4_16", project_id: "p4", week_number: 16, start_date: "2026-04-13", end_date: "2026-04-19",
    goals: "Construção dos fluxos Power Automate — fase 1",
    notes: "Projeto pausado por 2 semanas a pedido do cliente.", created_at: "2026-04-13" },
  { id: "w4a",   project_id: "p4", week_number: 17, start_date: "2026-04-27", end_date: "2026-05-03",
    goals: "Levantamento dos fluxos de aprovação de despesas",
    notes: "Projeto pausado — retomada prevista para semana 18", created_at: "2026-04-27" },
  { id: "w4b",   project_id: "p4", week_number: 18, start_date: "2026-05-04", end_date: "2026-05-10",
    goals: "Corrigir bug crítico no fluxo de RH",
    notes: "Bug mapeado — causa: permissão ausente no conector SharePoint", created_at: "2026-05-04" },
  { id: "w4c",   project_id: "p4", week_number: 19, start_date: "2026-05-11", end_date: "2026-05-17",
    goals: "Revisar e testar fluxos de aprovação de despesas",
    notes: "", created_at: "2026-05-04" },
  { id: "w4_20", project_id: "p4", week_number: 20, start_date: "2026-05-18", end_date: "2026-05-24",
    goals: "Entrega final e handoff para o time interno do cliente",
    notes: "", created_at: "2026-05-04" },

  // ── p5 — TaaS Squad (8 semanas: 14–21) ───────────────────────────────────
  { id: "w5_14", project_id: "p5", week_number: 14, start_date: "2026-03-30", end_date: "2026-04-05",
    goals: "Alinhamento de cerimônias ágeis e definição de DoD",
    notes: "Daily às 9h30, sprint de 2 semanas, DoD acordado.", created_at: "2026-03-30" },
  { id: "w5_15", project_id: "p5", week_number: 15, start_date: "2026-04-06", end_date: "2026-04-12",
    goals: "Sprint 16 — módulo de carrinho e checkout v1",
    notes: "Checkout v1 entregue com sucesso. 0 bugs críticos.", created_at: "2026-04-06" },
  { id: "w5_16", project_id: "p5", week_number: 16, start_date: "2026-04-13", end_date: "2026-04-19",
    goals: "Sprint 17 — sistema de cupons e integração com gateway de pagamento",
    notes: "Stripe integrado. Cupons funcionando em staging.", created_at: "2026-04-13" },
  { id: "w5_17", project_id: "p5", week_number: 17, start_date: "2026-04-20", end_date: "2026-04-26",
    goals: "Sprint 18 — painel admin e primeiros testes de performance",
    notes: "LCP reduzido de 4.2s para 1.8s com lazy loading.", created_at: "2026-04-20" },
  { id: "w5a",   project_id: "p5", week_number: 18, start_date: "2026-04-27", end_date: "2026-05-03",
    goals: "Onboarding dos devs e configuração do ambiente",
    notes: "Onboarding concluído — todos os devs com acesso ao repo", created_at: "2026-04-27" },
  { id: "w5b",   project_id: "p5", week_number: 19, start_date: "2026-05-04", end_date: "2026-05-10",
    goals: "Sprint planning + code review das PRs em aberto",
    notes: "PR #47 de autenticação em review — aguarda aprovação do tech lead", created_at: "2026-05-04" },
  { id: "w5c",   project_id: "p5", week_number: 20, start_date: "2026-05-11", end_date: "2026-05-17",
    goals: "Deploy ambiente de staging e início da sprint 20",
    notes: "", created_at: "2026-05-04" },
  { id: "w5_21", project_id: "p5", week_number: 21, start_date: "2026-05-18", end_date: "2026-05-24",
    goals: "Sprint 21 — otimizações de acessibilidade e testes E2E",
    notes: "", created_at: "2026-05-04" },
  { id: "w5_22", project_id: "p5", week_number: 22, start_date: "2026-05-25", end_date: "2026-05-31",
    goals: "Entrega de relatório mensal e retrospectiva do trimestre",
    notes: "", created_at: "2026-05-04" },

  // ── p6 — Migração Legacy (completed) ──────────────────────────────────────
  { id: "w6a", project_id: "p6", week_number: 20, start_date: "2024-12-16", end_date: "2024-12-20",
    goals: "Migração final dos dados e validação em produção",
    notes: "ETL concluído com sucesso — zero perda de dados confirmada", created_at: "2024-12-16" },
  { id: "w6b", project_id: "p6", week_number: 21, start_date: "2024-12-23", end_date: "2024-12-27",
    goals: "Encerramento do projeto e entrega do relatório final",
    notes: "Projeto entregue e aprovado pelo cliente", created_at: "2024-12-23" },

  // ── p7 — App Mobile (cancelled) ───────────────────────────────────────────
  { id: "w7a", project_id: "p7", week_number: 15, start_date: "2024-09-16", end_date: "2024-09-20",
    goals: "Prototipação das telas principais do app",
    notes: "Projeto cancelado após aprovação do protótipo", created_at: "2024-09-16" },
];

// ── Entregáveis (com week_id atribuído) ──────────────────────────────────────
export const mockTasks: Task[] = [
  // p1 — Plataforma IA de Atendimento
  // w1a (passada) — concluída
  { id: "t1",  project_id: "p1", week_id: "w1a", title: "Definir arquitetura de embeddings",       done: true,  assigned_to: "Ana P.",     created_at: "2026-04-25" },
  // w1b (atual)
  { id: "t2",  project_id: "p1", week_id: "w1b", title: "Integração com WhatsApp Business API",    done: false, assigned_to: "Carlos M.",  created_at: "2026-04-28" },
  { id: "t3",  project_id: "p1", week_id: "w1b", title: "Testes de regressão do chatbot",          done: false, assigned_to: "Beatriz L.", created_at: "2026-04-28" },
  { id: "t11", project_id: "p1", week_id: "w1b", title: "Ajuste de prompts de fallback",           done: false, assigned_to: "Ana P.",     created_at: "2026-05-05" },
  // backlog (sem semana)
  { id: "t12", project_id: "p1",                  title: "Documentar fluxo de escalação humana",   done: false, assigned_to: "Carlos M.",  created_at: "2026-05-05" },

  // p2 — Portal SaaS de Gestão Clínica
  // w2a (passada)
  { id: "t13", project_id: "p2", week_id: "w2a", title: "Tela de prontuário v2",                   done: true,  assigned_to: "Beatriz L.", created_at: "2026-04-27" },
  // w2b (atual)
  { id: "t4",  project_id: "p2", week_id: "w2b", title: "Módulo de agendamento online",            done: false, assigned_to: "Diego F.",   created_at: "2026-04-20" },
  // w2c (próxima)
  { id: "t5",  project_id: "p2", week_id: "w2c", title: "Integração com convênios (TISS)",         done: false, assigned_to: "Ana P.",     created_at: "2026-04-28" },
  // backlog
  { id: "t14", project_id: "p2",                  title: "Relatório de faturamento mensal",         done: false, assigned_to: "Diego F.",   created_at: "2026-05-05" },

  // p3 — Dashboard BI Logístico
  // w3a (passada)
  { id: "t15", project_id: "p3", week_id: "w3a", title: "Conexão com API de rastreio de frota",    done: true,  assigned_to: "Ana P.",     created_at: "2026-04-25" },
  // w3b (atual)
  { id: "t6",  project_id: "p3", week_id: "w3b", title: "Dashboard de KPIs de entrega",            done: false, assigned_to: "Carlos M.",  created_at: "2026-04-18" },
  { id: "t7",  project_id: "p3", week_id: "w3b", title: "Modelo preditivo de atrasos",             done: false, assigned_to: "Beatriz L.", created_at: "2026-04-28" },
  // backlog
  { id: "t16", project_id: "p3",                  title: "Publicar relatório no Power BI Service",  done: false, assigned_to: "Carlos M.",  created_at: "2026-05-05" },

  // p4 — Automação Power Platform
  // w4b (atual)
  { id: "t17", project_id: "p4", week_id: "w4b", title: "Corrigir bug no fluxo de RH",             done: false, assigned_to: "Ana P.",     created_at: "2026-05-04" },
  // backlog
  { id: "t8",  project_id: "p4",                  title: "Revisar fluxos de aprovação de despesas", done: false, assigned_to: "Diego F.",   created_at: "2026-04-28" },

  // p5 — TaaS Squad Frontend
  // w5a (passada)
  { id: "t9",  project_id: "p5", week_id: "w5a", title: "Onboarding dos devs no repo do cliente",  done: true,  assigned_to: "Ana P.",     created_at: "2026-04-25" },
  // w5b (atual)
  { id: "t10", project_id: "p5", week_id: "w5b", title: "Sprint planning semana 18",               done: true,  assigned_to: "Carlos M.",  created_at: "2026-05-04" },
  { id: "t18", project_id: "p5", week_id: "w5b", title: "Code review PR #47 — autenticação",       done: false, assigned_to: "Beatriz L.", created_at: "2026-05-05" },
  // backlog
  { id: "t19", project_id: "p5",                  title: "Deploy ambiente de staging",              done: false, assigned_to: "Diego F.",   created_at: "2026-05-05" },
];

export const todayPriorities = mockTasks.filter(t => !t.done).slice(0, 5);

export const mockNpsSurveys = [
  { id: 's1', client_name: 'Nexum Digital',      project_name: 'Plataforma IA',     score: 10 },
  { id: 's2', client_name: 'Nexum Digital',      project_name: 'TaaS Frontend',     score: 9  },
  { id: 's3', client_name: 'Orion Saúde',        project_name: 'Portal SaaS',       score: 9  },
  { id: 's4', client_name: 'Orion Saúde',        project_name: 'Migração Legacy',   score: 8  },
  { id: 's5', client_name: 'BlueStar Logistics', project_name: 'Dashboard BI',      score: 10 },
  { id: 's6', client_name: 'BlueStar Logistics', project_name: 'App Mobile',        score: 7  },
  { id: 's7', client_name: 'Rede Varejo Plus',   project_name: 'Power Platform',    score: 5  },
  { id: 's8', client_name: 'Nexum Digital',      project_name: 'Plataforma IA',     score: 9  },
  { id: 's9', client_name: 'BlueStar Logistics', project_name: 'Dashboard BI',      score: 10 },
  { id: 's10',client_name: 'Rede Varejo Plus',   project_name: 'Power Platform',    score: 8  },
]

const _promotores = mockNpsSurveys.filter(s => s.score >= 9).length
const _detratores = mockNpsSurveys.filter(s => s.score <= 6).length
export const mockNps = Math.round((_promotores - _detratores) / mockNpsSurveys.length * 100)
