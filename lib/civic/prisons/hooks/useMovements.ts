import { useState, useEffect, useCallback } from 'react';
import { PrisonMovementsService } from '../services/prisonMovements';

export function useMovements(facilityId?: string) {
  const [movements, setMovements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonMovementsService.getMovements(facilityId)
      .then(setMovements)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { movements, loading, error, refresh };
}
