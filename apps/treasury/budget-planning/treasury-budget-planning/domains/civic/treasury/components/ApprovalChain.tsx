'use client'
import { useApprovals } from '../hooks/useApprovals'
import { Users, Shield, ArrowRight } from 'lucide-react'

export default function ApprovalChain({ module }: { module?: string }) {
  const { hierarchy, loading } = useApprovals(module)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b flex items-center gap-2">
        <Users size={18} className="text-treasury-600"/>
        <h3 className="font-semibold text-gray-900">Approval Hierarchy</h3>
      </div>
      <div className="p-6">
        <div className="flex items-center gap-4">
          {hierarchy.map((h, i) => (
            <div key={h.id} className="flex items-center gap-4">
              <div className="bg-treasury-50 border border-treasury-200 rounded-lg p-4 min-w-[180px]">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={16} className="text-treasury-600"/>
                  <span className="font-medium text-sm text-gray-900">{h.approver_name}</span>
                </div>
                <p className="text-xs text-gray-500">Limit: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(h.approval_limit)}</p>
                {h.second_approval_required && (
                  <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                    2nd approval required
                  </span>
                )}
              </div>
              {i < hierarchy.length - 1 && <ArrowRight size={20} className="text-gray-300"/>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
