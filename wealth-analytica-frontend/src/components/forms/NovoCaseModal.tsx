'use client'
// src/components/forms/NovoCaseModal.tsx

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { casesApi } from '@/lib/api'
import { X } from 'lucide-react'

const schema = z.object({
  requerente:  z.string().min(2, 'Obrigatório'),
  requerido:   z.string().min(2, 'Obrigatório'),
  tipo:        z.string().min(1, 'Obrigatório'),
  processo:    z.string().optional(),
  vara:        z.string().optional(),
  // Contrato
  cNumero:     z.string().min(1, 'Obrigatório'),
  cData:       z.string().min(1, 'Obrigatório'),
  cValor:      z.coerce.number().positive('Valor inválido'),
  cPrazo:      z.coerce.number().int().positive('Prazo inválido'),
  cTaxa:       z.coerce.number().positive('Taxa inválida'),
  cSistema:    z.enum(['SAC', 'PRICE', 'SAM', 'SACRE']),
  cFonte:      z.string().min(1, 'Obrigatório'),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose:   () => void
  onSuccess: () => void
}

export default function NovoCaseModal({ onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { cSistema: 'SAC' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      await casesApi.criar({
        tipo:       data.tipo,
        requerente: data.requerente,
        requerido:  data.requerido,
        processo:   data.processo,
        vara:       data.vara,
        contrato: {
          numero:      data.cNumero,
          data:        data.cData,
          valorBruto:  data.cValor,
          prazoMeses:  data.cPrazo,
          taxaNominal: data.cTaxa / 100,
          sistema:     data.cSistema,
          fonte:       data.cFonte,
        },
      })
      toast.success('Caso criado com sucesso!')
      onSuccess()
    } catch {
      toast.error('Erro ao criar caso')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">Novo Caso</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

          {/* Partes */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Partes</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Requerente</label>
                <input className="input" placeholder="Nome do cliente" {...register('requerente')} />
                {errors.requerente && <p className="text-red-500 text-xs mt-1">{errors.requerente.message}</p>}
              </div>
              <div>
                <label className="label">Requerido</label>
                <input className="input" placeholder="Nome do banco / réu" {...register('requerido')} />
                {errors.requerido && <p className="text-red-500 text-xs mt-1">{errors.requerido.message}</p>}
              </div>
              <div>
                <label className="label">Tipo de análise</label>
                <select className="input" {...register('tipo')}>
                  <option value="RECALCULO_CONTRATUAL">Recálculo Contratual</option>
                  <option value="CONCILIACAO_EXTRATO">Conciliação de Extrato</option>
                  <option value="ANALISE_CARTAO">Análise de Cartão</option>
                  <option value="CHEQUE_ESPECIAL">Cheque Especial</option>
                  <option value="PERICIA_JUDICIAL">Perícia Judicial</option>
                  <option value="COMPLIANCE">Compliance</option>
                </select>
              </div>
              <div>
                <label className="label">Nº do processo (opcional)</label>
                <input className="input" placeholder="0000000-00.0000.0.00.0000" {...register('processo')} />
              </div>
              <div className="col-span-2">
                <label className="label">Vara (opcional)</label>
                <input className="input" placeholder="ex: 3ª Vara Cível — SP" {...register('vara')} />
              </div>
            </div>
          </div>

          {/* Contrato */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">Dados do Contrato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Número do contrato</label>
                <input className="input" placeholder="EMP-2024-000001" {...register('cNumero')} />
                {errors.cNumero && <p className="text-red-500 text-xs mt-1">{errors.cNumero.message}</p>}
              </div>
              <div>
                <label className="label">Data da contratação</label>
                <input className="input" placeholder="15/03/2024" {...register('cData')} />
                {errors.cData && <p className="text-red-500 text-xs mt-1">{errors.cData.message}</p>}
              </div>
              <div>
                <label className="label">Valor financiado (R$)</label>
                <input className="input" type="number" step="0.01" placeholder="50000" {...register('cValor')} />
                {errors.cValor && <p className="text-red-500 text-xs mt-1">{errors.cValor.message}</p>}
              </div>
              <div>
                <label className="label">Prazo (meses)</label>
                <input className="input" type="number" placeholder="36" {...register('cPrazo')} />
                {errors.cPrazo && <p className="text-red-500 text-xs mt-1">{errors.cPrazo.message}</p>}
              </div>
              <div>
                <label className="label">Taxa nominal mensal (%)</label>
                <input className="input" type="number" step="0.001" placeholder="3.89" {...register('cTaxa')} />
                {errors.cTaxa && <p className="text-red-500 text-xs mt-1">{errors.cTaxa.message}</p>}
              </div>
              <div>
                <label className="label">Sistema de amortização</label>
                <select className="input" {...register('cSistema')}>
                  <option value="SAC">SAC — Amortização Constante</option>
                  <option value="PRICE">PRICE — Prestação Constante</option>
                  <option value="SAM">SAM — Sistema Misto</option>
                  <option value="SACRE">SACRE — Com correção</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="label">Fonte / referência probatória</label>
                <input className="input" placeholder="ex: Contrato de Empréstimo — fls. 23-31 dos autos" {...register('cFonte')} />
                {errors.cFonte && <p className="text-red-500 text-xs mt-1">{errors.cFonte.message}</p>}
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancelar
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Criando...' : 'Criar caso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
