import { CourtAppeal } from '@/types/courts';
import { formatDate } from '@/lib/utils';

export function AppealsTable({ appeals }: { appeals: CourtAppeal[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Appeal #</th>
            <th className="text-left px-3 py-2">Original Case</th>
            <th className="text-left px-3 py-2">Type</th>
            <th className="text-left px-3 py-2">Status</th>
            <th className="text-left px-3 py-2">Filed</th>
            <th className="text-left px-3 py-2">Appellate Court</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {appeals.map(a => (
            <tr key={a.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{a.appeal_case_number}</td>
              <td className="px-3 py-2">{a.original_case?.case_number || '—'}</td>
              <td className="px-3 py-2 capitalize">{a.appeal_type.replace(/_/g, ' ')}</td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded capitalize ${
                  a.status === 'allowed' ? 'bg-green-100 text-green-800' :
                  a.status === 'dismissed' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>{a.status.replace(/_/g, ' ')}</span>
              </td>
              <td className="px-3 py-2">{formatDate(a.filing_date)}</td>
              <td className="px-3 py-2">{a.appellate_court?.name || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
