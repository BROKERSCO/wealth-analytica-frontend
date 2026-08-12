'use client'
// src/app/dashboard/novo-laudo/page.tsx

import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, CheckCircle, ChevronRight,
  AlertCircle, Edit3, Zap, ArrowRight, RotateCcw
} from 'lucide-react'

type Etapa = 'upload' | 'revisao' | 'caso' | 'gerando' | 'concluido'

interface DadosContrato {
  numero:         string
  data:           string
  valorBruto:     number
  prazoMeses:     number
  taxaNominal:    number
  sistema:        string
  nomeBanco:      string
  cnpjBanco:      string
  iofContrato:    number
  tarifaCadastro: number
  fonte:          string
  confianca:      number
}

interface Lancamento {
  data:      string
  descricao: string
  valor:     number
  saldo:     number
  tipo:      string
}

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtPerc = (v: number) => `${(v * 100).toFixed(4).replace('.', ',')}%`

export default function NovoLaudoPage() {
  const router  = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('upload')

  // Arquivos
  const contratoRef = useRef<HTMLInputElement>(null)
  const extratoRef  = useRef<HTMLInputElement>(null)
  const [contratoFile, setContratoFile] = useState<File | null>(null)
  const [extratoFile,  setExtratoFile]  = useState<File | null>(null)

  // Dados extraídos
  const [contrato,     setContrato]     = useState<DadosContrato | null>(null)
  const [lancamentos,  setLancamentos]  = useState<Lancamento[]>([])
  const [bancoExtrato, setBancoExtrato] = useState('')

  // Dados do caso
  const [requerente, setRequerente] = useState('')
  const [requerido,  setRequerido]  = useState('')
  const [processo,   setProcesso]   = useState('')
  const [vara,       setVara]       = useState('')
  const [peritoNome, setPeritoNome] = useState('')
  const [peritoOab,  setPeritoOab]  = useState('')

  // Loading
  const [loading,        setLoading]        = useState(false)
  const [loadingContrato, setLoadingContrato] = useState(false)
  const [loadingExtrato,  setLoadingExtrato]  = useState(false)
  const [caseId,         setCaseId]         = useState('')

  // ─── Upload e parse do contrato ────────────────────────────────────────────
  const handleContrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setContratoFile(file)
    setLoadingContrato(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/api/laudos/parse-contrato', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setContrato(data.contrato)
      toast.success(`Contrato lido! Confiança: ${data.confianca}%`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao ler contrato')
      setContratoFile(null)
    } finally {
      setLoadingContrato(false)
    }
  }

  // ─── Upload e parse do extrato ─────────────────────────────────────────────
  const handleExtrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setExtratoFile(file)
    setLoadingExtrato(true)

    try {
      const form = new FormData()
      form.append('file', file)
      const { data } = await api.post('/api/laudos/parse-extrato', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setLancamentos(data.lancamentos)
      setBancoExtrato(data.banco)
      toast.success(`${data.total} lançamentos encontrados!`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao ler extrato')
      setExtratoFile(null)
    } finally {
      setLoadingExtrato(false)
    }
  }

  // ─── Avança para revisão ────────────────────────────────────────────────────
  const avancarRevisao = () => {
    if (!contrato) { toast.error('Faça upload do contrato'); return }
    if (!lancamentos.length) { toast.error('Faça upload do extrato'); return }
    setEtapa('revisao')
  }

  // ─── Gera laudo rápido ──────────────────────────────────────────────────────
  const gerarLaudo = async () => {
    if (!requerente || !requerido) { toast.error('Preencha requerente e requerido'); return }
    if (!peritoNome) { toast.error('Preencha o nome do perito'); return }

    setLoading(true)
    setEtapa('gerando')

    try {
      // 1. Cria caso com dados
      const { data: casoData } = await api.post('/api/laudos/gerar-rapido', {
        requerente, requerido, processo, vara,
        contrato,
        lancamentos,
        peritoNome, peritoOab,
      })

      // 2. Gera laudo
      const { data: laudoData } = await api.post('/api/laudos', {
        caseId:    casoData.caseId,
        peritoNome,
        peritoOab,
      })

      setCaseId(casoData.caseId)
      setEtapa('concluido')
      toast.success('Laudo gerado com sucesso!')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao gerar laudo')
      setEtapa('revisao')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" /> Novo Laudo Rápido
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Envie o contrato e o extrato — o sistema lê os arquivos e gera o laudo automaticamente
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { id: 'upload',   label: '1. Upload' },
          { id: 'revisao',  label: '2. Revisão' },
          { id: 'caso',     label: '3. Dados' },
          { id: 'concluido', label: '4. Laudo' },
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={cn(
              'px-3 py-1 rounded-full text-xs font-medium',
              etapa === s.id ? 'bg-brand-500 text-white' :
              ['upload','revisao','caso','gerando','concluido'].indexOf(etapa) > i
                ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'
            )}>
              {s.label}
            </div>
            {i < arr.length - 1 && <ChevronRight className="w-4 h-4 text-gray-300" />}
          </div>
        ))}
      </div>

      {/* ─── Etapa 1: Upload ─── */}
      {etapa === 'upload' && (
        <div className="space-y-4">

          {/* Upload Contrato */}
          <div
            onClick={() => contratoRef.current?.click()}
            className={cn(
              'card border-2 border-dashed cursor-pointer transition-all hover:border-brand-400',
              contratoFile ? 'border-green-400 bg-green-50' : 'border-gray-200'
            )}
          >
            <input ref={contratoRef} type="file" accept=".pdf" className="hidden" onChange={handleContrato} />
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                contratoFile ? 'bg-green-100' : 'bg-gray-100'
              )}>
                {loadingContrato ? (
                  <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" />
                ) : contratoFile ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <FileText className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {contratoFile ? contratoFile.name : 'Contrato bancário (PDF)'}
                </p>
                <p className="text-sm text-gray-500">
                  {contrato
                    ? `✓ Contrato ${contrato.numero} — ${fmtBRL(contrato.valorBruto)} — ${contrato.prazoMeses} meses`
                    : 'Clique para selecionar o PDF do contrato'}
                </p>
              </div>
              {contrato && (
                <div className={cn('px-2 py-1 rounded-full text-xs font-medium',
                  contrato.confianca >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {contrato.confianca}% confiança
                </div>
              )}
            </div>
          </div>

          {/* Upload Extrato */}
          <div
            onClick={() => extratoRef.current?.click()}
            className={cn(
              'card border-2 border-dashed cursor-pointer transition-all hover:border-brand-400',
              extratoFile ? 'border-green-400 bg-green-50' : 'border-gray-200'
            )}
          >
            <input ref={extratoRef} type="file" accept=".pdf,.ofx,.csv,.qfx" className="hidden" onChange={handleExtrato} />
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center',
                extratoFile ? 'bg-green-100' : 'bg-gray-100'
              )}>
                {loadingExtrato ? (
                  <div className="animate-spin w-5 h-5 border-2 border-brand-500 border-t-transparent rounded-full" />
                ) : extratoFile ? (
                  <CheckCircle className="w-6 h-6 text-green-600" />
                ) : (
                  <Upload className="w-6 h-6 text-gray-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">
                  {extratoFile ? extratoFile.name : 'Extrato bancário (PDF, OFX ou CSV)'}
                </p>
                <p className="text-sm text-gray-500">
                  {lancamentos.length > 0
                    ? `✓ ${lancamentos.length} lançamentos encontrados — Banco: ${bancoExtrato}`
                    : 'Clique para selecionar o extrato'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={avancarRevisao}
            disabled={!contrato || !lancamentos.length}
            className="btn-primary w-full"
          >
            Revisar dados extraídos <ArrowRight className="w-4 h-4 inline ml-2" />
          </button>
        </div>
      )}

      {/* ─── Etapa 2: Revisão ─── */}
      {etapa === 'revisao' && contrato && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-brand-500" /> Dados do Contrato — revise e corrija se necessário
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Número do contrato</label>
                <input className="input" value={contrato.numero}
                  onChange={e => setContrato({...contrato, numero: e.target.value})} />
              </div>
              <div>
                <label className="label">Data de contratação</label>
                <input className="input" placeholder="DD/MM/AAAA" value={contrato.data}
                  onChange={e => setContrato({...contrato, data: e.target.value})} />
              </div>
              <div>
                <label className="label">Valor financiado (R$)</label>
                <input className="input" type="number" value={contrato.valorBruto}
                  onChange={e => setContrato({...contrato, valorBruto: parseFloat(e.target.value)})} />
              </div>
              <div>
                <label className="label">Prazo (meses)</label>
                <input className="input" type="number" value={contrato.prazoMeses}
                  onChange={e => setContrato({...contrato, prazoMeses: parseInt(e.target.value)})} />
              </div>
              <div>
                <label className="label">Taxa nominal mensal (%)</label>
                <input className="input" type="number" step="0.0001"
                  value={(contrato.taxaNominal * 100).toFixed(4)}
                  onChange={e => setContrato({...contrato, taxaNominal: parseFloat(e.target.value) / 100})} />
              </div>
              <div>
                <label className="label">Sistema de amortização</label>
                <select className="input" value={contrato.sistema}
                  onChange={e => setContrato({...contrato, sistema: e.target.value})}>
                  <option value="SAC">SAC</option>
                  <option value="PRICE">PRICE (Tabela Price)</option>
                  <option value="SAM">SAM</option>
                  <option value="SACRE">SACRE</option>
                </select>
              </div>
              <div>
                <label className="label">Nome do banco</label>
                <input className="input" value={contrato.nomeBanco}
                  onChange={e => setContrato({...contrato, nomeBanco: e.target.value})} />
              </div>
              <div>
                <label className="label">CNPJ do banco</label>
                <input className="input" value={contrato.cnpjBanco}
                  onChange={e => setContrato({...contrato, cnpjBanco: e.target.value})} />
              </div>
            </div>
          </div>

          {/* Resumo do extrato */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Extrato — {lancamentos.length} lançamentos</h3>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {lancamentos.slice(0, 10).map((l, i) => (
                <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-gray-50">
                  <span className="text-gray-500 w-24 shrink-0">{l.data}</span>
                  <span className="flex-1 text-gray-700 truncate">{l.descricao}</span>
                  <span className={cn('font-medium ml-2', l.valor > 0 ? 'text-green-600' : 'text-red-600')}>
                    {fmtBRL(Math.abs(l.valor))}
                  </span>
                </div>
              ))}
              {lancamentos.length > 10 && (
                <p className="text-xs text-gray-400 text-center pt-2">
                  + {lancamentos.length - 10} lançamentos não exibidos
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEtapa('upload')} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Refazer upload
            </button>
            <button onClick={() => setEtapa('caso')} className="btn-primary flex-1">
              Dados do caso <ArrowRight className="w-4 h-4 inline ml-2" />
            </button>
          </div>
        </div>
      )}

      {/* ─── Etapa 3: Dados do caso ─── */}
      {etapa === 'caso' && (
        <div className="card space-y-4">
          <h3 className="font-semibold text-gray-900">Dados do processo e do perito</h3>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="label">Requerente *</label>
              <input className="input" placeholder="Nome do cliente/autor" value={requerente}
                onChange={e => setRequerente(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Requerido *</label>
              <input className="input" placeholder="Nome do banco réu" value={requerido}
                onChange={e => setRequerido(e.target.value)} />
            </div>
            <div>
              <label className="label">Número do processo</label>
              <input className="input" placeholder="0000000-00.0000.0.00.0000" value={processo}
                onChange={e => setProcesso(e.target.value)} />
            </div>
            <div>
              <label className="label">Vara</label>
              <input className="input" placeholder="Ex: 3ª Vara Cível" value={vara}
                onChange={e => setVara(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">Nome do perito *</label>
              <input className="input" placeholder="Dr. Nome Completo" value={peritoNome}
                onChange={e => setPeritoNome(e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className="label">OAB / CFC</label>
              <input className="input" placeholder="OAB/SP 000.000" value={peritoOab}
                onChange={e => setPeritoOab(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEtapa('revisao')} className="btn-secondary">
              Voltar
            </button>
            <button onClick={gerarLaudo} disabled={loading} className="btn-primary flex-1">
              <Zap className="w-4 h-4 inline mr-2" />
              Gerar laudo agora!
            </button>
          </div>
        </div>
      )}

      {/* ─── Etapa: Gerando ─── */}
      {etapa === 'gerando' && (
        <div className="card text-center py-16">
          <div className="animate-spin w-16 h-16 border-4 border-brand-500 border-t-transparent rounded-full mx-auto mb-6" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Gerando laudo...</h2>
          <p className="text-gray-500 text-sm">Calculando divergências e montando o documento</p>
        </div>
      )}

      {/* ─── Etapa: Concluído ─── */}
      {etapa === 'concluido' && (
        <div className="card text-center py-12">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Laudo gerado! 🎉</h2>
          <p className="text-gray-500 text-sm mb-8">
            O laudo foi gerado e está disponível para download e assinatura.
          </p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => {
              setEtapa('upload')
              setContrato(null)
              setLancamentos([])
              setContratoFile(null)
              setExtratoFile(null)
            }} className="btn-secondary">
              Novo laudo
            </button>
            <button onClick={() => router.push(`/dashboard/cases/${caseId}`)} className="btn-primary">
              Ver o caso →
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
