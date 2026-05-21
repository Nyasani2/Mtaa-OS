import Link from 'next/link';
import { CourtCase } from '@/types/courts';
import { CaseStatusBadge } from './CaseStatusBadge';
import { formatDate } from '@/lib/utils';

export function CasesTable({ cases, compact }: { cases: CourtCase[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Case #</th>
            {!compact && <th className="text-left px-3 py-2">Type</th>}
            <th className="text-left px-3 py-2">Status</th>
            {!compact && <th className="text-left px-3 py-2">Court</th>}
            <th className="text-left px-3 py-2">Filed</th>
            {!compact && <th className="text-left px-3 py-2">Judge</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {cases.map(c => (
            <tr key={c.id} className="hover:bg-gray-50">
              <td className="px-3 py-2">
                <Link href={`/cases/${c.id}`} className="text-blue-600 hover:underline font-medium">
                  {c.case_number}
                </Link>
              </td>
              {!compact && <td className="px-3 py-2 capitalize">{c.case_type}</td>}
              <td className="px-3 py-2"><CaseStatusBadge status={c.status} /></td>
              {!compact && <td className="px-3 py-2">{c.court_house?.name || '—'}</td>}
              <td className="px-3 py-2">{formatDate(c.filing_date)}</td>
              {!compact && <td className="px-3 py-2">{c.assigned_judge?.full_name || '—'}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
