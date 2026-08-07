// src/lib/utils.ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { CaseStatus, LaudoStatus } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export const fmtDate = (s: string) =>
  new Date(s).toLocaleDateString('pt-BR')

export const fmtPerc = (v: number) =>
  `${(v * 100).toFixed(2).replace('.', ',')}% a.m.`

export const STATUS_CASE: Record<CaseStatus, { label: string; color: string }> = {
  NOVO:            { label: 'Novo',            color: 'bg-gray-100 text-gray-700' },
  EM_ANALISE:      { label: 'Em análise',      color: 'bg-blue-100 text-blue-700' },
  AGUARDANDO_DADOS:{ label: 'Aguard. dados',   color: 'bg-amber-100 text-amber-700' },
  LAUDO_GERADO:    { label: 'Laudo gerado',    color: 'bg-green-100 text-green-700' },
  ENCERRADO:       { label: 'Encerrado',       color: 'bg-gray-200 text-gray-500' },
}

export const STATUS_LAUDO: Record<LaudoStatus, { label: string; color: string }> = {
  GERANDO:  { label: 'Gerando...',  color: 'bg-blue-100 text-blue-700' },
  CONCLUIDO:{ label: 'Concluído',  color: 'bg-green-100 text-green-700' },
  FALHOU:   { label: 'Falhou',     color: 'bg-red-100 text-red-700' },
  REVOGADO: { label: 'Revogado',   color: 'bg-gray-200 text-gray-500' },
}

export const TIPO_CASE: Record<string, string> = {
  RECALCULO_CONTRATUAL: 'Recálculo Contratual',
  CONCILIACAO_EXTRATO:  'Conciliação de Extrato',
  ANALISE_CARTAO:       'Análise de Cartão',
  CHEQUE_ESPECIAL:      'Cheque Especial',
  PERICIA_JUDICIAL:     'Perícia Judicial',
  COMPLIANCE:           'Compliance',
}
