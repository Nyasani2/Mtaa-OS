import { useState, useEffect, useCallback } from 'react';
import { PrisonIncidentsService } from '../services/prisonIncidents';

export function useIncidents(facilityId: string) {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonIncidentsService.getIncidents(facilityId)
      .then(setIncidents)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { incidents, loading, error, refresh };
}
