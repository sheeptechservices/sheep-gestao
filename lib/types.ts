export type ProjectStatus = "active" | "negotiation" | "paused" | "completed" | "cancelled";
export type ProjectType = "AI" | "SaaS" | "TaaS" | "BI" | "PowerPlatform" | "Other";
export type AgentType = "designer" | "po_pm" | "qa" | "dev" | "devops" | "sales" | "juridico" | "marketing" | "secretaria";

export type ClientStatus = 'active' | 'inactive' | 'paused' | 'cancelled'

export type MemberStatus   = 'active' | 'inactive'
export type MemberSexo     = 'masculino' | 'feminino' | 'outro' | 'nao_informado'
export type MemberSenior   = 'junior' | 'pleno' | 'senior' | 'especialista' | 'lideranca'
export type MemberIngles   = 'nenhum' | 'basico' | 'intermediario' | 'avancado' | 'fluente'
export type MemberRegime   = 'mei' | 'me' | 'simples' | 'lucro_presumido' | 'outro'
export type MemberExp      = 'menos1' | '1a2' | '3a5' | '5a10' | 'mais10'

export interface TeamMember {
  id: string
  name: string
  cargo: string
  email?: string
  photo_url?: string      // /api/team/[id]/photo
  joined_at?: string      // YYYY-MM-DD
  status: MemberStatus
  color_hex: string
  created_at: string

  // Identificação & Contato
  sexo?: MemberSexo
  data_nascimento?: string  // YYYY-MM-DD
  whatsapp?: string
  linkedin?: string
  github?: string
  indicacao_nome?: string
  indicacao_email?: string

  // Localização
  estado?: string
  cidade?: string

  // Perfil Profissional
  resumo_profissional?: string
  papel_principal?: string
  senioridade?: MemberSenior
  tempo_experiencia?: MemberExp
  nivel_ingles?: MemberIngles
  outro_idioma?: string

  // Situação Fiscal
  possui_cnpj?: boolean
  regime_fiscal?: MemberRegime

  // Documentos
  curriculo_url?: string   // /api/team/[id]/cv

  // LGPD
  lgpd_consent?: boolean
  newsletter_consent?: boolean
}

export interface Client {
  id: string;
  name: string;
  logo_url?: string;
  contact_name?: string;
  contact_email?: string;
  created_at: string;
  color_hex?: string;
  status?: ClientStatus;
  data_entrada?: string;
  data_saida?: string;
  segmento?: string;
  sub_segmento?: string;
  origem_comercial?: string;
  canal_aquisicao?: string;
  cidade_estado?: string;
  cnpj_cpf?: string;
  pasta?: string;
}

export interface Project {
  id: string;
  client_id: string;
  client?: Client;
  name: string;
  description?: string;
  status: ProjectStatus;
  type: ProjectType;
  color_hex: string;
  start_date: string;
  end_date?: string;
  progress: number;
  created_at: string;
  gestor?: string;
  observacoes?: string;
  links?: string;
  team_members?: string[];
  display_order?: number;
  github_repo?: string;   // formato "owner/repo" — ex: "sheeptechservices/sheep-gestao"
}

export interface Week {
  id: string;
  week_number: number;
  start_date: string;
  end_date: string;
  goals?: string;
  notes?: string;
  created_at: string;
  project_id?: string;  // opcional — mantido para compatibilidade com dados antigos
}

export type TaskUrgency = 'low' | 'medium' | 'high'

export interface Task {
  id: string;
  project_id?: string;
  week_id?: string;
  title: string;
  description?: string;
  urgency?: TaskUrgency;
  done: boolean;
  assigned_to?: string;
  member_id?: string;
  member_ids?: string[];
  flags?: string[];
  flag_comment?: string;
  deadline?: string;          // ISO date 'YYYY-MM-DD' — previsão de entrega
  created_at: string;
  attachment_count?: number;  // preenchido pelo GET /api/tasks (subquery COUNT)
  is_draft?: boolean;         // true → rascunho em edição; filtrado do GET normal
}

export interface TaskAttachment {
  id: string
  task_id: string
  filename: string
  url: string
  size: number
  mime_type: string
  created_at: string
}

export interface Artifact {
  id: string;
  project_id: string;
  agent_type: AgentType;
  title: string;
  content: string;
  tags: string[];
  created_at: string;
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  role: string;
  description: string;
  color: string;
  bgColor: string;
  icon: string;
}
