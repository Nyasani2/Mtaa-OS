import { useState, useEffect, useCallback } from 'react';
import { PrisonInmatesService } from '../services/prisonInmates';

export function useInmates(facilityId?: string) {
  const [inmates, setInmates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonInmatesService.getInmates(facilityId)
      .then(setInmates)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { inmates, loading, error, refresh };
}
