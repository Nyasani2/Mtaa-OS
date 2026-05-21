import { PrisonPayroll } from '@/types/prisons';
import { formatCurrency, formatDate } from '@/lib/utils';

export function PayrollList({ entries, onApprove, onPay }: { entries: PrisonPayroll[]; onApprove?: (id: string) => void; onPay?: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Staff</th>
            <th className="text-left px-3 py-2">Type</th>
            <th className="text-left px-3 py-2">Period</th>
            <th className="text-left px-3 py-2">Base</th>
            <th className="text-left px-3 py-2">Hazard</th>
            <th className="text-left px-3 py-2">Net</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {entries.map(e => (
            <tr key={e.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{e.staff_name}</td>
              <td className="px-3 py-2 capitalize">{e.staff_type}</td>
              <td className="px-3 py-2">{formatDate(e.pay_period_start)} – {formatDate(e.pay_period_end)}</td>
              <td className="px-3 py-2">{formatCurrency(e.base_amount)}</td>
              <td className="px-3 py-2">{formatCurrency(e.hazard_allowance)}</td>
              <td className="px-3 py-2 font-medium">{formatCurrency(e.net_amount)}</td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                  e.status === 'paid' ? 'bg-green-100 text-green-800' :
                  e.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{e.status}</span>
              </td>
              <td className="px-3 py-2">
                <div className="flex gap-1">
                  {onApprove && e.status === 'pending' && (
                    <button onClick={() => onApprove(e.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Approve</button>
                  )}
                  {onPay && e.status === 'approved' && (
                    <button onClick={() => onPay(e.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Pay</button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
