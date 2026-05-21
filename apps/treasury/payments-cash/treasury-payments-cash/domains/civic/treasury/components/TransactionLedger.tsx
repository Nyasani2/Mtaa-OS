'use client'
import { useTsaTransactions } from '../hooks/useTsaTransactions'
import { ArrowUpRight, ArrowDownLeft, Repeat, RotateCcw } from 'lucide-react'

export default function TransactionLedger({ accountId }: { accountId?: string }) {
  const { transactions, loading } = useTsaTransactions(accountId)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const typeConfig = {
    receipt: { icon: ArrowDownLeft, color: 'text-green-600 bg-green-50', sign: '+' },
    payment: { icon: ArrowUpRight, color: 'text-red-600 bg-red-50', sign: '-' },
    transfer: { icon: Repeat, color: 'text-blue-600 bg-blue-50', sign: '±' },
    reversal: { icon: RotateCcw, color: 'text-amber-600 bg-amber-50', sign: '↩' }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">TSA Transaction Ledger</h3>
      </div>
      <div className="divide-y">
        {transactions.map(tx => {
          const cfg = typeConfig[tx.transaction_type]
          const Icon = cfg.icon
          return (
            <div key={tx.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${cfg.color}`}><Icon size={16}/></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{tx.description}</p>
                  <p className="text-xs text-gray-500">{tx.reference_number} • {new Date(tx.transaction_date).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`font-semibold text-sm ${cfg.color.split(' ')[0]}`}>{cfg.sign}{fmt(tx.amount)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
