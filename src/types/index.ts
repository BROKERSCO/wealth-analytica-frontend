// src/types/index.ts

export interface User {
  id:          string
  nome:        string
  email:       string
  perfil:      string
  plano:       string
  oab?:        string
  titulacao?:  string
  organizacao?: string
}

export interface Case {
  id:          string
  numero:      string
  tipo:        string
  status:      CaseStatus
  requerente:  string
  requerido:   string
  processo?:   string
  vara?:       string
  contrato?:   Contrato
  criadoEm:   string
  atualizadoEm: string
  _count?: {
    laudos:    number
    transacoes: number
  }
}

export type CaseStatus =
  | 'NOVO'
  | 'EM_ANALISE'
  | 'AGUARDANDO_DADOS'
  | 'LAUDO_GERADO'
  | 'ENCERRADO'

export interface Contrato {
  numero:         string
  data:           string
  valorBruto:     number
  prazoMeses:     number
  taxaNominal:    number
  taxaCet?:       number
  sistema:        string
  iofContrato?:   number
  tarifaCadastro?: number
  fonte:          string
}

export interface Transaction {
  id:           string
  competencia:  string
  vencimento:   string
  valorCobrado: number
  principal:    number
  jurosCobrado: number
  categoria?:   string
}

export interface Laudo {
  id:            string
  numero:        string
  tipo:          string
  status:        LaudoStatus
  hashDocumento: string
  storageUrl?:   string
  geradoEm?:     string
  versao:        number
  case?: {
    id:         string
    numero:     string
    requerente: string
    requerido:  string
  }
}

export type LaudoStatus = 'GERANDO' | 'CONCLUIDO' | 'FALHOU' | 'REVOGADO'
