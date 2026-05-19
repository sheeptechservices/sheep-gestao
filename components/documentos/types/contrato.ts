export interface ItemContrato {
  id: string
  descricao: string
  valor: number
}

export interface EscopoItem {
  id: string
  texto: string
}

export interface ContratoData {
  // Partes — Contratante
  nomeCliente: string
  cnpjCliente: string
  enderecoCliente: string
  representanteCliente: string
  cargoRepresentanteCliente: string

  // Partes — Contratada
  nomeContratada: string
  cnpjContratada: string
  enderecoContratada: string
  representanteContratada: string

  // Objeto
  tituloContrato: string
  descricaoObjeto: string
  escopoItens: EscopoItem[]

  // Valores
  itensValor: ItemContrato[]
  formaPagamento: string

  // Prazos
  dataAssinatura: string
  dataInicio: string
  dataTermino: string

  // Condições especiais
  condicoesEspeciais: string
}

export const defaultContrato: ContratoData = {
  nomeCliente: '',
  cnpjCliente: '',
  enderecoCliente: '',
  representanteCliente: '',
  cargoRepresentanteCliente: '',

  nomeContratada: 'Sheep Technology Consultoria e Desenvolvimento LTDA',
  cnpjContratada: '51.571.174/0001-38',
  enderecoContratada: 'Av. Paulista, 1000 – Bela Vista – São Paulo/SP – CEP 01310-100',
  representanteContratada: 'Guilherme Zaidan',

  tituloContrato: '',
  descricaoObjeto: '',
  escopoItens: [],

  itensValor: [],
  formaPagamento: '',

  dataAssinatura: '',
  dataInicio: '',
  dataTermino: '',

  condicoesEspeciais: '',
}
