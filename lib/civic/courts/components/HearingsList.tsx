import { CourtHearing } from '@/types/courts';
import { formatDateTime } from '@/lib/utils';

export function HearingsList({ hearings, caseId }: { hearings: CourtHearing[]; caseId?: string }) {
  return (
    <div className="space-y-2">
      {hearings.map(h => (
        <div key={h.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className="font-medium capitalize">{h.hearing_type.replace('_', ' ')}</span>
              <span className="text-gray-500 ml-2">{h.court_room?.room_number || '—'}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${
              h.status === 'completed' ? 'bg-green-100 text-green-800' :
              h.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
              h.status === 'adjourned' ? 'bg-amber-100 text-amber-800' :
              'bg-gray-100 text-gray-800'
            }`}>{h.status}</span>
          </div>
          <div className="text-gray-500 mt-1">{formatDateTime(h.scheduled_date)}</div>
          {h.presiding_judge && <div className="text-xs text-gray-600">Judge: {h.presiding_judge.full_name}</div>}
          {h.adjournment_reason && <div className="text-xs text-amber-600">Adjourned: {h.adjournment_reason}</div>}
        </div>
      ))}
      {hearings.length === 0 && <div className="text-gray-400 text-sm">No hearings scheduled</div>}
    </div>
  );
}
