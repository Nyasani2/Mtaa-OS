'use client'
import RequisitionForm from '@/domains/civic/treasury/components/RequisitionForm'
import { useRequisitions } from '@/domains/civic/treasury/hooks/useRequisitions'
import UrgencyBadge from '@/domains/civic/treasury/components/UrgencyBadge'

export default function RequisitionsPage() {
  const { requisitions, loading, submit, approve, convert } = useRequisitions()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="space-y-6">
      <RequisitionForm/>
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Requisitions</h3>
        </div>
        <div className="divide-y">
          {requisitions.map(r => (
            <div key={r.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-medium text-sm text-gray-900">{r.requisition_number}</p>
                  <p className="text-xs text-gray-500">{r.title} • {r.ministry_name}</p>
                </div>
                <div className="flex items-center gap-2">
                  <UrgencyBadge urgency={r.urgency}/>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    r.status === 'approved' ? 'bg-green-50 text-green-700' :
                    r.status === 'submitted' ? 'bg-blue-50 text-blue-700' :
                    r.status === 'under_review' ? 'bg-purple-50 text-purple-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>{r.status.replace('_', ' ')}</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mb-2">{fmt(r.estimated_cost)}</p>
              <div className="flex gap-2">
                {r.status === 'draft' && (
                  <button onClick={() => submit(r.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">Submit</button>
                )}
                {r.status === 'submitted' && (
                  <button onClick={() => approve(r.id, 'current-user')}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Approve</button>
                )}
                {r.status === 'approved' && (
                  <button onClick={() => convert(r.id)}
                    className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700">Convert to Tender</button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
