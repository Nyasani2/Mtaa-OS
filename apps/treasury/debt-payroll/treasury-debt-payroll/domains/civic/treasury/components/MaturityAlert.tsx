'use client'
import { useDebtInstruments } from '../hooks/useDebtInstruments'
import { AlertTriangle, Calendar } from 'lucide-react'

export default function MaturityAlert() {
  const { instruments, loading } = useDebtInstruments()

  if (loading) return null

  const now = new Date()
  const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const maturing = instruments.filter(i => new Date(i.maturity_date) <= thirtyDays && i.status === 'active')

  if (!maturing.length) return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
      <Calendar size={18} className="text-green-600"/>
      <p className="text-sm text-green-700 font-medium">No maturities within 30 days</p>
    </div>
  )

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle size={18} className="text-amber-600"/>
        <h3 className="font-semibold text-amber-800">Maturity Alerts</h3>
      </div>
      <div className="space-y-1">
        {maturing.map(i => (
          <p key={i.id} className="text-sm text-amber-700">
            {i.creditor_name} — {new Date(i.maturity_date).toLocaleDateString()} ({i.instrument_type})
          </p>
        ))}
      </div>
    </div>
  )
}
