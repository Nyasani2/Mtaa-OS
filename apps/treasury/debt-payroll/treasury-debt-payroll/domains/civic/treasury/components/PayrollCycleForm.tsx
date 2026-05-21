'use client'
import { useState } from 'react'
import { usePayrollCycles } from '../hooks/usePayrollCycles'
import { Users, Save } from 'lucide-react'

export default function PayrollCycleForm({ onSuccess }: { onSuccess?: () => void }) {
  const { create } = usePayrollCycles()
  const [name, setName] = useState('')
  const [periodStart, setPeriodStart] = useState('')
  const [periodEnd, setPeriodEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    await create({
      cycle_name: name,
      period_start: periodStart,
      period_end: periodEnd,
      status: 'draft',
      created_by: 'current-user'
    })
    setSubmitting(false)
    onSuccess?.()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="font-semibold text-gray-900 flex items-center gap-2"><Users size={18}/> New Payroll Cycle</h3>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name</label>
        <input type="text" value={name} onChange={e => setName(e.target.value)}
          className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="e.g., January 2025" required/>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period Start</label>
          <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
            className="w-full rounded-lg border px-3 py-2 text-sm" required/>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Period End</label>
          <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
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
