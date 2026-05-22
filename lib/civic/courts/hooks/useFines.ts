import { useState, useEffect, useCallback } from 'react';
import { CourtFinesService } from '../services/courtFines';

export function useFines(caseId?: string) {
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtFinesService.getFines(caseId)
      .then(setFines)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { fines, loading, error, refresh };
}
