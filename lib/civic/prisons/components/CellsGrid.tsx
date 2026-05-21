import { PrisonCell } from '@/types/prisons';

export function CellsGrid({ cells }: { cells: PrisonCell[] }) {
  const blocks = Array.from(new Set(cells.map(c => c.cell_block))).sort();

  return (
    <div className="space-y-6">
      {blocks.map(block => (
        <div key={block}>
          <h3 className="text-lg font-semibold mb-3">{block}</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {cells.filter(c => c.cell_block === block).map(cell => {
              const occupancyPct = cell.capacity > 0 ? (cell.current_occupancy / cell.capacity) * 100 : 0;
              const isFull = cell.current_occupancy >= cell.capacity;
              const isOver = cell.current_occupancy > cell.capacity;
              return (
                <div key={cell.id} className={`border rounded-lg p-3 text-center ${
                  isOver ? 'border-red-400 bg-red-50' : isFull ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50'
                }`}>
                  <div className="text-lg font-bold">{cell.cell_number}</div>
                  <div className="text-xs text-gray-500 capitalize">{cell.cell_type}</div>
                  <div className="text-sm mt-1">{cell.current_occupancy}/{cell.capacity}</div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                    <div className={`h-1.5 rounded-full ${isOver ? 'bg-red-600' : isFull ? 'bg-amber-600' : 'bg-green-600'}`} style={{ width: `${Math.min(100, occupancyPct)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
