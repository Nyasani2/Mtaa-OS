'use client'
import { usePayrollEntries } from '../hooks/usePayrollEntries'
import { Fingerprint, CheckCircle, DollarSign } from 'lucide-react'

export default function PayrollEntryTable({ cycleId }: { cycleId: string }) {
  const { entries, loading, verifyBiometric, approve } = usePayrollEntries(cycleId)

  if (loading) return <div className="h-48 bg-gray-100 rounded-lg animate-pulse"/>

  const fmt = (n: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

  return (
    <div className="bg-white rounded-lg border">
      <div className="px-6 py-4 border-b">
        <h3 className="font-semibold text-gray-900">Employee Entries</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500">Employee</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Gross Pay</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Deductions</th>
              <th className="px-6 py-3 text-right font-medium text-gray-500">Net Pay</th>
              <th className="px-6 py-3 text-center font-medium text-gray-500">Biometric</th>
              <th className="px-6 py-3 text-center font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {entries.map(e => (
              <tr key={e.id} className="hover:bg-gray-50">
                <td className="px-6 py-3">
                  <p className="font-medium text-gray-900">{e.employee_name}</p>
                  <p className="text-xs text-gray-500">{e.employee_id}</p>
                </td>
                <td className="px-6 py-3 text-right text-gray-600">{fmt(e.gross_pay)}</td>
                <td className="px-6 py-3 text-right text-red-600">{fmt(e.total_deductions)}</td>
                <td className="px-6 py-3 text-right font-medium text-gray-900">{fmt(e.net_pay)}</td>
                <td className="px-6 py-3 text-center">
                  {e.biometric_verified ? (
                    <span className="inline-flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full">
                      <Fingerprint size={12}/> Verified
                    </span>
                  ) : (
                    <button onClick={() => verifyBiometric(e.id)}
                      className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full hover:bg-gray-200 flex items-center gap-1">
                      <Fingerprint size={12}/> Verify
                    </button>
                  )}
                </td>
                <td className="px-6 py-3 text-center">
                  {e.status === 'draft' && (
                    <button onClick={() => approve(e.id)}
                      className="text-xs bg-treasury-600 text-white px-3 py-1 rounded-full hover:bg-treasury-700 flex items-center gap-1">
                      <CheckCircle size={12}/> Approve
                    </button>
                  )}
                  <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                    e.status === 'approved' ? 'bg-green-50 text-green-700' :
                    e.status === 'paid' ? 'bg-blue-50 text-blue-700' :
                    'bg-gray-50 text-gray-600'
                  }`}>{e.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
