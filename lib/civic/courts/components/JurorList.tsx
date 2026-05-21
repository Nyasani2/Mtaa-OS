import { CourtJuror } from '@/types/courts';

export function JurorList({ jurors }: { jurors: CourtJuror[] }) {
  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {jurors.map(j => (
        <div key={j.id} className="border rounded p-2 text-sm flex justify-between items-center">
          <div>
            <div className="font-medium">{j.full_name}</div>
            <div className="text-xs text-gray-500">{j.id_number} • {j.occupation || 'No occupation'}</div>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded ${j.is_available ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
            {j.is_available ? 'Available' : 'Unavailable'}
          </span>
        </div>
      ))}
    </div>
  );
}
