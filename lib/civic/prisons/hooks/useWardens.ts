import { useState, useEffect, useCallback } from 'react';
import { PrisonWardensService } from '../services/prisonWardens';

export function useWardens(facilityId?: string) {
  const [wardens, setWardens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonWardensService.getWardens(facilityId)
      .then(setWardens)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { wardens, loading, error, refresh };
}
