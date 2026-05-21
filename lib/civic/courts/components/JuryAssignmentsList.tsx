import { CourtJuryAssignment } from '@/types/courts';
import { formatDate } from '@/lib/utils';

export function JuryAssignmentsList({ assignments }: { assignments: CourtJuryAssignment[] }) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {assignments.map(a => (
        <div key={a.id} className="border rounded p-2 text-sm">
          <div className="flex justify-between">
            <span className="font-medium">{a.juror?.full_name || 'Unknown'}</span>
            {a.is_foreperson && <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Foreperson</span>}
          </div>
          <div className="text-xs text-gray-500">Assigned: {formatDate(a.assigned_date)}</div>
          {a.stipend_amount > 0 && <div className="text-xs text-green-600">Stipend: KES {a.stipend_amount}</div>}
        </div>
      ))}
    </div>
  );
}
