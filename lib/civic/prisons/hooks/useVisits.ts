import { useState, useEffect, useCallback } from 'react';
import { PrisonVisitsService } from '../services/prisonVisits';

export function useVisits(facilityId?: string, inmateId?: string) {
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonVisitsService.getVisits(facilityId, inmateId)
      .then(setVisits)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId, inmateId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { visits, loading, error, refresh };
}
