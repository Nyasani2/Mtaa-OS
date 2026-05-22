import { useState, useEffect, useCallback } from 'react';
import { CourtAppealsService } from '../services/courtAppeals';

export function useAppeals(courtHouseId?: string) {
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtAppealsService.getAppeals(courtHouseId)
      .then(setAppeals)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { appeals, loading, error, refresh };
}
