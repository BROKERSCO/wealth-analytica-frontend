'use client'
// src/app/dashboard/perfil/page.tsx

import { useAuth } from '@/lib/auth-context'
import { cn } from '@/lib/utils'
import { User, Shield, CreditCard, FileText } from 'lucide-react'

const PLANO_INFO: Record<string, { nome: string; cor: string; limite: string }> = {
  ANALISTA:   { nome: 'Analista',   cor: 'bg-blue-100 text-blue-700',   limite: '30 análises/mês' },
  ESCRITORIO: { nome: 'Escritório', cor: 'bg-purple-100 text-purple-700', limite: 'Ilimitado' },
  ENTERPRISE: { nome: 'Enterprise', cor: 'bg-amber-100 text-amber-700',  limite: 'API + White-label' },
}

const TIPO_INFO: Record<string, string> = {
  MENSAL:    'Mensal',
  SEMESTRAL: 'Semestral',
  ANUAL:     'Anual',
}

export default function PerfilPage() {
  const { user } = useAuth()

  if (!user) return null

  const plano = PLANO_INFO[user.plano] ?? PLANO_INFO['ANALISTA']

  return (
    <div className="p-8 max-w-3xl mx-auto">

      <h1 className="text-2xl font-bold text-gray-900 mb-8">Meu Perfil</h1>

      {/* Card do usuário */}
      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center">
            <span className="text-brand-700 font-bold text-2xl">
              {user.nome.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.nome}</h2>
            <p className="text-gray-500">{user.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={cn('badge text-xs', plano.cor)}>{plano.nome}</span>
              <span className="badge bg-gray-100 text-gray-600 text-xs">{user.perfil}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {user.oab && (
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Shield className="w-3 h-3" /> OAB / CFC
              </p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{user.oab}</p>
            </div>
          )}
          {(user as any).titulacao && (
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <FileText className="w-3 h-3" /> Titulação
              </p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{(user as any).titulacao}</p>
            </div>
          )}
          {(user as any).organizacao && (
            <div>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <User className="w-3 h-3" /> Organização
              </p>
              <p className="text-sm font-medium text-gray-900 mt-0.5">{(user as any).organizacao}</p>
            </div>
          )}
        </div>
      </div>

      {/* Plano atual */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <CreditCard className="w-5 h-5 text-brand-500" />
          <h3 className="font-semibold text-gray-900">Plano atual</h3>
        </div>

        <div className="flex items-center justify-between p-4 bg-brand-50 rounded-xl border border-brand-200">
          <div>
            <p className="font-bold text-brand-700 text-lg">{plano.nome}</p>
            <p className="text-sm text-brand-600">{plano.limite}</p>
            <p className="text-xs text-brand-400 mt-1">
              Cobrança {TIPO_INFO[(user as any).planoTipo] ?? 'Mensal'}
            </p>
          </div>
          <span className={cn('badge text-sm px-4 py-2', plano.cor)}>
            Ativo
          </span>
        </div>

        <p className="text-xs text-gray-400 mt-3">
          Para alterar seu plano, entre em contato com o suporte: suporte@wealthanalytica.com.br
        </p>
      </div>
    </div>
  )
}
