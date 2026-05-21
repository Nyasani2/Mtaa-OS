import { InmateStatus } from '@/types/prisons';

const colors: Record<InmateStatus, string> = {
  admitted: 'bg-blue-100 text-blue-800',
  transferred: 'bg-amber-100 text-amber-800',
  released: 'bg-green-100 text-green-800',
  escaped: 'bg-red-100 text-red-800',
  deceased: 'bg-slate-100 text-slate-800',
  hospitalized: 'bg-purple-100 text-purple-800',
  awaiting_trial: 'bg-gray-100 text-gray-800',
};

export function InmateStatusBadge({ status }: { status: InmateStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${colors[status] || colors.admitted}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
