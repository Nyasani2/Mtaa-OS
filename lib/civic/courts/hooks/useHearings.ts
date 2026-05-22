import { useState, useEffect, useCallback } from 'react';
import { CourtHearingsService } from '../services/courtHearings';

export function useHearings(courtHouseId?: string, caseId?: string) {
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtHearingsService.getHearings(courtHouseId, caseId)
      .then(setHearings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId, caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { hearings, loading, error, refresh };
}
