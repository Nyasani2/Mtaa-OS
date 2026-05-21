'use client'
import { useTenders } from '../hooks/useTenders'
import { Users } from 'lucide-react'

export default function BidCounter() {
  const { tenders, loading } = useTenders()

  if (loading) return <div className="h-24 bg-gray-100 rounded-lg animate-pulse"/>

  const totalBids = tenders.reduce((s, t) => s + t.bid_count, 0)
  const activeTenders = tenders.filter(t => t.status === 'published' || t.status === 'under_evaluation').length

  return (
    <div className="grid grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600"><Users size={16}/></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{totalBids}</p>
            <p className="text-sm text-gray-500">Total Bids Received</p>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-lg border p-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-green-50 text-green-600"><Users size={16}/></div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{activeTenders}</p>
            <p className="text-sm text-gray-500">Active Tenders</p>
          </div>
        </div>
      </div>
    </div>
  )
}
