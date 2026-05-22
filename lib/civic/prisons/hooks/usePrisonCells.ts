import { useState, useEffect, useCallback } from 'react';
import { PrisonCellsService } from '../services/prisonCells';

export function usePrisonCells(facilityId: string) {
  const [cells, setCells] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonCellsService.getCells(facilityId)
      .then(setCells)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  const getCellStats = useCallback(() => {
    const total = cells.length;
    const occupied = cells.filter((c: any) => (c.current_occupancy || 0) > 0).length;
    const full = cells.filter((c: any) => (c.current_occupancy || 0) >= (c.capacity || 1)).length;
    return { total, occupied, full, available: total - full };
  }, [cells]);

  return { cells, loading, error, refresh, getCellStats };
}
