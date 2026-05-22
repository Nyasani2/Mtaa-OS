import { useState, useEffect, useCallback } from 'react';
import { CourtStatsService } from '../services/courtStats';

export function useStats(courtHouseId: string) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtStatsService.getStats(courtHouseId)
      .then(setStats)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { stats, loading, error, refresh };
}
