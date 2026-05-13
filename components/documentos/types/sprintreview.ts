export type EntregaStatus = 'done' | 'partial' | 'blocked'

export interface EntregaSprint {
  id: string
  titulo: string
  status: EntregaStatus
}

export interface ImpedimentoItem {
  id: string
  texto: string
}

export interface ProximoItem {
  id: string
  texto: string
}

export interface SprintReviewData {
  nomeProjeto: string
  timeNome: string
  sprintNumero: string
  periodo: string
  meta: string
  metaAtingida: boolean
  resultado: string
  entregas: EntregaSprint[]
  velocidade: string
  bugsResolvidos: string
  cobertura: string
  impedimentos: ImpedimentoItem[]
  proximaMeta: string
  proximosItens: ProximoItem[]
}

export const defaultSprintReview: SprintReviewData = {
  nomeProjeto: '',
  timeNome: 'Time Sheep',
  sprintNumero: '1',
  periodo: '',
  meta: '',
  metaAtingida: true,
  resultado: '',
  entregas: [{ id: crypto.randomUUID(), titulo: '', status: 'done' }],
  velocidade: '',
  bugsResolvidos: '',
  cobertura: '',
  impedimentos: [{ id: crypto.randomUUID(), texto: '' }],
  proximaMeta: '',
  proximosItens: [{ id: crypto.randomUUID(), texto: '' }],
}
