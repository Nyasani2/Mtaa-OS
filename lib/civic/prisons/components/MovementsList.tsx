import { PrisonMovement } from '@/types/prisons';
import { formatDateTime } from '@/lib/utils';

const typeColors: Record<string, string> = {
  intake: 'bg-blue-100 text-blue-800',
  transfer_in: 'bg-green-100 text-green-800',
  transfer_out: 'bg-amber-100 text-amber-800',
  release: 'bg-green-100 text-green-800',
  escape: 'bg-red-100 text-red-800',
  hospitalization: 'bg-purple-100 text-purple-800',
  court_appearance: 'bg-gray-100 text-gray-800',
};

export function MovementsList({ movements }: { movements: PrisonMovement[] }) {
  return (
    <div className="space-y-2">
      {movements.map(m => (
        <div key={m.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${typeColors[m.movement_type] || 'bg-gray-100 text-gray-800'}`}>
                {m.movement_type.replace('_', ' ')}
              </span>
              <span className="text-gray-500 ml-2">{m.inmate?.full_name || '—'}</span>
            </div>
            <span className="text-xs text-gray-500">{formatDateTime(m.occurred_at)}</span>
          </div>
          <div className="text-gray-600 mt-1">{m.reason}</div>
          {m.from_facility_id && <div className="text-xs text-gray-500">From: {m.from_facility_id}</div>}
          {m.to_facility_id && <div className="text-xs text-gray-500">To: {m.to_facility_id}</div>}
        </div>
      ))}
      {movements.length === 0 && <div className="text-gray-400 text-sm">No movements recorded</div>}
    </div>
  );
}
