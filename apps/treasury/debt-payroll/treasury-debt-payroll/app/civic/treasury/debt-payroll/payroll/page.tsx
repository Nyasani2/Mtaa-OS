'use client'
import PayrollCycleForm from '@/domains/civic/treasury/components/PayrollCycleForm'
import { usePayrollCycles } from '@/domains/civic/treasury/hooks/usePayrollCycles'
import { CheckCircle, Play, DollarSign, RotateCcw } from 'lucide-react'

export default function PayrollPage() {
  const { cycles, loading, updateStatus, reverse } = usePayrollCycles()

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

  return (
    <div className="space-y-6">
      <PayrollCycleForm/>
      <div className="bg-white rounded-lg border">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-900">Payroll Cycles</h3>
        </div>
        <div className="divide-y">
          {cycles.map(c => (
            <div key={c.id} className="px-6 py-4 hover:bg-gray-50 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">{c.cycle_name}</p>
                <p className="text-xs text-gray-500">{c.employee_count} employees • {fmt(c.total_net_pay)} net</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  c.status === 'paid' ? 'bg-green-50 text-green-700' :
                  c.status === 'approved' ? 'bg-blue-50 text-blue-700' :
                  c.status === 'processing' ? 'bg-purple-50 text-purple-700' :
                  'bg-gray-50 text-gray-600'
                }`}>{c.status}</span>
                {c.status === 'draft' && (
                  <button onClick={() => updateStatus(c.id, 'processing')}
                    className="text-xs bg-purple-600 text-white px-3 py-1 rounded-full hover:bg-purple-700">Process</button>
                )}
                {c.status === 'processing' && (
                  <button onClick={() => updateStatus(c.id, 'approved')}
                    className="text-xs bg-blue-600 text-white px-3 py-1 rounded-full hover:bg-blue-700">Approve</button>
                )}
                {c.status === 'approved' && (
                  <button onClick={() => updateStatus(c.id, 'paid')}
                    className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 flex items-center gap-1">
                    <DollarSign size={12}/> Pay
                  </button>
                )}
                {c.status === 'paid' && (
                  <button onClick={() => reverse(c.id)}
                    className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full hover:bg-red-100 flex items-center gap-1">
                    <RotateCcw size={12}/> Reverse
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
