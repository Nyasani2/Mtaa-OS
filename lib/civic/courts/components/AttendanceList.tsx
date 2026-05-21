import { CourtStaffAttendance } from '@/types/courts';
import { formatDateTime } from '@/lib/utils';

export function AttendanceList({ records, onClockOut }: { records: CourtStaffAttendance[]; onClockOut?: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            <th className="text-left px-3 py-2">Staff</th>
            <th className="text-left px-3 py-2">Type</th>
            <th className="text-left px-3 py-2">Date</th>
            <th className="text-left px-3 py-2">In</th>
            <th className="text-left px-3 py-2">Out</th>
            <th className="text-left px-3 py-2">Hours</th>
            <th className="text-left px-3 py-2">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {records.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium">{r.staff_name}</td>
              <td className="px-3 py-2 capitalize">{r.staff_type}</td>
              <td className="px-3 py-2">{r.shift_date}</td>
              <td className="px-3 py-2">{r.clock_in ? formatDateTime(r.clock_in).split(',')[1] : '—'}</td>
              <td className="px-3 py-2">{r.clock_out ? formatDateTime(r.clock_out).split(',')[1] : '—'}</td>
              <td className="px-3 py-2">{r.hours_worked || '—'}</td>
              <td className="px-3 py-2">
                {onClockOut && !r.clock_out && (
                  <button onClick={() => onClockOut(r.id)} className="text-xs bg-amber-600 text-white px-2 py-1 rounded hover:bg-amber-700">Clock Out</button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
