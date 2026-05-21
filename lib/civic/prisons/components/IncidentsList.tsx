import { PrisonIncident } from '@/types/prisons';
import { formatDateTime } from '@/lib/utils';

const severityColors: Record<string, string> = {
  minor: 'bg-gray-100 text-gray-800',
  moderate: 'bg-yellow-100 text-yellow-800',
  major: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const statusColors: Record<string, string> = {
  open: 'bg-red-100 text-red-800',
  under_investigation: 'bg-amber-100 text-amber-800',
  resolved: 'bg-green-100 text-green-800',
  closed: 'bg-gray-100 text-gray-800',
};

export function IncidentsList({ incidents, onResolve }: { incidents: PrisonIncident[]; onResolve?: (id: string) => void }) {
  return (
    <div className="space-y-2">
      {incidents.map(i => (
        <div key={i.id} className="border rounded p-3 text-sm">
          <div className="flex justify-between items-start">
            <div>
              <span className={`text-xs px-2 py-0.5 rounded capitalize font-medium ${severityColors[i.severity] || 'bg-gray-100 text-gray-800'}`}>
                {i.severity}
              </span>
              <span className="font-medium ml-2 capitalize">{i.incident_type.replace('_', ' ')}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded capitalize ${statusColors[i.status] || 'bg-gray-100 text-gray-800'}`}>{i.status.replace('_', ' ')}</span>
          </div>
          <div className="text-gray-600 mt-1">{i.description}</div>
          <div className="text-xs text-gray-500 mt-1">{i.location} • {formatDateTime(i.created_at)}</div>
          {i.inmate && <div className="text-xs text-gray-600">Inmate: {i.inmate.full_name}</div>}
          {i.reporter && <div className="text-xs text-gray-600">Reported by: {i.reporter.full_name}</div>}
          {i.witnesses?.length > 0 && <div className="text-xs text-gray-500">Witnesses: {i.witnesses.join(', ')}</div>}
          {i.resolution_notes && <div className="text-xs text-green-600 mt-1">Resolution: {i.resolution_notes}</div>}
          {onResolve && i.status === 'open' && (
            <button onClick={() => onResolve(i.id)} className="mt-2 text-xs bg-green-600 text-white px-2 py-1 rounded hover:bg-green-700">Resolve</button>
          )}
        </div>
      ))}
      {incidents.length === 0 && <div className="text-gray-400 text-sm">No incidents</div>}
    </div>
  );
}
