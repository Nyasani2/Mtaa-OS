import { PrisonWarden } from '@/types/prisons';
import { formatDate } from '@/lib/utils';

export function WardensTable({ wardens }: { wardens: PrisonWarden[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Badge</th>
            <th className="text-left px-3 py-2">Name</th>
            <th className="text-left px-3 py-2">Rank</th>
            <th className="text-left px-3 py-2">Shift</th>
            <th className="text-left px-3 py-2">Phone</th>
            <th className="text-left px-3 py-2">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {wardens.map(w => (
            <tr key={w.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{w.badge_number || w.warden_number}</td>
              <td className="px-3 py-2">{w.full_name}</td>
              <td className="px-3 py-2 capitalize">{w.rank}</td>
              <td className="px-3 py-2 capitalize">{w.shift}</td>
              <td className="px-3 py-2">{w.phone}</td>
              <td className="px-3 py-2">
                <span className={`text-xs px-2 py-0.5 rounded ${w.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {w.is_active ? 'Active' : 'Inactive'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
