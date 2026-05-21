import { CourtFine } from '@/types/courts';
import { formatCurrency, formatDate } from '@/lib/utils';

export function FinesList({ fines, caseId, onRecordPayment }: { fines: CourtFine[]; caseId?: string; onRecordPayment?: (id: string, amount: number) => void }) {
  return (
    <div className="space-y-2">
      {fines.map(f => (
        <div key={f.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium capitalize">{f.fine_type.replace('_', ' ')}</span>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
              f.payment_status === 'paid' ? 'bg-green-100 text-green-800' :
              f.payment_status === 'partial' ? 'bg-amber-100 text-amber-800' :
              'bg-red-100 text-red-800'
            }`}>{f.payment_status}</span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Amount: {formatCurrency(f.amount)}</span>
            <span>Paid: {formatCurrency(f.amount_paid)}</span>
          </div>
          {f.due_date && <div className="text-xs text-gray-500">Due: {formatDate(f.due_date)}</div>}
          {f.receipt_number && <div className="text-xs text-green-600">Receipt: {f.receipt_number}</div>}
          {onRecordPayment && f.payment_status !== 'paid' && (
            <button onClick={() => onRecordPayment(f.id, f.amount)} className="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">
              Record Payment
            </button>
          )}
        </div>
      ))}
      {fines.length === 0 && <div className="text-gray-400 text-sm">No fines recorded</div>}
    </div>
  );
}
