import React from 'react'

interface StatusBadgeProps {
  status: string
  size?: 'sm' | 'md' | 'lg'
}

const statusColors: Record<string, { bg: string; text: string; border: string }> = {
  reported: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  under_investigation: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  suspect_identified: { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  suspect_arrested: { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  charges_filed: { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
  in_court: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  awaiting_trial: { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  convicted: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  acquitted: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  dismissed: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },
  closed: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  reopened: { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  transferred: { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  cold_case: { bg: 'bg-slate-100', text: 'text-slate-800', border: 'border-slate-200' },

  // Emergency dispatch statuses
  received: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  dispatched: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  en_route: { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  on_scene: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
  resolved: { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-200' },

  // Priority
  critical: { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-200' },
  high: { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-200' },
  low: { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-200' },
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const colors = statusColors[status] || statusColors.low
  const displayStatus = status.replace(/_/g, ' ').toUpperCase()

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}>
      <span className={`mr-1.5 h-2 w-2 rounded-full ${colors.text.replace('text-', 'bg-')}`} />
      {displayStatus}
    </span>
  )
}
