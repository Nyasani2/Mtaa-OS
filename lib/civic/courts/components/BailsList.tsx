import { CourtBail } from '@/types/courts';
import { formatCurrency, formatDate } from '@/lib/utils';

export function BailsList({ bails, caseId, onPost, onRelease }: { bails: CourtBail[]; caseId?: string; onPost?: (id: string) => void; onRelease?: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {bails.map(b => (
        <div key={b.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between">
            <span className="font-medium capitalize">{b.bail_type.replace('_', ' ')}</span>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
              b.status === 'posted' ? 'bg-green-100 text-green-800' :
              b.status === 'released' ? 'bg-blue-100 text-blue-800' :
              b.status === 'forfeited' ? 'bg-red-100 text-red-800' :
              'bg-gray-100 text-gray-800'
            }`}>{b.status}</span>
          </div>
          <div className="mt-1">Amount: {formatCurrency(b.amount)}</div>
          {b.party && <div className="text-xs text-gray-600">For: {b.party.full_name}</div>}
          {b.posted_date && <div className="text-xs text-gray-500">Posted: {formatDate(b.posted_date)}</div>}
          {b.conditions?.length > 0 && <div className="text-xs text-gray-600 mt-1">Conditions: {b.conditions.join(', ')}</div>}
          <div className="flex gap-2 mt-2">
            {onPost && b.status === 'pending' && (
              <button onClick={() => onPost(b.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Post Bail</button>
            )}
            {onRelease && b.status === 'posted' && (
              <button onClick={() => onRelease(b.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Release</button>
            )}
          </div>
        </div>
      ))}
      {bails.length === 0 && <div className="text-gray-400 text-sm">No bail records</div>}
    </div>
  );
}
