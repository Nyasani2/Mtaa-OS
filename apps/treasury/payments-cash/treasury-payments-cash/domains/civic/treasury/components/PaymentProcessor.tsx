'use client'
import { useExpenditures } from '../hooks/useExpenditures'
import { CheckCircle, Play, DollarSign, Clock } from 'lucide-react'

export default function PaymentProcessor() {
  const { expenditures, loading, approve, process, pay } = useExpenditures()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const statusConfig = {
    pending: { color: 'bg-amber-50 text-amber-700', icon: Clock, action: 'Approve', handler: approve },
    approved: { color: 'bg-blue-50 text-blue-700', icon: CheckCircle, action: 'Process', handler: process },
    processed: { color: 'bg-purple-50 text-purple-700', icon: Play, action: 'Mark Paid', handler: pay },
    paid: { color: 'bg-green-50 text-green-700', icon: DollarSign, action: null, handler: null }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Expenditure Vouchers</h3>
      </div>
      <div className="divide-y">
        {expenditures.map(exp => {
          const cfg = statusConfig[exp.status]
          const Icon = cfg.icon
          return (
            <div key={exp.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${cfg.color}`}><Icon size={16}/></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{exp.voucher_number}</p>
                  <p className="text-xs text-gray-500">{exp.description} • {fmt(exp.amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{exp.status}</span>
                {cfg.action && (
                  <button onClick={() => cfg.handler?.(exp.id, 'current-user')}
                    className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700">{cfg.action}</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
