'use client'
import { useContracts } from '../hooks/useContracts'
import { Award, TrendingUp, Clock, Star } from 'lucide-react'

export default function ContractAwarder() {
  const { contracts, loading, updateStatus } = useContracts()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Contract Performance</h3>
      </div>
      <div className="divide-y">
        {contracts.map(c => (
          <div key={c.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-treasury-50 text-treasury-600"><Award size={16}/></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{c.contract_number}</p>
                  <p className="text-xs text-gray-500">{c.contractor_name} • {fmt(c.contract_value)}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                c.status === 'active' ? 'bg-green-50 text-green-700' :
                c.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                c.status === 'terminated' ? 'bg-red-50 text-red-700' :
                'bg-gray-50 text-gray-600'
              }`}>{c.status}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-2">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Payment</span>
                  <span>{c.payment_progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${c.payment_progress}%` }}/>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Time</span>
                  <span>{c.time_progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${c.time_progress}%` }}/>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Star size={12} className="text-amber-500"/>
                <span className="text-xs font-medium">{c.performance_rating ? c.performance_rating.toFixed(1) : 'N/A'}/5.0</span>
              </div>
            </div>
            <div className="flex gap-2">
              {c.status === 'draft' && (
                <button onClick={() => updateStatus(c.id, 'active')}
                  className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Activate</button>
              )}
              {c.status === 'active' && (
                <button onClick={() => updateStatus(c.id, 'completed')}
                  className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">Complete</button>
              )}
              {c.status === 'active' && (
                <button onClick={() => updateStatus(c.id, 'terminated')}
                  className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100">Terminate</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
