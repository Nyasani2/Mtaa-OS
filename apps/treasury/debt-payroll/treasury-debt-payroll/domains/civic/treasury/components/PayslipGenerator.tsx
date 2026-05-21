'use client'
import { usePayrollEntries } from '../hooks/usePayrollEntries'
import { FileText, Download } from 'lucide-react'

export default function PayslipGenerator({ cycleId }: { cycleId: string }) {
  const { entries, loading } = usePayrollEntries(cycleId)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2"><FileText size={18}/> Payslips</h3>
        <button className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700 flex items-center gap-1">
          <Download size={12}/> Export All
        </button>
      </div>
      <div className="divide-y">
        {entries.map(e => (
          <div key={e.id} className="px-6 py-4 hover:bg-gray-50">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium text-sm text-gray-900">{e.employee_name}</p>
              <button className="text-xs text-treasury-600 hover:text-treasury-700 font-medium flex items-center gap-1">
                <Download size={12}/> PDF
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><span className="text-gray-500">Basic:</span> {fmt(e.basic_salary)}</div>
              <div><span className="text-gray-500">Allowances:</span> {fmt(e.allowances)}</div>
              <div><span className="text-gray-500">Overtime:</span> {fmt(e.overtime)}</div>
              <div><span className="text-gray-500">Tax:</span> <span className="text-red-600">{fmt(e.tax_deduction)}</span></div>
              <div><span className="text-gray-500">Pension:</span> <span className="text-red-600">{fmt(e.pension_deduction)}</span></div>
              <div><span className="text-gray-500">Net:</span> <span className="font-medium">{fmt(e.net_pay)}</span></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
