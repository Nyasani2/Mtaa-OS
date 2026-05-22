import { useState, useEffect, useCallback } from 'react';
import { CourtBailsService } from '../services/courtBails';

export function useBails(caseId?: string) {
  const [bails, setBails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtBailsService.getBails(caseId)
      .then(setBails)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { bails, loading, error, refresh };
}
