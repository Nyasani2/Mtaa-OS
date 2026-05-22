import { useState, useEffect, useCallback } from 'react';
import { CourtJudgesService } from '../services/courtJudges';

export function useJudges(courtHouseId?: string) {
  const [judges, setJudges] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtJudgesService.getJudges(courtHouseId)
      .then(setJudges)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { judges, loading, error, refresh };
}
