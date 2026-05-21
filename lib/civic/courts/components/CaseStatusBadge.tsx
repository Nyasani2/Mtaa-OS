import { CaseStatus } from '@/types/courts';

const statusColors: Record<CaseStatus, string> = {
  filed: 'bg-gray-100 text-gray-800',
  scheduled: 'bg-blue-100 text-blue-800',
  heard: 'bg-purple-100 text-purple-800',
  reserved: 'bg-amber-100 text-amber-800',
  judgment: 'bg-green-100 text-green-800',
  sentenced: 'bg-red-100 text-red-800',
  closed: 'bg-slate-100 text-slate-800',
  appealed: 'bg-indigo-100 text-indigo-800',
  dismissed: 'bg-orange-100 text-orange-800',
  withdrawn: 'bg-pink-100 text-pink-800',
};

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${statusColors[status] || statusColors.filed}`}>
      {status.replace('_', ' ')}
    </span>
  );
}
