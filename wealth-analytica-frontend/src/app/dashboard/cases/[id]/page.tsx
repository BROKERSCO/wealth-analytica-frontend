'use client'
// src/app/dashboard/cases/[id]/page.tsx

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { casesApi, transactionsApi, documentsApi, laudosApi } from '@/lib/api'
import { useAuth } from '@/lib/auth-context'
import { Case, Transaction, Laudo } from '@/types'
import { cn, fmtBRL, fmtDate, fmtPerc, STATUS_CASE, STATUS_LAUDO } from '@/lib/utils'
import { toast } from 'sonner'
import {
  ArrowLeft, Upload, FileText, RefreshCw,
  Download, Shield, CheckCircle, AlertTriangle
} from 'lucide-react'

export default function CaseDetailPage() {
  const { id }   = useParams<{ id: string }>()
  const { user } = useAuth()

  const [caso,        setCaso]        = useState<Case | null>(null)
  const [transacoes,  setTransacoes]  = useState<Transaction[]>([])
  const [laudos,      setLaudos]      = useState<Laudo[]>([])
  const [loading,     setLoading]     = useState(true)
  const [uploading,   setUploading]   = useState(false)
  const [gerando,     setGerando]     = useState(false)
  const [dragOver,    setDragOver]    = useState(false)

  const carregar = useCallback(async () => {
    try {
      const [{ data: c }, { data: t }, { data: l }] = await Promise.all([
        casesApi.buscar(id),
        transactionsApi.listar(id),
        laudosApi.listarDoCase(id),
      ])
      setCaso(c.case)
      setTransacoes(t.transacoes)
      setLaudos(l.laudos)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  // Upload do extrato
  const handleUpload = async (file: File) => {
    if (!file) return
    setUploading(true)
    try {
      const { data } = await documentsApi.upload(id, file)
      toast.success(`${data.importados} lançamentos importados!`)
      carregar()
    } catch {
      toast.error('Erro ao importar extrato')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }

  // Gerar laudo
  const gerarLaudo = async () => {
    if (!user) return
    setGerando(true)
    try {
      await laudosApi.gerar({
        caseId:         id,
        peritoNome:     user.nome,
        peritoOab:      user.oab,
        peritoTitulacao: user.titulacao,
      })
      toast.success('Laudo gerado com sucesso!')
      carregar()
    } catch {
      toast.error('Erro ao gerar laudo')
    } finally {
      setGerando(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  if (!caso) return <div className="p-8 text-gray-500">Caso não encontrado</div>

  const contrato = caso.contrato
  const st = STATUS_CASE[caso.status]

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/dashboard/cases" className="hover:text-brand-500 flex items-center gap-1">
          <ArrowLeft className="w-4 h-4" /> Casos
        </Link>
        <span>/</span>
        <span className="text-gray-900 font-medium">{caso.numero}</span>
      </div>

      {/* Header do caso */}
      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="font-mono text-sm text-gray-400">{caso.numero}</span>
              <span className={cn('badge', st.color)}>{st.label}</span>
            </div>
            <h1 className="text-xl font-bold text-gray-900">{caso.requerente}</h1>
            <p className="text-gray-500">vs. {caso.requerido}</p>
          </div>
          <button
            onClick={gerarLaudo}
            disabled={gerando || transacoes.length === 0}
            className="btn-primary flex items-center gap-2"
          >
            {gerando
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Gerando...</>
              : <><FileText className="w-4 h-4" /> Gerar Laudo</>
            }
          </button>
        </div>

        {/* Dados do processo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          {caso.processo && (
            <div>
              <p className="text-xs text-gray-400">Processo</p>
              <p className="text-sm font-medium text-gray-900">{caso.processo}</p>
            </div>
          )}
          {caso.vara && (
            <div>
              <p className="text-xs text-gray-400">Vara</p>
              <p className="text-sm font-medium text-gray-900">{caso.vara}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Criado em</p>
            <p className="text-sm font-medium text-gray-900">{fmtDate(caso.criadoEm)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Contrato */}
        {contrato && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Dados do Contrato</h2>
            <div className="space-y-3">
              {[
                { label: 'Número', value: contrato.numero },
                { label: 'Valor', value: fmtBRL(contrato.valorBruto) },
                { label: 'Prazo', value: `${contrato.prazoMeses} meses` },
                { label: 'Taxa nominal', value: fmtPerc(contrato.taxaNominal) },
                { label: 'Sistema', value: contrato.sistema },
                { label: 'Fonte', value: contrato.fonte },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload de extrato */}
        <div className="card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Extrato Bancário</h2>
            <span className="text-sm text-gray-500">{transacoes.length} lançamento(s)</span>
          </div>

          {/* Drop zone */}
          <div
            onDrop={onDrop}
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            className={cn(
              'border-2 border-dashed rounded-xl p-6 text-center mb-4 transition-colors',
              dragOver ? 'border-brand-500 bg-brand-50' : 'border-gray-200 hover:border-brand-300'
            )}
          >
            <Upload className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-1">
              Arraste um extrato OFX ou CSV aqui
            </p>
            <p className="text-xs text-gray-400 mb-3">ou</p>
            <label className="btn-secondary text-sm cursor-pointer">
              {uploading ? 'Importando...' : 'Selecionar arquivo'}
              <input
                type="file"
                className="hidden"
                accept=".ofx,.qfx,.csv"
                disabled={uploading}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) handleUpload(file)
                }}
              />
            </label>
          </div>

          {/* Tabela de transações */}
          {transacoes.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-gray-500 font-medium">Competência</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Cobrado</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Principal</th>
                    <th className="text-right py-2 text-gray-500 font-medium">Juros</th>
                  </tr>
                </thead>
                <tbody>
                  {transacoes.map(t => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-900">{t.competencia}</td>
                      <td className="py-2 text-right text-gray-700">{fmtBRL(Number(t.valorCobrado))}</td>
                      <td className="py-2 text-right text-gray-500">{fmtBRL(Number(t.principal))}</td>
                      <td className="py-2 text-right text-gray-500">{fmtBRL(Number(t.jurosCobrado))}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-200">
                    <td className="py-2 font-bold text-gray-900">Total</td>
                    <td className="py-2 text-right font-bold text-gray-900">
                      {fmtBRL(transacoes.reduce((s, t) => s + Number(t.valorCobrado), 0))}
                    </td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Laudos gerados */}
      {laudos.length > 0 && (
        <div className="card mt-6">
          <h2 className="font-semibold text-gray-900 mb-4">Laudos Gerados</h2>
          <div className="space-y-3">
            {laudos.map(laudo => {
              const sl = STATUS_LAUDO[laudo.status]
              return (
                <div key={laudo.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white border border-gray-200">
                    {laudo.status === 'CONCLUIDO'
                      ? <CheckCircle className="w-4 h-4 text-green-500" />
                      : <AlertTriangle className="w-4 h-4 text-amber-500" />
                    }
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 font-mono text-sm">{laudo.numero}</span>
                      <span className={cn('badge', sl.color)}>{sl.label}</span>
                    </div>
                    {laudo.geradoEm && (
                      <p className="text-xs text-gray-400 mt-0.5">Gerado em {fmtDate(laudo.geradoEm)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {laudo.storageUrl && (
                      <a
                        href={laudo.storageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-secondary text-sm flex items-center gap-1.5 py-1.5"
                      >
                        <Download className="w-3.5 h-3.5" /> PDF
                      </a>
                    )}
                    <Link
                      href={`/dashboard/laudos?id=${laudo.id}`}
                      className="btn-secondary text-sm flex items-center gap-1.5 py-1.5"
                    >
                      <Shield className="w-3.5 h-3.5" /> Verificar
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
