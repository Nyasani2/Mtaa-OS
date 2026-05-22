import { useState, useEffect, useCallback } from 'react';
import { PrisonCellsService } from '../services/prisonCells';

export function useCells(facilityId: string) {
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

  return { cells, loading, error, refresh };
}
