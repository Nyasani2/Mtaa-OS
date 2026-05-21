import React from 'react'

interface StatItem {
  label: string
  value: number
  color: string
  icon: string
}

interface DashboardStatsProps {
  stats: {
    total: number
    open: number
    investigating: number
    closed: number
    critical: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const items: StatItem[] = [
    { label: 'Total Cases', value: stats.total, color: 'bg-blue-500', icon: '📁' },
    { label: 'Open', value: stats.open, color: 'bg-yellow-500', icon: '📂' },
    { label: 'Investigating', value: stats.investigating, color: 'bg-blue-600', icon: '🔍' },
    { label: 'Closed', value: stats.closed, color: 'bg-green-500', icon: '✅' },
    { label: 'Critical', value: stats.critical, color: 'bg-red-500', icon: '🚨' },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {items.map((item) => (
        <div key={item.label} className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-2xl">{item.icon}</span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full text-white ${item.color}`}>
              {item.value}
            </span>
          </div>
          <p className="text-sm text-gray-600">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
