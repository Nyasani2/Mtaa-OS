'use client'
import { useApprovals } from '../hooks/useApprovals'
import { ArrowLeftRight, CheckCircle, XCircle } from 'lucide-react'

export default function DelegationManager() {
  const { delegations, loading, toggleDelegation } = useApprovals()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <ArrowLeftRight size={18} className="text-treasury-600"/>
        <h3 className="font-semibold text-gray-900">Delegation Management</h3>
      </div>
      <div className="divide-y">
        {delegations.map(d => (
          <div key={d.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-gray-900">{d.module}</p>
              <p className="text-xs text-gray-500">{new Date(d.start_date).toLocaleDateString()} → {new Date(d.end_date).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                d.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'
              }`}>
                {d.is_active ? <CheckCircle size={12}/> : <XCircle size={12}/>}
                {d.is_active ? 'Active' : 'Inactive'}
              </span>
              <button onClick={() => toggleDelegation(d.id, !d.is_active)}
                className={`text-xs px-3 py-1 rounded-full font-medium ${
                  d.is_active ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                }`}>
                {d.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
