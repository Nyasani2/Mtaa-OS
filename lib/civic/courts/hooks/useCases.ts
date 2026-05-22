import { useState, useEffect, useCallback } from 'react';
import { CourtCasesService } from '../services/courtCases';

export function useCases(courtHouseId?: string) {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtCasesService.getCases(courtHouseId)
      .then(setCases)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { cases, loading, error, refresh };
}
