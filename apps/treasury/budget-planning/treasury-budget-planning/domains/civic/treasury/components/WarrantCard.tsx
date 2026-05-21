'use client'
import { useWarrants } from '../hooks/useWarrants'
import { Receipt, Calendar, AlertTriangle } from 'lucide-react'

export default function WarrantCard({ allocationId }: { allocationId?: string }) {
  const { warrants, loading, cancel } = useWarrants(allocationId)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
  const isExpired = (date: string) => new Date(date) < new Date()

  return (
    <div className="grid grid-cols-2 gap-4">
      {warrants.map(w => {
        const expired = isExpired(w.expiry_date)
        return (
          <div key={w.id} className={`bg-white rounded-lg border p-4 ${expired ? 'border-red-200 bg-red-50/30' : ''}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${expired ? 'bg-red-100 text-red-600' : 'bg-treasury-50 text-treasury-600'}`}>
                  <Receipt size={16}/>
                </div>
                <div>
                  <p className="font-medium text-gray-900 text-sm">{w.warrant_number}</p>
                  <p className="text-xs text-gray-500">{fmt(w.amount)}</p>
                </div>
              </div>
              {expired && <AlertTriangle size={16} className="text-red-500"/>}
            </div>
            <div className="mt-3 space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Spent</span>
                <span className="font-medium">{fmt(w.spent_amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Remaining</span>
                <span className="font-medium">{fmt(w.remaining_amount)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                <div className="bg-treasury-500 h-1.5 rounded-full" style={{ width: `${(w.spent_amount / w.amount) * 100}%` }}/>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
              <Calendar size={12}/> Expires {new Date(w.expiry_date).toLocaleDateString()}
            </div>
            {w.status !== 'cancelled' && w.status !== 'fully_spent' && (
              <button onClick={() => cancel(w.id)}
                className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium">Cancel Warrant</button>
            )}
          </div>
        )
      })}
    </div>
  )
}
