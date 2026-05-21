'use client'
import { useDebtPayments } from '../hooks/useDebtPayments'
import { Calendar, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

export default function DebtServiceCalendar() {
  const { payments, loading, pay, waive } = useDebtPayments(90)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const isOverdue = (date: string) => new Date(date) < new Date()

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <Calendar size={18} className="text-treasury-600"/>
        <h3 className="font-semibold text-gray-900">90-Day Payment Schedule</h3>
      </div>
      <div className="divide-y">
        {payments.map(p => {
          const overdue = isOverdue(p.payment_date)
          return (
            <div key={p.id} className={`px-6 py-4 hover:bg-gray-50 ${overdue ? 'bg-red-50/30' : ''}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {overdue ? <AlertTriangle size={16} className="text-red-500"/> :
                   <Clock size={16} className="text-amber-500"/>}
                  <div>
                    <p className="font-medium text-sm text-gray-900">Payment #{p.payment_number}</p>
                    <p className="text-xs text-gray-500">{new Date(p.payment_date).toLocaleDateString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold text-sm">{fmt(p.total_amount)}</span>
                  <div className="flex gap-1">
                    <button onClick={() => pay(p.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 flex items-center gap-1">
                      <CheckCircle size={12}/> Pay
                    </button>
                    <button onClick={() => waive(p.id)}
                      className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full hover:bg-gray-200">Waive</button>
                  </div>
                </div>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-gray-500">
                <span>Principal: {fmt(p.principal_amount)}</span>
                <span>Interest: {fmt(p.interest_amount)}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
