import { PrisonProcurement } from '@/types/prisons';
import { formatCurrency } from '@/lib/utils';

const urgencyColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-800',
  normal: 'bg-blue-100 text-blue-800',
  high: 'bg-amber-100 text-amber-800',
  critical: 'bg-red-100 text-red-800',
};

export function ProcurementList({ items }: { items: PrisonProcurement[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Item</th>
            <th className="text-left px-3 py-2">Category</th>
            <th className="text-left px-3 py-2">Qty</th>
            <th className="text-left px-3 py-2">Total</th>
            <th className="text-left px-3 py-2">Urgency</th>
            <th className="text-left px-3 py-2">Vendor</th>
            <th className="text-left px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {items.map(i => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{i.item_name}</td>
              <td className="px-3 py-2 capitalize">{i.category.replace('_', ' ')}</td>
              <td className="px-3 py-2">{i.quantity}</td>
              <td className="px-3 py-2">{formatCurrency(i.total_cost)}</td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${urgencyColors[i.urgency] || 'bg-gray-100 text-gray-800'}`}>{i.urgency}</span>
              </td>
              <td className="px-3 py-2">{i.vendor_name || '—'}</td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                  i.status === 'delivered' ? 'bg-green-100 text-green-800' :
                  i.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                  i.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{i.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
