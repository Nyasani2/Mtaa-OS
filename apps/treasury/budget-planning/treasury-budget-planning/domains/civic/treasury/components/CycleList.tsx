'use client'
import { useBudgetCycles } from '../hooks/useBudgetCycles'
import { CheckCircle, Clock, XCircle, Play, Lock } from 'lucide-react'

const statusConfig = {
  draft: { icon: Clock, color: 'bg-gray-50 text-gray-600', label: 'Draft' },
  submitted: { icon: Clock, color: 'bg-blue-50 text-blue-600', label: 'Submitted' },
  approved: { icon: CheckCircle, color: 'bg-green-50 text-green-600', label: 'Approved' },
  active: { icon: Play, color: 'bg-treasury-50 text-treasury-600', label: 'Active' },
  closed: { icon: Lock, color: 'bg-gray-100 text-gray-500', label: 'Closed' }
}

export default function CycleList() {
  const { cycles, loading, updateStatus, close } = useBudgetCycles()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Budget Cycles</h3>
      </div>
      <div className="divide-y">
        {cycles.map(cycle => {
          const cfg = statusConfig[cycle.status]
          const Icon = cfg.icon
          return (
            <div key={cycle.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${cfg.color}`}><Icon size={16}/></div>
                <div>
                  <p className="font-medium text-gray-900">{cycle.title}</p>
                  <p className="text-sm text-gray-500">FY {cycle.fiscal_year} • {fmt(cycle.total_approved_amount)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{cfg.label}</span>
                {cycle.status === 'draft' && (
                  <button onClick={() => updateStatus(cycle.id, 'submitted')}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">Submit</button>
                )}
                {cycle.status === 'submitted' && (
                  <button onClick={() => updateStatus(cycle.id, 'approved')}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Approve</button>
                )}
                {cycle.status === 'approved' && (
                  <button onClick={() => updateStatus(cycle.id, 'active')}
                    className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700">Activate</button>
                )}
                {cycle.status === 'active' && (
                  <button onClick={() => close(cycle.id)}
                    className="text-xs bg-gray-600 text-white px-3 py-1 rounded-full hover:bg-gray-700">Close</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
