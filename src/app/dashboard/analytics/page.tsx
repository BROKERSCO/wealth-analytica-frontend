'use client'
// src/app/dashboard/analytics/page.tsx

import { useEffect, useState } from 'react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import {
  FolderOpen, FileText, TrendingUp, AlertTriangle,
  DollarSign, CheckCircle, Shield, RefreshCw
} from 'lucide-react'

interface Resumo {
  totalCases:       number
  totalLaudos:      number
  laudosConcluidos: number
  laudosAssinados:  number
  totalCalculos:    number
  totalDivergencia: number
  valorRecuperado:  number
}

interface GraficoPonto {
  mes:   string
  total: number
}

const fmtBRL = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

const CARDS = (resumo: Resumo) => [
  {
    label:  'Total de Casos',
    value:  resumo.totalCases,
    icon:   FolderOpen,
    color:  'text-blue-600',
    bg:     'bg-blue-50',
    border: 'border-blue-200',
  },
  {
    label:  'Laudos Gerados',
    value:  resumo.totalLaudos,
    icon:   FileText,
    color:  'text-purple-600',
    bg:     'bg-purple-50',
    border: 'border-purple-200',
  },
  {
    label:  'Laudos Assinados',
    value:  resumo.laudosAssinados,
    icon:   CheckCircle,
    color:  'text-green-600',
    bg:     'bg-green-50',
    border: 'border-green-200',
  },
  {
    label:  'Análises Realizadas',
    value:  resumo.totalCalculos,
    icon:   TrendingUp,
    color:  'text-brand-600',
    bg:     'bg-brand-50',
    border: 'border-brand-200',
  },
  {
    label:  'Total Divergências',
    value:  fmtBRL(resumo.totalDivergencia),
    icon:   AlertTriangle,
    color:  'text-amber-600',
    bg:     'bg-amber-50',
    border: 'border-amber-200',
  },
  {
    label:  'Valor Recuperado',
    value:  fmtBRL(resumo.valorRecuperado),
    icon:   DollarSign,
    color:  'text-emerald-600',
    bg:     'bg-emerald-50',
    border: 'border-emerald-200',
  },
]

export default function AnalyticsPage() {
  const [resumo,   setResumo]   = useState<Resumo | null>(null)
  const [cases,    setCases]    = useState<GraficoPonto[]>([])
  const [laudos,   setLaudos]   = useState<GraficoPonto[]>([])
  const [loading,  setLoading]  = useState(true)

  const carregar = async () => {
    setLoading(true)
    try {
      const { data } = await api.get('/api/analytics/dashboard')
      setResumo(data.resumo)
      setCases(data.graficos.casesPorMes)
      setLaudos(data.graficos.laudosPorMes)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!resumo) return null

  const cards = CARDS(resumo)

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-brand-500" /> Dashboard Analítico
          </h1>
          <p className="text-gray-500 text-sm mt-1">Visão geral da sua operação</p>
        </div>
        <button onClick={carregar} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Atualizar
        </button>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {cards.map(({ label, value, icon: Icon, color, bg, border }) => (
          <div key={label} className={cn('card border', border)}>
            <div className="flex items-center gap-3 mb-3">
              <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center', bg)}>
                <Icon className={cn('w-5 h-5', color)} />
              </div>
              <p className="text-sm text-gray-500">{label}</p>
            </div>
            <p className={cn('text-2xl font-bold', color)}>
              {typeof value === 'number' ? value.toLocaleString('pt-BR') : value}
            </p>
          </div>
        ))}
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-2 gap-6">

        {/* Casos por mês */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-brand-500" /> Casos por Mês
          </h3>
          {cases.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={cases} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, 'Casos']}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Bar dataKey="total" fill="#2563eb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Laudos por mês */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4 text-purple-500" /> Laudos por Mês
          </h3>
          {laudos.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
              Nenhum dado disponível
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={laudos} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  formatter={(v: number) => [v, 'Laudos']}
                  contentStyle={{ borderRadius: 8, fontSize: 13 }}
                />
                <Line
                  type="monotone" dataKey="total"
                  stroke="#7c3aed" strokeWidth={2}
                  dot={{ fill: '#7c3aed', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Resumo financeiro */}
        <div className="card col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-500" /> Resumo Financeiro
          </h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="text-center p-4 bg-amber-50 rounded-xl border border-amber-200">
              <p className="text-xs text-amber-600 mb-1">Total de Divergências Apuradas</p>
              <p className="text-xl font-bold text-amber-700">{fmtBRL(resumo.totalDivergencia)}</p>
              <p className="text-xs text-amber-500 mt-1">cobranças acima do contratual</p>
            </div>
            <div className="text-center p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <p className="text-xs text-emerald-600 mb-1">Valor Recuperável Estimado</p>
              <p className="text-xl font-bold text-emerald-700">{fmtBRL(resumo.valorRecuperado)}</p>
              <p className="text-xs text-emerald-500 mt-1">excesso identificado nas análises</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-200">
              <p className="text-xs text-blue-600 mb-1">Restituição em Dobro (CDC art. 42)</p>
              <p className="text-xl font-bold text-blue-700">{fmtBRL(resumo.valorRecuperado * 2)}</p>
              <p className="text-xs text-blue-500 mt-1">potencial de restituição</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
