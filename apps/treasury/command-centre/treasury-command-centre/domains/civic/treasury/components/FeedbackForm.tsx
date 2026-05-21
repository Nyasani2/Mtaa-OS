'use client'
import { useState } from 'react'
import { useFeedback } from '../hooks/useFeedback'
import { Send } from 'lucide-react'

export default function FeedbackForm() {
  const { create } = useFeedback()
  const [module, setModule] = useState('')
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState<'low'|'medium'|'high'|'urgent'>('medium')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({ module, category, message, priority, status: 'open', user_id: 'current-user' })
    setModule(''); setCategory(''); setMessage(''); setPriority('medium')
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold text-gray-900">Submit Feedback</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Module</label>
          <select value={module} onChange={e => setModule(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" required>
            <option value="">Select...</option>
            <option>Budget</option><option>Payments</option><option>Debt</option><option>Procurement</option><option>Audit</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <select value={category} onChange={e => setCategory(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm" required>
            <option value="">Select...</option>
            <option>Bug</option><option>Feature Request</option><option>Data Issue</option><option>Performance</option><option>Other</option>
          </select>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
        <div className="flex gap-2">
          {(['low','medium','high','urgent'] as const).map(p => (
            <button key={p} type="button" onClick={() => setPriority(p)}
              className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${
                priority === p ? 'bg-treasury-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}>{p}</button>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
          className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Describe your feedback..." required/>
      </div>
      <button type="submit" disabled={submitting}
        className="flex items-center gap-2 bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700 disabled:opacity-50">
        <Send size={16}/> {submitting ? 'Submitting...' : 'Submit'}
      </button>
    </form>
  )
}
