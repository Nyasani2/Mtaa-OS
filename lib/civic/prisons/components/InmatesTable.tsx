import Link from 'next/link';
import { PrisonInmate } from '@/types/prisons';
import { InmateStatusBadge } from './InmateStatusBadge';
import { RiskBadge } from './RiskBadge';
import { formatDate } from '@/lib/utils';

export function InmatesTable({ inmates, compact }: { inmates: PrisonInmate[]; compact?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Number</th>
            <th className="text-left px-3 py-2">Name</th>
            {!compact && <th className="text-left px-3 py-2">Facility</th>}
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Risk</th>
            {!compact && <th className="text-left px-3 py-2">Cell</th>}
            <th className="text-left px-3 py-2">Sentence End</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {inmates.map(i => (
            <tr key={i.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">
                <Link href={`/inmates/${i.id}`} className="text-blue-600 hover:underline">{i.inmate_number}</Link>
              </td>
              <td className="px-3 py-2">{i.full_name}</td>
              {!compact && <td className="px-3 py-2">{i.facility?.name || '—'}</td>}
              <td className="px-3 py-2"><InmateStatusBadge status={i.status} /></td>
              <td className="px-3 py-2"><RiskBadge level={i.risk_level} /></td>
              {!compact && <td className="px-3 py-2">{i.cell_block || '—'} {i.cell_number || ''}</td>}
              <td className="px-3 py-2">{formatDate(i.sentence_end)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
