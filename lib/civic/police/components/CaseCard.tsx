import React from 'react'
import Link from 'next/link'
import { PoliceCase } from '../types/police.types'
import { StatusBadge } from './StatusBadge'

interface CaseCardProps {
  caseItem: PoliceCase
  onClick?: () => void
}

export function CaseCard({ caseItem, onClick }: CaseCardProps) {
  const formattedDate = new Date(caseItem.created_at).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <div 
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="font-semibold text-gray-900">{caseItem.case_number}</h3>
          <p className="text-sm text-gray-500">{caseItem.case_type.replace(/_/g, ' ').toUpperCase()}</p>
        </div>
        <StatusBadge status={caseItem.status} size="sm" />
      </div>

      <p className="text-gray-700 text-sm mb-3 line-clamp-2">{caseItem.description}</p>

      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <StatusBadge status={caseItem.priority} size="sm" />
          <span>{caseItem.incident_location}</span>
        </div>
        <span>{formattedDate}</span>
      </div>

      {caseItem.assigned_officer && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-medium text-blue-700">
            {caseItem.assigned_officer.full_name?.charAt(0) || 'O'}
          </div>
          <span className="text-xs text-gray-600">
            Assigned: {caseItem.assigned_officer.full_name || caseItem.assigned_officer.badge_number}
          </span>
        </div>
      )}
    </div>
  )
}
