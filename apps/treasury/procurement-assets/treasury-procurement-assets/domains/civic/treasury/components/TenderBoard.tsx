'use client'
import { useTenders } from '../hooks/useTenders'
import { ShoppingCart, Calendar, Users } from 'lucide-react'

export default function TenderBoard() {
  const { tenders, loading, publish, award, cancel } = useTenders()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  const statusConfig = {
    draft: { color: 'bg-gray-50 text-gray-600' },
    published: { color: 'bg-blue-50 text-blue-600' },
    under_evaluation: { color: 'bg-purple-50 text-purple-600' },
    awarded: { color: 'bg-green-50 text-green-600' },
    contracted: { color: 'bg-treasury-50 text-treasury-600' },
    cancelled: { color: 'bg-red-50 text-red-600' }
  }

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Tender Registry</h3>
      </div>
      <div className="divide-y">
        {tenders.map(t => {
          const cfg = statusConfig[t.status]
          return (
            <div key={t.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${cfg.color}`}><ShoppingCart size={16}/></div>
                  <div>
                    <p className="font-medium text-sm text-gray-900">{t.tender_number}</p>
                    <p className="text-xs text-gray-500">{t.title}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${cfg.color}`}>{t.status.replace('_', ' ')}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                <span className="flex items-center gap-1"><Calendar size={12}/> Closes {new Date(t.closing_date).toLocaleDateString()}</span>
                <span className="flex items-center gap-1"><Users size={12}/> {t.bid_count} bids</span>
                <span>{fmt(t.estimated_value)}</span>
              </div>
              <div className="flex gap-2">
                {t.status === 'draft' && (
                  <button onClick={() => publish(t.id)}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">Publish</button>
                )}
                {t.status === 'under_evaluation' && (
                  <button onClick={() => award(t.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700">Award</button>
                )}
                {t.status !== 'cancelled' && t.status !== 'contracted' && (
                  <button onClick={() => cancel(t.id)}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100">Cancel</button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
