'use client'
import { useAssets } from '../hooks/useAssets'
import { Package, MapPin, User } from 'lucide-react'

export default function AssetRegister() {
  const { assets, loading, updateCondition } = useAssets()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  const conditionColors: Record<string, string> = {
    new: 'bg-green-50 text-green-700',
    good: 'bg-blue-50 text-blue-700',
    fair: 'bg-amber-50 text-amber-700',
    poor: 'bg-red-50 text-red-700',
    disposed: 'bg-gray-100 text-gray-500'
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Asset Register</h3>
      </div>
      <div className="divide-y">
        {assets.map(a => (
          <div key={a.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-treasury-50 text-treasury-600"><Package size={16}/></div>
                <div>
                  <p className="font-medium text-sm text-gray-900">{a.asset_name}</p>
                  <p className="text-xs text-gray-500">{a.asset_tag} • {a.asset_category}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${conditionColors[a.condition]}`}>{a.condition}</span>
            </div>
            <div className="grid grid-cols-4 gap-4 text-xs text-gray-500 mb-2">
              <span>Cost: {fmt(a.acquisition_cost)}</span>
              <span>NBV: {fmt(a.net_book_value)}</span>
              <span className="flex items-center gap-1"><MapPin size={10}/> {a.location}</span>
              <span className="flex items-center gap-1"><User size={10}/> {a.custody_officer_name || 'Unassigned'}</span>
            </div>
            <div className="flex gap-2">
              {(['new','good','fair','poor','disposed'] as const).map(c => (
                <button key={c} onClick={() => updateCondition(a.id, c)}
                  className={`text-xs px-2 py-0.5 rounded-full ${a.condition === c ? 'bg-treasury-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
