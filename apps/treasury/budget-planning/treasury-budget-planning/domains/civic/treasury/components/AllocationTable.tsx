'use client'
import { useAllocations } from '../hooks/useAllocations'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function AllocationTable({ cycleId }: { cycleId?: string }) {
  const { allocations, loading } = useAllocations(cycleId)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900">Budget Allocations</h3>
        <span className="text-sm text-gray-500">{allocations.length} ministries</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Ministry</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Approved</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Revised</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Available</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Utilization</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {allocations.map(a => {
              const rate = a.utilization_rate || 0
              const Icon = rate > 80 ? TrendingUp : rate < 20 ? TrendingDown : Minus
              return (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-6 py-3 font-medium text-gray-900">{a.ministry_name}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{fmt(a.approved_amount)}</td>
                  <td className="px-6 py-3 text-right text-gray-600">{a.revised_amount ? fmt(a.revised_amount) : '-'}</td>
                  <td className="px-6 py-3 text-right font-medium text-gray-900">{fmt(a.available_balance)}</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      rate > 80 ? 'bg-red-50 text-red-700' : rate > 50 ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                    }`}>
                      <Icon size={12}/> {rate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
