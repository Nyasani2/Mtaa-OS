'use client'
import { useState } from 'react'
import { useAssets } from '../hooks/useAssets'
import { ArrowLeftRight, User } from 'lucide-react'

export default function CustodyTransfer({ assetId }: { assetId: string }) {
  const { transfer } = useAssets()
  const [fromOfficer, setFromOfficer] = useState('')
  const [toOfficer, setToOfficer] = useState('')
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await transfer({
      asset_id: assetId,
      from_officer_id: 'from-id',
      to_officer_id: 'to-id',
      from_officer_name: fromOfficer,
      to_officer_name: toOfficer,
      transfer_date: new Date().toISOString(),
      reason,
      status: 'pending'
    })
    setSubmitting(false)
    setFromOfficer(''); setToOfficer(''); setReason('')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-4 space-y-3">
      <h4 className="font-medium text-sm text-gray-900 flex items-center gap-2"><ArrowLeftRight size={16}/> Transfer Custody</h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">From Officer</label>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400"/>
            <input type="text" value={fromOfficer} onChange={e => setFromOfficer(e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs" required/>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">To Officer</label>
          <div className="flex items-center gap-2">
            <User size={14} className="text-gray-400"/>
            <input type="text" value={toOfficer} onChange={e => setToOfficer(e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs" required/>
          </div>
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Reason</label>
        <input type="text" value={reason} onChange={e => setReason(e.target.value)}
          className="w-full rounded border px-2 py-1 text-xs" placeholder="Reason for transfer..." required/>
      </div>
      <button type="submit" disabled={submitting}
        className="text-xs bg-treasury-600 text-white px-3 py-1 rounded hover:bg-treasury-700 disabled:opacity-50">
        {submitting ? 'Submitting...' : 'Request Transfer'}
      </button>
    </form>
  )
}
