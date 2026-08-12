'use client'
// src/app/dashboard/novo-laudo/page.tsx

import { useState, useRef } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useRouter } from 'next/navigation'
import {
  Upload, FileText, CheckCircle, ChevronRight,
  Edit3, Zap, ArrowRight, RotateCcw, Plus, X
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

const CONTRATO_VAZIO: DadosContrato = {
  numero: '', data: '', valorBruto: 0, prazoMeses: 0,
  taxaNominal: 0, sistema: 'SAC', nomeBanco: '', cnpjBanco: '',
  iofContrato: 0, tarifaCadastro: 0, fonte: 'Preenchimento manual', confianca: 0,
}

export default function NovoLaudoPage() {
  const router  = useRouter()
  const [etapa, setEtapa] = useState<Etapa>('upload')

  // Arquivos
  const contratoRef = useRef<HTMLInputElement>(null)
  const extratoRef  = useRef<HTMLInputElement>(null)
  const [contratoFile,   setContratoFile]   = useState<File | null>(null)
  const [extratoFiles,   setExtratoFiles]   = useState<File[]>([])

  // Dados extraídos
  const [contrato,       setContrato]       = useState<DadosContrato>(CONTRATO_VAZIO)
  const [lancamentos,    setLancamentos]    = useState<Lancamento[]>([])
  const [bancoExtrato,   setBancoExtrato]   = useState('')
  const [modoManual,     setModoManual]     = useState(false)

  // Dados do caso
  const [requerente, setRequerente] = useState('')
  const [requerido,  setRequerido]  = useState('')
  const [processo,   setProcesso]   = useState('')
  const [vara,       setVara]       = useState('')
  const [peritoNome, setPeritoNome] = useState('')
  const [peritoOab,  setPeritoOab]  = useState('')

  // Loading
  const [loading,          setLoading]         = useState(false)
  const [loadingContrato,  setLoadingContrato]  = useState(false)
  const [loadingExtrato,   setLoadingExtrato]   = useState(false)
  const [caseId,           setCaseId]           = useState('')

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
      setModoManual(false)
      toast.success(`Contrato lido! Confiança: ${data.confianca}%`)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao ler contrato — preencha manualmente')
      setModoManual(true)
      setContratoFile(null)
    } finally {
      setLoadingContrato(false)
    }
  }

  // ─── Upload e parse de múltiplos extratos ──────────────────────────────────
  const handleExtrato = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    setLoadingExtrato(true)
    let todosLancamentos: Lancamento[] = [...lancamentos]
    let bancos: string[] = []

    for (const file of files) {
      try {
        const form = new FormData()
        form.append('file', file)
        const { data } = await api.post('/api/laudos/parse-extrato', form, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
        todosLancamentos = [...todosLancamentos, ...data.lancamentos]
        bancos.push(data.banco)
        setExtratoFiles(prev => [...prev, file])
      } catch (err: any) {
        toast.error(`Erro ao ler ${file.name}: ${err.response?.data?.error ?? err.message}`)
      }
    }

    // Ordena por data
    todosLancamentos.sort((a, b) => {
      const [da, ma, ya] = a.data.split('/')
      const [db, mb, yb] = b.data.split('/')
      return new Date(`${ya}-${ma}-${da}`).getTime() - new Date(`${yb}-${mb}-${db}`).getTime()
    })

    setLancamentos(todosLancamentos)
    setBancoExtrato([...new Set(bancos)].join(', '))
    toast.success(`${todosLancamentos.length} lançamentos no total!`)
    setLoadingExtrato(false)
  }

  // ─── Remove extrato ─────────────────────────────────────────────────────────
  const removerExtrato = (index: number) => {
    setExtratoFiles(prev => prev.filter((_, i) => i !== index))
    // Reprocessa sem esse arquivo (simplificado — zera e pede novo upload)
    toast.info('Reenvie os extratos desejados')
    setLancamentos([])
    setExtratoFiles([])
  }

  // ─── Avança para revisão ────────────────────────────────────────────────────
  const avancarRevisao = () => {
    if (!lancamentos.length) { toast.error('Faça upload de pelo menos um extrato'); return }
    setEtapa('revisao')
  }

  // ─── Valida contrato ────────────────────────────────────────────────────────
  const contratoValido = () => {
    return contrato.valorBruto > 0 && contrato.prazoMeses > 0 && contrato.taxaNominal > 0
  }

  // ─── Gera laudo ─────────────────────────────────────────────────────────────
  const gerarLaudo = async () => {
    if (!requerente || !requerido) { toast.error('Preencha requerente e requerido'); return }
    if (!peritoNome) { toast.error('Preencha o nome do perito'); return }
    if (!contratoValido()) { toast.error('Preencha os dados do contrato (valor, prazo e taxa são obrigatórios)'); return }

    setLoading(true)
    setEtapa('gerando')

    try {
      const { data: casoData } = await api.post('/api/laudos/gerar-rapido', {
        requerente, requerido, processo, vara,
        contrato,
        lancamentos,
        peritoNome, peritoOab,
      })

      await api.post('/api/laudos', {
        caseId:    casoData.caseId,
        peritoNome,
        peritoOab,
      })

      setCaseId(casoData.caseId)
      setEtapa('concluido')
      toast.success('Laudo gerado com sucesso!')
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao gerar laudo')
      setEtapa('caso')
    } finally {
      setLoading(false)
    }
  }

  const fmtBRL  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8 max-w-3xl mx-auto">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Zap className="w-6 h-6 text-amber-500" /> Novo Laudo Rápido
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Envie o extrato (obrigatório) e o contrato (opcional) — o sistema lê os arquivos e gera o laudo automaticamente
        </p>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { id: 'upload',    label: '1. Upload' },
          { id: 'revisao',   label: '2. Revisão' },
          { id: 'caso',      label: '3. Dados' },
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

          {/* Upload Extrato — OBRIGATÓRIO */}
          <div className="card border-2 border-brand-200 bg-brand-50">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-brand-700 flex items-center gap-2">
                <Upload className="w-4 h-4" /> Extrato bancário <span className="text-red-500">*</span>
              </h3>
              <label className={cn(
                'btn-primary text-xs px-3 py-1.5 cursor-pointer',
                loadingExtrato && 'opacity-50 pointer-events-none'
              )}>
                <input ref={extratoRef} type="file" accept=".pdf,.ofx,.csv,.qfx"
                  multiple className="hidden" onChange={handleExtrato} />
                {loadingExtrato ? 'Processando...' : '+ Adicionar extrato'}
              </label>
            </div>

            {extratoFiles.length === 0 ? (
              <p className="text-sm text-brand-600">
                Aceita PDF, OFX e CSV. Pode adicionar múltiplos extratos de períodos diferentes.
              </p>
            ) : (
              <div className="space-y-2">
                {extratoFiles.map((f, i) => (
                  <div key={i} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm text-gray-700">{f.name}</span>
                    </div>
                    <button onClick={() => removerExtrato(i)} className="text-gray-400 hover:text-red-500">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                <p className="text-xs text-brand-600 mt-2">
                  ✓ {lancamentos.length} lançamentos encontrados — {bancoExtrato}
                </p>
              </div>
            )}
          </div>

          {/* Upload Contrato — OPCIONAL */}
          <div className="card border-2 border-dashed border-gray-200">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-700 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Contrato bancário
                <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">opcional</span>
              </h3>
              {!modoManual && !contratoFile && (
                <label className="btn-secondary text-xs px-3 py-1.5 cursor-pointer">
                  <input ref={contratoRef} type="file" accept=".pdf" className="hidden" onChange={handleContrato} />
                  {loadingContrato ? 'Lendo...' : 'Upload PDF'}
                </label>
              )}
            </div>

            {loadingContrato && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <div className="animate-spin w-4 h-4 border-2 border-brand-500 border-t-transparent rounded-full" />
                Extraindo dados do contrato...
              </div>
            )}

            {contratoFile && contrato.confianca > 0 && (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" /> {contratoFile.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Contrato {contrato.numero} — {fmtBRL(contrato.valorBruto)} — {contrato.prazoMeses} meses
                  </p>
                </div>
                <span className={cn('text-xs px-2 py-1 rounded-full',
                  contrato.confianca >= 70 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                )}>
                  {contrato.confianca}% confiança
                </span>
              </div>
            )}

            {!contratoFile && !modoManual && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Se não tiver o PDF, preencha os dados manualmente na próxima etapa
                </p>
                <button onClick={() => setModoManual(true)} className="text-xs text-brand-500 hover:underline">
                  Preencher manualmente
                </button>
              </div>
            )}

            {modoManual && (
              <p className="text-sm text-amber-600 flex items-center gap-2">
                <Edit3 className="w-4 h-4" /> Você preencherá os dados do contrato manualmente na próxima etapa
              </p>
            )}
          </div>

          <button
            onClick={avancarRevisao}
            disabled={!lancamentos.length}
            className="btn-primary w-full"
          >
            Revisar dados <ArrowRight className="w-4 h-4 inline ml-2" />
          </button>
        </div>
      )}

      {/* ─── Etapa 2: Revisão ─── */}
      {etapa === 'revisao' && (
        <div className="space-y-4">
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-brand-500" />
              Dados do Contrato {modoManual && <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">preenchimento manual</span>}
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
                <label className="label">Valor financiado (R$) *</label>
                <input className="input" type="number" value={contrato.valorBruto || ''}
                  placeholder="Ex: 50000"
                  onChange={e => setContrato({...contrato, valorBruto: parseFloat(e.target.value) || 0})} />
              </div>
              <div>
                <label className="label">Prazo (meses) *</label>
                <input className="input" type="number" value={contrato.prazoMeses || ''}
                  placeholder="Ex: 36"
                  onChange={e => setContrato({...contrato, prazoMeses: parseInt(e.target.value) || 0})} />
              </div>
              <div>
                <label className="label">Taxa nominal mensal (%) *</label>
                <input className="input" type="number" step="0.0001"
                  placeholder="Ex: 3.89"
                  value={contrato.taxaNominal > 0 ? (contrato.taxaNominal * 100).toFixed(4) : ''}
                  onChange={e => setContrato({...contrato, taxaNominal: parseFloat(e.target.value) / 100 || 0})} />
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
                  placeholder="Ex: Banco Bradesco S.A."
                  onChange={e => setContrato({...contrato, nomeBanco: e.target.value})} />
              </div>
              <div>
                <label className="label">CNPJ do banco</label>
                <input className="input" value={contrato.cnpjBanco}
                  placeholder="00.000.000/0000-00"
                  onChange={e => setContrato({...contrato, cnpjBanco: e.target.value})} />
              </div>
            </div>

            {!contratoValido() && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-700">
                ⚠️ Preencha os campos obrigatórios: Valor financiado, Prazo e Taxa nominal
              </div>
            )}
          </div>

          {/* Resumo do extrato */}
          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">
              Extrato — {lancamentos.length} lançamentos ({bancoExtrato})
            </h3>
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
              <RotateCcw className="w-4 h-4" /> Voltar
            </button>
            <button
              onClick={() => setEtapa('caso')}
              disabled={!contratoValido()}
              className="btn-primary flex-1"
            >
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
            <button onClick={() => setEtapa('revisao')} className="btn-secondary">Voltar</button>
            <button onClick={gerarLaudo} disabled={loading} className="btn-primary flex-1">
              <Zap className="w-4 h-4 inline mr-2" /> Gerar laudo agora!
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
          <p className="text-gray-500 text-sm mb-8">O laudo está disponível para download e assinatura.</p>
          <div className="flex gap-3 justify-center">
            <button onClick={() => {
              setEtapa('upload'); setContrato(CONTRATO_VAZIO)
              setLancamentos([]); setContratoFile(null)
              setExtratoFiles([]); setModoManual(false)
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
