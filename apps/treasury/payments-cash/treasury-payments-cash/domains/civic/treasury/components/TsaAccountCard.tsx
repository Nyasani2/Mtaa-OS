'use client'
import { useTsaAccounts } from '../hooks/useTsaAccounts'
import { Landmark, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function TsaAccountCard() {
  const { accounts, loading } = useTsaAccounts()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="grid grid-cols-3 gap-4">
      {accounts.map(acc => (
        <div key={acc.id} className="bg-white rounded-lg border p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 rounded-lg bg-treasury-50 text-treasury-600"><Landmark size={16}/></div>
            <div>
              <p className="font-medium text-sm text-gray-900">{acc.account_name}</p>
              <p className="text-xs text-gray-500">{acc.account_number}</p>
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{fmt(acc.current_balance)}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              acc.account_type === 'central' ? 'bg-purple-50 text-purple-600' :
              acc.account_type === 'project' ? 'bg-blue-50 text-blue-600' :
              'bg-gray-50 text-gray-600'
            }`}>{acc.account_type}</span>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${acc.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {acc.is_active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}
