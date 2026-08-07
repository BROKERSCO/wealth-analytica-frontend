'use client'
// src/app/dashboard/cases/page.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { casesApi } from '@/lib/api'
import { Case } from '@/types'
import { cn, fmtDate, STATUS_CASE, TIPO_CASE } from '@/lib/utils'
import { Plus, Search, FolderOpen, ChevronRight } from 'lucide-react'
import NovoCaseModal from '@/components/forms/NovoCaseModal'

export default function CasesPage() {
  const [cases,   setCases]   = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [busca,   setBusca]   = useState('')
  const [modal,   setModal]   = useState(false)

  const carregar = async () => {
    try {
      const { data } = await casesApi.listar()
      setCases(data.cases)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { carregar() }, [])

  const filtrados = cases.filter(c =>
    c.requerente.toLowerCase().includes(busca.toLowerCase()) ||
    c.requerido.toLowerCase().includes(busca.toLowerCase()) ||
    c.numero.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div className="p-8">

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Casos</h1>
          <p className="text-gray-500 text-sm mt-1">{cases.length} caso(s) cadastrado(s)</p>
        </div>
        <button onClick={() => setModal(true)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Novo caso
        </button>
      </div>

      {/* Busca */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Buscar por número, requerente ou requerido..."
          value={busca}
          onChange={e => setBusca(e.target.value)}
        />
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
        </div>
      ) : filtrados.length === 0 ? (
        <div className="text-center py-20">
          <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Nenhum caso encontrado</p>
          <button onClick={() => setModal(true)} className="btn-primary mt-4">
            Criar primeiro caso
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrados.map(caso => {
            const st = STATUS_CASE[caso.status]
            return (
              <Link
                key={caso.id}
                href={`/dashboard/cases/${caso.id}`}
                className="card flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer group"
              >
                {/* Número */}
                <div className="w-28 shrink-0">
                  <p className="text-xs text-gray-400 font-mono">{caso.numero}</p>
                  <span className={cn('badge mt-1', st.color)}>{st.label}</span>
                </div>

                {/* Partes */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{caso.requerente}</p>
                  <p className="text-sm text-gray-500 truncate">vs. {caso.requerido}</p>
                </div>

                {/* Tipo */}
                <div className="hidden md:block w-44 shrink-0">
                  <p className="text-sm text-gray-600">{TIPO_CASE[caso.tipo] ?? caso.tipo}</p>
                </div>

                {/* Contadores */}
                <div className="hidden md:flex gap-4 shrink-0 text-sm text-gray-500">
                  <span>{caso._count?.transacoes ?? 0} parcelas</span>
                  <span>{caso._count?.laudos ?? 0} laudo(s)</span>
                </div>

                {/* Data */}
                <div className="shrink-0 text-right">
                  <p className="text-xs text-gray-400">{fmtDate(caso.criadoEm)}</p>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-brand-500 transition-colors ml-auto mt-1" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* Modal novo caso */}
      {modal && (
        <NovoCaseModal
          onClose={() => setModal(false)}
          onSuccess={() => { setModal(false); carregar() }}
        />
      )}
    </div>
  )
}
