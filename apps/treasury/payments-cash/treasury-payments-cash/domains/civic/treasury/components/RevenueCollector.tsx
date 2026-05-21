'use client'
import { useState } from 'react'
import { useRevenueCollections } from '../hooks/useRevenueCollections'
import { Coins, Save, CheckCircle } from 'lucide-react'

const sources = ['tax', 'non_tax', 'fees', 'fines', 'grants', 'loans', 'dividends', 'rent'] as const

export default function RevenueCollector() {
  const { collections, loading, create, confirm } = useRevenueCollections()
  const [source, setSource] = useState<typeof sources[number]>('tax')
  const [subSource, setSubSource] = useState('')
  const [amount, setAmount] = useState('')
  const [taxpayerName, setTaxpayerName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({
      collection_number: `REV-${Date.now()}`,
      source,
      sub_source: subSource || undefined,
      amount: parseFloat(amount),
      collection_date: new Date().toISOString().split('T')[0],
      taxpayer_name: taxpayerName || undefined,
      status: 'pending',
      created_by: 'current-user'
    })
    setAmount(''); setSubSource(''); setTaxpayerName('')
    setSubmitting(false)
  }

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Coins size={18}/> Record Revenue Collection</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select value={source} onChange={e => setSource(e.target.value as typeof sources[number])}
              className="w-full rounded-lg border px-3 py-2 text-sm">
              {sources.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\w/g, l => l.toUpperCase())}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="0.00" required/>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-source (optional)</label>
            <input type="text" value={subSource} onChange={e => setSubSource(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g., VAT, Income Tax"/>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Taxpayer Name (optional)</label>
            <input type="text" value={taxpayerName} onChange={e => setTaxpayerName(e.target.value)}
              className="w-full rounded-lg border px-3 py-2 text-sm"/>
          </div>
        </div>
        <button type="submit" disabled={submitting}
          className="flex items-center gap-2 bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700 disabled:opacity-50">
          <Save size={16}/> {submitting ? 'Recording...' : 'Record Collection'}
        </button>
      </form>

      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Recent Collections</h3>
        </div>
        <div className="divide-y">
          {collections.map(c => (
            <div key={c.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{c.collection_number}</p>
                <p className="text-xs text-gray-500">{c.source.replace('_', ' ')} • {c.taxpayer_name || 'N/A'}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm text-gray-900">{fmt(c.amount)}</span>
                {c.status === 'pending' && (
                  <button onClick={() => confirm(c.id)}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 flex items-center gap-1">
                    <CheckCircle size={12}/> Confirm
                  </button>
                )}
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  c.status === 'confirmed' ? 'bg-green-50 text-green-700' :
                  c.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-50 text-gray-600'
                }`}>{c.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
