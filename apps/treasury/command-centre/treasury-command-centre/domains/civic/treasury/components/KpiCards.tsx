'use client'
import { useDashboard } from '../hooks/useDashboard'
import { Wallet, ArrowDownLeft, ArrowUpRight, AlertCircle } from 'lucide-react'

export default function KpiCards() {
  const { data, loading } = useDashboard()

  if (loading) return <div className="grid grid-cols-4 gap-4 animate-pulse">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-lg"/>)}</div>
  if (!data) return null

  const cards = [
    { label: 'Total Budget', value: data.total_budget, icon: Wallet, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Revenue', value: data.total_revenue, icon: ArrowDownLeft, color: 'bg-green-50 text-green-600' },
    { label: 'Total Expenditure', value: data.total_expenditure, icon: ArrowUpRight, color: 'bg-red-50 text-red-600' },
    { label: 'Cash Balance', value: data.cash_balance, icon: AlertCircle, color: 'bg-amber-50 text-amber-600' }
  ]

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="grid grid-cols-4 gap-4">
      {cards.map(card => {
        const Icon = card.icon
        return (
          <div key={card.label} className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{fmt(card.value)}</p>
              </div>
              <div className={`p-3 rounded-lg ${card.color}`}><Icon size={20}/></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
