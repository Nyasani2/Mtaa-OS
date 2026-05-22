import { useState, useEffect, useCallback } from 'react';
import { PrisonStatsService } from '../services/prisonStats';

export function usePrisonStats(facilityId: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonStatsService.getStats(facilityId)
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, error, refresh };
}
