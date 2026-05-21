import { PrisonVisit } from '@/types/prisons';
import { formatDateTime } from '@/lib/utils';

const statusColors: Record<string, string> = {
  scheduled: 'bg-gray-100 text-gray-800',
  checked_in: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  denied: 'bg-orange-100 text-orange-800',
};

export function VisitsList({ visits, onCheckIn, onCheckOut }: { visits: PrisonVisit[]; onCheckIn?: (id: string) => void; onCheckOut?: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {visits.map(v => (
        <div key={v.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium">{v.visitor_name}</span>
              <span className="text-gray-500 ml-2">visiting {v.inmate?.full_name || '—'}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusColors[v.status] || 'bg-gray-100 text-gray-800'}`}>{v.status}</span>
          </div>
          <div className="text-gray-500 mt-1">{formatDateTime(v.scheduled_at)} • {v.duration_minutes} min • {v.visit_type}</div>
          {v.visitor_relationship && <div className="text-xs text-gray-600">Relationship: {v.visitor_relationship}</div>}
          {v.check_in && <div className="text-xs text-green-600">Checked in: {formatDateTime(v.check_in)}</div>}
          {v.check_out && <div className="text-xs text-blue-600">Checked out: {formatDateTime(v.check_out)}</div>}
          {v.items_seized?.length > 0 && <div className="text-xs text-red-600">Items seized: {v.items_seized.join(', ')}</div>}
          <div className="flex gap-2 mt-2">
            {onCheckIn && v.status === 'scheduled' && (
              <button onClick={() => onCheckIn(v.id)} className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Check In</button>
            )}
            {onCheckOut && v.status === 'checked_in' && (
              <button onClick={() => onCheckOut(v.id)} className="text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Check Out</button>
            )}
          </div>
        </div>
      ))}
      {visits.length === 0 && <div className="text-gray-400 text-sm">No visits scheduled</div>}
    </div>
  );
}
