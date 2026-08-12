'use client'
// src/app/dashboard/openfinance/page.tsx

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import dynamic from 'next/dynamic'
const PluggyConnect = dynamic(
  () => import('react-pluggy-connect').then(m => m.PluggyConnect),
  { ssr: false }
)
import {
  Wifi, CheckCircle, AlertCircle, ArrowRight,
  Building2, RefreshCw, Download
} from 'lucide-react'

interface Conta {
  id:      string
  nome:    string
  numero:  string
  saldo:   number
  tipo:    string
  subtipo: string
}

export default function OpenFinancePage() {
  const [etapa,        setEtapa]        = useState<'inicio' | 'conectando' | 'contas' | 'importando' | 'concluido'>('inicio')
  const [connectToken, setConnectToken] = useState<string | null>(null)
  const [itemId,       setItemId]       = useState<string | null>(null)
  const [contas,       setContas]       = useState<Conta[]>([])
  const [contaSel,     setContaSel]     = useState<string | null>(null)
  const [caseId,       setCaseId]       = useState('')
  const [dataInicio,   setDataInicio]   = useState('')
  const [dataFim,      setDataFim]      = useState('')
  const [resultado,    setResultado]    = useState<any>(null)
  const [loading,      setLoading]      = useState(false)

  // Busca lista de casos do usuário
  const [casos, setCasos] = useState<any[]>([])
  useEffect(() => {
    api.get('/api/cases').then(r => setCasos(r.data?.cases ?? [])).catch(() => {})
  }, [])

  // Etapa 1 — Gera connect token e abre widget
  const iniciarConexao = async () => {
    setLoading(true)
    try {
      const { data } = await api.post('/api/openfinance/connect-token', {})
      setConnectToken(data.connectToken)
      setEtapa('conectando')
    } catch (err: any) {
      toast.error('Erro ao iniciar conexão: ' + (err.response?.data?.error ?? err.message))
    } finally {
      setLoading(false)
    }
  }

  // Etapa 2 — Widget Pluggy retornou itemId
  const onConexaoSucesso = async (itemData: any) => {
    const id = itemData?.item?.id ?? itemData?.id
    if (!id) { toast.error('Item ID não encontrado'); return }

    setItemId(id)
    setLoading(true)
    try {
      const { data } = await api.get(`/api/openfinance/contas/${id}`)
      setContas(data.contas ?? [])
      setEtapa('contas')
    } catch (err: any) {
      toast.error('Erro ao buscar contas')
    } finally {
      setLoading(false)
    }
  }

  // Etapa 3 — Importa transações
  const importar = async () => {
    if (!caseId)    { toast.error('Selecione um caso'); return }
    if (!contaSel)  { toast.error('Selecione uma conta'); return }
    if (!itemId)    { toast.error('Conexão não encontrada'); return }

    setLoading(true)
    setEtapa('importando')
    try {
      const { data } = await api.post(`/api/openfinance/importar/${caseId}`, {
        itemId,
        accountId:  contaSel,
        dataInicio: dataInicio || undefined,
        dataFim:    dataFim    || undefined,
      })
      setResultado(data)
      setEtapa('concluido')
      toast.success(`${data.total} transações importadas!`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao importar')
      setEtapa('contas')
    } finally {
      setLoading(false)
    }
  }

  const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Wifi className="w-6 h-6 text-brand-500" /> Open Finance
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Conecte sua conta bancária com consentimento e importe transações automaticamente
        </p>
      </div>

      {/* Etapa: Início */}
      {etapa === 'inicio' && (
        <div className="card text-center py-12">
          <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-brand-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-3">Conectar conta bancária</h2>
          <p className="text-gray-500 text-sm mb-8 max-w-md mx-auto">
            Via Open Finance Brasil você autoriza o acesso ao seu extrato de forma segura,
            sem precisar exportar arquivos. Compatível com todos os grandes bancos.
          </p>
          <div className="flex justify-center gap-4 mb-8">
            {['Bradesco', 'Itaú', 'BB', 'Caixa', 'Santander', 'Nubank'].map(b => (
              <span key={b} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{b}</span>
            ))}
          </div>
          <button onClick={iniciarConexao} disabled={loading} className="btn-primary px-8">
            {loading ? 'Aguarde...' : 'Conectar meu banco'} <ArrowRight className="w-4 h-4 inline ml-2" />
          </button>
        </div>
      )}

      {/* Etapa: Widget Pluggy */}
      {etapa === 'conectando' && connectToken && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Selecione seu banco</h2>
          <PluggyConnect
            connectToken={connectToken}
            includeSandbox={false}
            onSuccess={onConexaoSucesso}
            onError={(error: any) => {
              toast.error('Erro na conexão: ' + error.message)
              setEtapa('inicio')
            }}
            onClose={() => setEtapa('inicio')}
          />
        </div>
      )}

      {/* Etapa: Selecionar conta e caso */}
      {etapa === 'contas' && (
        <div className="card space-y-6">
          <h2 className="font-semibold text-gray-900">Configure a importação</h2>

          {/* Seleção de conta */}
          <div>
            <label className="label">Conta bancária</label>
            <div className="space-y-2">
              {contas.map(c => (
                <button
                  key={c.id}
                  onClick={() => setContaSel(c.id)}
                  className={cn(
                    'w-full border-2 rounded-xl p-4 text-left transition-all flex items-center justify-between',
                    contaSel === c.id ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
                  )}
                >
                  <div>
                    <p className="font-medium text-gray-900">{c.nome}</p>
                    <p className="text-sm text-gray-500">Conta: {c.numero} · {c.tipo}</p>
                  </div>
                  <p className="font-bold text-gray-900">{fmtBRL(c.saldo)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Seleção de caso */}
          <div>
            <label className="label">Caso processual</label>
            <select
              className="input"
              value={caseId}
              onChange={e => setCaseId(e.target.value)}
            >
              <option value="">Selecione o caso...</option>
              {casos.map(c => (
                <option key={c.id} value={c.id}>
                  {c.processo ?? c.id} — {c.requerente} vs {c.requerido}
                </option>
              ))}
            </select>
          </div>

          {/* Período */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Data início (opcional)</label>
              <input type="date" className="input" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
            </div>
            <div>
              <label className="label">Data fim (opcional)</label>
              <input type="date" className="input" value={dataFim} onChange={e => setDataFim(e.target.value)} />
            </div>
          </div>

          <button onClick={importar} disabled={loading || !contaSel || !caseId} className="btn-primary w-full">
            <Download className="w-4 h-4 inline mr-2" />
            Importar transações
          </button>
        </div>
      )}

      {/* Etapa: Importando */}
      {etapa === 'importando' && (
        <div className="card text-center py-12">
          <RefreshCw className="w-12 h-12 text-brand-500 mx-auto mb-4 animate-spin" />
          <h2 className="text-lg font-semibold text-gray-900">Importando transações...</h2>
          <p className="text-gray-500 text-sm mt-2">Buscando dados via Open Finance Brasil</p>
        </div>
      )}

      {/* Etapa: Concluído */}
      {etapa === 'concluido' && resultado && (
        <div className="card text-center py-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Importação concluída!</h2>

          <div className="grid grid-cols-3 gap-4 my-6">
            <div className="bg-gray-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-gray-900">{resultado.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-green-700">{resultado.creditos}</p>
              <p className="text-xs text-green-600">Créditos</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-2xl font-bold text-red-700">{resultado.debitos}</p>
              <p className="text-xs text-red-600">Débitos</p>
            </div>
          </div>

          <p className="text-sm text-gray-500 mb-6">
            Banco: <strong>{resultado.banco}</strong> · Conta: <strong>{resultado.numero}</strong>
          </p>

          <div className="flex gap-3 justify-center">
            <button onClick={() => setEtapa('inicio')} className="btn-secondary">
              Nova importação
            </button>
            <a href="/dashboard/cases" className="btn-primary">
              Ver casos →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
