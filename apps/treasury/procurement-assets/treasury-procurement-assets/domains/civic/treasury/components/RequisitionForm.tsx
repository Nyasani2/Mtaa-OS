'use client'
import { useState } from 'react'
import { useRequisitions } from '../hooks/useRequisitions'
import { FileText, Save, Zap } from 'lucide-react'

export default function RequisitionForm({ onSuccess }: { onSuccess?: () => void }) {
  const { create } = useRequisitions()
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [cost, setCost] = useState('')
  const [ministry, setMinistry] = useState('')
  const [urgency, setUrgency] = useState<'low'|'medium'|'high'|'critical'>('medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({
      requisition_number: number,
      title,
      description,
      estimated_cost: parseFloat(cost),
      ministry_id: 'ministry-id',
      ministry_name: ministry,
      urgency,
      created_by: 'current-user'
    })
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText size={18}/> New Requisition</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Requisition Number</label>
          <input type="text" value={number} onChange={e => setNumber(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="REQ-2025-001" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost</label>
          <input type="number" value={cost} onChange={e => setCost(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="0.00" required/>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm" required/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3}
          className="w-full rounded-lg border px-3 py-2 text-sm" required/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Ministry</label>
          <input type="text" value={ministry} onChange={e => setMinistry(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency</label>
          <div className="flex gap-1">
            {(['low','medium','high','critical'] as const).map(u => (
              <button key={u} type="button" onClick={() => setUrgency(u)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                  urgency === u ? 'bg-treasury-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>
                {u === 'critical' ? <Zap size={10} className="inline mr-1"/> : null}{u}
              </button>
            ))}
          </div>
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="flex items-center gap-2 bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700 disabled:opacity-50">
        <Save size={16}/> {submitting ? 'Creating...' : 'Create'}
      </button>
    </form>
  )
}
