'use client'
import { useState } from 'react'
import { useBudgetCycles } from '../hooks/useBudgetCycles'
import { Calendar, Save } from 'lucide-react'

export default function CycleForm({ onSuccess }: { onSuccess?: () => void }) {
  const { create } = useBudgetCycles()
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [totalAmount, setTotalAmount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({
      fiscal_year: fiscalYear,
      title,
      description,
      total_approved_amount: parseFloat(totalAmount),
      status: 'draft',
      start_date: startDate,
      end_date: endDate,
      created_by: 'current-user'
    })
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Calendar size={18}/> New Budget Cycle</h3>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fiscal Year</label>
          <input type="number" value={fiscalYear} onChange={e => setFiscalYear(parseInt(e.target.value))}
            className="w-full rounded-lg border px-3 py-2 text-sm" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Total Approved Amount</label>
          <input type="number" value={totalAmount} onChange={e => setTotalAmount(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="0.00" required/>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <input type="text" value={title} onChange={e => setTitle(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g., FY 2025 National Budget" required/>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
          className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Brief description..."/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" required/>
        </div>
      </div>
      <button type="submit" disabled={submitting}
        className="flex items-center gap-2 bg-treasury-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-treasury-700 disabled:opacity-50">
        <Save size={16}/> {submitting ? 'Creating...' : 'Create Cycle'}
      </button>
    </form>
  )
}
