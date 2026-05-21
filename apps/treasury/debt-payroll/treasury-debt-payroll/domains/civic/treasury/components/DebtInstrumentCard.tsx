'use client'
import { useDebtInstruments } from '../hooks/useDebtInstruments'
import { Landmark, AlertTriangle, Calendar } from 'lucide-react'

export default function DebtInstrumentCard() {
  const { instruments, loading, updateStatus } = useDebtInstruments()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)
  const isMatured = (date: string) => new Date(date) < new Date()

  const typeColors: Record<string, string> = {
    bilateral: 'bg-blue-50 text-blue-700',
    multilateral: 'bg-purple-50 text-purple-700',
    commercial: 'bg-red-50 text-red-700',
    t_bills: 'bg-green-50 text-green-700',
    t_bonds: 'bg-amber-50 text-amber-700',
    sukuk: 'bg-teal-50 text-teal-700',
    guarantees: 'bg-gray-50 text-gray-700'
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {instruments.map(inst => {
        const matured = isMatured(inst.maturity_date)
        return (
          <div key={inst.id} className={`bg-white rounded-lg border p-4 ${matured ? 'border-red-200 bg-red-50/30' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${typeColors[inst.instrument_type] || 'bg-gray-50'}`}>
                  <Landmark size={16}/>
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{inst.creditor_name}</p>
                  <p className="text-xs text-gray-500 capitalize">{inst.instrument_type.replace('_', ' ')}</p>
                </div>
              </div>
              {matured && <AlertTriangle size={16} className="text-red-500"/>}
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Original Principal</span>
                <span className="font-medium">{fmt(inst.original_principal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Outstanding</span>
                <span className="font-medium text-red-600">{fmt(inst.outstanding_principal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Interest Rate</span>
                <span className="font-medium">{inst.interest_rate}% {inst.interest_type}</span>
              </div>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                <Calendar size={12}/> Matures {new Date(inst.maturity_date).toLocaleDateString()}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                inst.status === 'active' ? 'bg-green-50 text-green-700' :
                inst.status === 'repaid' ? 'bg-blue-50 text-blue-700' :
                inst.status === 'defaulted' ? 'bg-red-50 text-red-700' :
                'bg-gray-50 text-gray-600'
              }`}>{inst.status}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
