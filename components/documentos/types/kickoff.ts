import type { Fase } from './proposta'

export interface MembroEquipe {
  id: string
  nome: string
  papel: string
  email: string
}

export interface ItemEscopo {
  id: string
  texto: string
}

export interface ObjetivoItem {
  id: string
  texto: string
}

export interface PassoKickoff {
  id: string
  texto: string
}

export interface KickoffData {
  nomeProjeto: string
  nomeCliente: string
  dataInicio: string
  nomeResponsavel: string
  contexto: string
  objetivos: ObjetivoItem[]
  incluidos: ItemEscopo[]
  excluidos: ItemEscopo[]
  equipe: MembroEquipe[]
  fases: Fase[]
  canaisComunicacao: string
  proximosPassos: PassoKickoff[]
}

export const defaultKickoff: KickoffData = {
  nomeProjeto: '',
  nomeCliente: '',
  dataInicio: new Date().toISOString().split('T')[0],
  nomeResponsavel: 'Thales Carneiro',
  contexto: '',
  objetivos: [{ id: crypto.randomUUID(), texto: '' }],
  incluidos: [{ id: crypto.randomUUID(), texto: '' }],
  excluidos: [{ id: crypto.randomUUID(), texto: '' }],
  equipe: [{ id: crypto.randomUUID(), nome: '', papel: '', email: '' }],
  fases: [
    { id: crypto.randomUUID(), nome: 'Discovery', mes: 1, semanas: 2 },
    { id: crypto.randomUUID(), nome: 'Setup Inicial', mes: 1, semanas: 2 },
    { id: crypto.randomUUID(), nome: 'Desenvolvimento', mes: 2, semanas: 4 },
    { id: crypto.randomUUID(), nome: 'Testes', mes: 3, semanas: 2 },
    { id: crypto.randomUUID(), nome: 'Deploy', mes: 4, semanas: 1 },
  ],
  canaisComunicacao: 'Slack para comunicação diária · Reuniões semanais às segundas · Email para formalidades',
  proximosPassos: [{ id: crypto.randomUUID(), texto: '' }],
}
