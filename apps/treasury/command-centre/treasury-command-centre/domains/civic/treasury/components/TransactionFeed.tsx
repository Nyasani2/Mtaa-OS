'use client'
import { useDashboard } from '../hooks/useDashboard'
import { ArrowDownLeft, ArrowUpRight, Repeat, Landmark } from 'lucide-react'

const typeConfig = {
  expenditure: { icon: ArrowUpRight, color: 'text-red-600 bg-red-50' },
  revenue: { icon: ArrowDownLeft, color: 'text-green-600 bg-green-50' },
  transfer: { icon: Repeat, color: 'text-blue-600 bg-blue-50' },
  debt: { icon: Landmark, color: 'text-purple-600 bg-purple-50' }
}

export default function TransactionFeed() {
  const { data, loading } = useDashboard()

  if (loading) return <div className="h-64 bg-gray-100 rounded-lg animate-pulse"/>
  if (!data?.recent_transactions?.length) return <p className="text-gray-500 text-center py-8">No recent transactions</p>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Recent Transactions</h3>
      </div>
      <div className="divide-y">
        {data.recent_transactions.map(tx => {
          const cfg = typeConfig[tx.type] || typeConfig.transfer
          const Icon = cfg.icon
          return (
            <div key={tx.id} className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50">
              <div className={`p-2 rounded-lg ${cfg.color}`}><Icon size={16}/></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
                <p className="text-xs text-gray-500">{tx.status} • {new Date(tx.created_at).toLocaleDateString()}</p>
              </div>
              <span className={`text-sm font-semibold ${tx.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'revenue' ? '+' : '-'}{fmt(tx.amount)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
