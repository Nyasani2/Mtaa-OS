'use client'
import { useBankReconciliations } from '../hooks/useBankReconciliations'
import { Scale, AlertTriangle, CheckCircle } from 'lucide-react'

export default function ReconciliationMatcher() {
  const { reconciliations, loading, resolve } = useBankReconciliations()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Scale size={18}/> Bank Reconciliations</h3>
      </div>
      <div className="divide-y">
        {reconciliations.map(r => (
          <div key={r.id} className={`px-6 py-4 hover:bg-gray-50 ${r.difference !== 0 ? 'bg-red-50/30' : ''}`}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                {r.difference !== 0 ? <AlertTriangle size={16} className="text-red-500"/> : <CheckCircle size={16} className="text-green-500"/>}
                <div>
                  <p className="font-medium text-sm text-gray-900">{r.reconciliation_period}</p>
                  <p className="text-xs text-gray-500">System: {fmt(r.system_balance)} • Bank: {fmt(r.bank_balance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold text-sm ${r.difference !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Diff: {fmt(r.difference)}
                </span>
                {r.ai_anomaly_score !== undefined && r.ai_anomaly_score > 0.7 && (
                  <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <AlertTriangle size={10}/> AI Alert ({(r.ai_anomaly_score * 100).toFixed(0)}%)
                  </span>
                )}
              </div>
            </div>
            {r.status !== 'resolved' && (
              <button onClick={() => resolve(r.id, 'current-user')}
                className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700">Mark Resolved</button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
