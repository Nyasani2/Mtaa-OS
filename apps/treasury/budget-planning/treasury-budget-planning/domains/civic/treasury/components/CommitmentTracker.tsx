'use client'
import { useCommitments } from '../hooks/useCommitments'
import { Lock, CheckCircle, XCircle } from 'lucide-react'

export default function CommitmentTracker({ warrantId }: { warrantId?: string }) {
  const { commitments, loading } = useCommitments(warrantId)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const statusConfig = {
    draft: { color: 'bg-gray-50 text-gray-600', icon: Lock },
    approved: { color: 'bg-blue-50 text-blue-600', icon: CheckCircle },
    committed: { color: 'bg-treasury-50 text-treasury-600', icon: Lock },
    liquidated: { color: 'bg-green-50 text-green-600', icon: CheckCircle },
    cancelled: { color: 'bg-red-50 text-red-600', icon: XCircle }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Commitments</h3>
      </div>
      <div className="divide-y">
        {commitments.map(c => {
          const cfg = statusConfig[c.status]
          const Icon = cfg.icon
          return (
            <div key={c.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${cfg.color}`}><Icon size={16}/></div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">{c.commitment_number}</p>
                    <p className="text-xs text-gray-500">{c.description}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{c.status}</span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-4 text-xs">
                <div><span className="text-gray-500">Amount:</span> <span className="font-medium">{fmt(c.amount)}</span></div>
                <div><span className="text-gray-500">Liquidated:</span> <span className="font-medium">{fmt(c.liquidated_amount)}</span></div>
                <div><span className="text-gray-500">Remaining:</span> <span className="font-medium">{fmt(c.remaining_amount)}</span></div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
