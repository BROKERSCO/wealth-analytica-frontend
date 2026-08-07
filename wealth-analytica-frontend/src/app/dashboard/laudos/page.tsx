'use client'
// src/app/dashboard/laudos/page.tsx

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { laudosApi } from '@/lib/api'
import { Laudo } from '@/types'
import { cn, fmtDate, STATUS_LAUDO } from '@/lib/utils'
import {
  FileText, Download, Shield, CheckCircle,
  XCircle, Clock, ChevronRight
} from 'lucide-react'

export default function LaudosPage() {
  const searchParams = useSearchParams()
  const highlightId  = searchParams.get('id')

  const [laudos,  setLaudos]  = useState<Laudo[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Laudo | null>(null)

  useEffect(() => {
    // Busca laudos recentes dos casos — simplificado
    // Em produção: endpoint /api/laudos com paginação global
    setLoading(false)
  }, [])

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'CONCLUIDO') return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === 'FALHOU')    return <XCircle     className="w-5 h-5 text-red-500" />
    return <Clock className="w-5 h-5 text-amber-500" />
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Laudos</h1>
        <p className="text-gray-500 text-sm mt-1">
          Acesse os laudos pelos casos ou cole um ID abaixo para verificar autenticidade.
        </p>
      </div>

      {/* Verificador de autenticidade */}
      <div className="card mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-brand-500" />
          <h2 className="font-semibold text-gray-900">Verificar Autenticidade</h2>
        </div>
        <VerificadorLaudo highlightId={highlightId} />
      </div>

      {/* Instrução */}
      <div className="card bg-brand-50 border-brand-200">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-brand-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-medium text-brand-700">Acessar laudos por caso</p>
            <p className="text-sm text-brand-600 mt-1">
              Os laudos são gerados dentro de cada caso. Acesse{' '}
              <Link href="/dashboard/cases" className="underline font-medium">Casos</Link>
              {' '}→ selecione um caso → clique em "Gerar Laudo".
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente de verificação ────────────────────────────────────────────────
function VerificadorLaudo({ highlightId }: { highlightId: string | null }) {
  const [id,       setId]       = useState(highlightId ?? '')
  const [resultado, setResultado] = useState<any>(null)
  const [loading,  setLoading]  = useState(false)
  const [erro,     setErro]     = useState('')

  const verificar = async () => {
    if (!id.trim()) return
    setLoading(true)
    setErro('')
    setResultado(null)
    try {
      const { data } = await laudosApi.buscar(id.trim())
      setResultado(data)
    } catch {
      setErro('Laudo não encontrado. Verifique o ID informado.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (highlightId) verificar()
  }, [highlightId])

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <input
          className="input flex-1"
          placeholder="Cole o ID do laudo ou o hash SHA-256..."
          value={id}
          onChange={e => setId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && verificar()}
        />
        <button onClick={verificar} disabled={loading} className="btn-primary px-6">
          {loading ? 'Verificando...' : 'Verificar'}
        </button>
      </div>

      {erro && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {erro}
        </div>
      )}

      {resultado && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-xl space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="font-semibold text-green-800">Laudo autêntico e válido</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: 'Número', value: resultado.numero },
              { label: 'Status', value: resultado.status },
              { label: 'Perito', value: resultado.case?.requerente ?? '—' },
              { label: 'Gerado em', value: resultado.geradoEm ? fmtDate(resultado.geradoEm) : '—' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-green-600 text-xs">{label}</p>
                <p className="font-medium text-green-900">{value}</p>
              </div>
            ))}
          </div>
          <div>
            <p className="text-green-600 text-xs mb-1">Hash SHA-256</p>
            <p className="font-mono text-xs text-green-800 break-all">{resultado.hashDocumento}</p>
          </div>
          {resultado.storageUrl && (
            <a
              href={resultado.storageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary text-sm inline-flex items-center gap-2 mt-2"
            >
              <Download className="w-4 h-4" /> Baixar PDF
            </a>
          )}
        </div>
      )}
    </div>
  )
}
