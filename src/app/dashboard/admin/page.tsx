'use client'
// src/app/registro/page.tsx

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { BarChart3, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

const schema = z.object({
  nome:        z.string().min(3, 'Nome obrigatório'),
  email:       z.string().email('E-mail inválido'),
  senha:       z.string().min(8, 'Mínimo 8 caracteres'),
  oab:         z.string().optional(),
  titulacao:   z.string().optional(),
  organizacao: z.string().optional(),
  plano:       z.enum(['ANALISTA', 'ESCRITORIO', 'ENTERPRISE']),
  planoTipo:   z.enum(['MENSAL', 'SEMESTRAL', 'ANUAL']),
})

type FormData = z.infer<typeof schema>

const PLANOS = [
  {
    id:          'ANALISTA' as const,
    nome:        'Analista',
    desc:        'Para profissionais autônomos',
    limite:      '30 análises/mês',
    recursos:    ['Conciliação de extratos', 'Laudos básicos', 'Suporte por e-mail'],
  },
  {
    id:          'ESCRITORIO' as const,
    nome:        'Escritório',
    desc:        'Para escritórios e equipes',
    limite:      'Análises ilimitadas',
    recursos:    ['Todos os módulos', 'Até 10 usuários', 'CAAT + Recálculo contratual', 'Chat + e-mail'],
    destaque:    true,
  },
  {
    id:          'ENTERPRISE' as const,
    nome:        'Enterprise',
    desc:        'Para fintechs e cooperativas',
    limite:      'API + White-label',
    recursos:    ['Tudo do Escritório', 'API access', 'White-label', 'Suporte dedicado SLA 4h'],
  },
]

const TIPOS = [
  { id: 'MENSAL' as const,    label: 'Mensal',    desc: 'Cancele quando quiser' },
  { id: 'SEMESTRAL' as const, label: 'Semestral', desc: 'Economia de 10%' },
  { id: 'ANUAL' as const,     label: 'Anual',     desc: 'Economia de 20%' },
]

export default function RegistroPage() {
  const router  = useRouter()
  const [loading, setLoading] = useState(false)
  const [sucesso, setSucesso] = useState(false)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { plano: 'ANALISTA', planoTipo: 'MENSAL' },
  })

  const planoSel = watch('plano')
  const tipoSel  = watch('planoTipo')

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await api.post('/api/auth/registro', data)
      setSucesso(true)
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao realizar cadastro')
    } finally {
      setLoading(false)
    }
  }

  if (sucesso) {
    return (
      <div className="min-h-screen bg-brand-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Cadastro realizado!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Seu cadastro foi enviado para aprovação. Você receberá um e-mail quando for aprovado pela equipe Wealth Analytica.
          </p>
          <Link href="/login" className="btn-primary w-full block text-center">
            Voltar para o login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-700 py-12 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-brand-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">Wealth Analytica</span>
          </div>
          <p className="text-brand-100 text-sm">Crie sua conta e solicite acesso à plataforma</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">

          {/* Seletor de plano */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Escolha seu plano</h2>
          <div className="grid grid-cols-3 gap-3 mb-6">
            {PLANOS.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setValue('plano', p.id)}
                className={cn(
                  'border-2 rounded-xl p-4 text-left transition-all',
                  planoSel === p.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-300',
                  p.destaque && planoSel !== p.id && 'border-brand-200'
                )}
              >
                {p.destaque && (
                  <span className="badge badge-blue text-xs mb-2 block w-fit">Mais popular</span>
                )}
                <p className="font-semibold text-gray-900 text-sm">{p.nome}</p>
                <p className="text-xs text-gray-500 mb-2">{p.desc}</p>
                <p className="text-xs font-medium text-brand-600">{p.limite}</p>
                <ul className="mt-2 space-y-1">
                  {p.recursos.map(r => (
                    <li key={r} className="text-xs text-gray-500 flex items-center gap-1">
                      <Check className="w-3 h-3 text-green-500 shrink-0" /> {r}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>

          {/* Tipo de cobrança */}
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Período de cobrança</h3>
          <div className="flex gap-3 mb-6">
            {TIPOS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setValue('planoTipo', t.id)}
                className={cn(
                  'flex-1 border-2 rounded-lg p-3 text-center transition-all',
                  tipoSel === t.id
                    ? 'border-brand-500 bg-brand-50'
                    : 'border-gray-200 hover:border-brand-300'
                )}
              >
                <p className="font-medium text-sm text-gray-900">{t.label}</p>
                <p className="text-xs text-gray-500">{t.desc}</p>
              </button>
            ))}
          </div>

          <hr className="border-gray-100 mb-6" />

          {/* Formulário */}
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Seus dados</h2>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="label">Nome completo</label>
                <input className="input" placeholder="Dr. João da Silva" {...register('nome')} />
                {errors.nome && <p className="text-red-500 text-xs mt-1">{errors.nome.message}</p>}
              </div>
              <div>
                <label className="label">E-mail profissional</label>
                <input type="email" className="input" placeholder="joao@escritorio.com.br" {...register('email')} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="label">Senha</label>
                <input type="password" className="input" placeholder="Mínimo 8 caracteres" {...register('senha')} />
                {errors.senha && <p className="text-red-500 text-xs mt-1">{errors.senha.message}</p>}
              </div>
              <div>
                <label className="label">OAB / CFC (opcional)</label>
                <input className="input" placeholder="OAB/SP 000.000" {...register('oab')} />
              </div>
              <div>
                <label className="label">Organização (opcional)</label>
                <input className="input" placeholder="Nome do escritório" {...register('organizacao')} />
              </div>
              <div className="col-span-2">
                <label className="label">Titulação (opcional)</label>
                <input className="input" placeholder="ex: Mestre em Direito Econômico (FGV)" {...register('titulacao')} />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading ? 'Enviando cadastro...' : 'Solicitar acesso'}
            </button>

            <p className="text-center text-sm text-gray-500">
              Já tem conta?{' '}
              <Link href="/login" className="text-brand-500 hover:underline font-medium">
                Entrar
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
