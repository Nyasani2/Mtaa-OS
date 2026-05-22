import { useState, useEffect, useCallback } from 'react';
import { PrisonInmatesService } from '../services/prisonInmates';

export function usePrisonInmates(facilityId?: string) {
  const [inmates, setInmates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonInmatesService.getInmates(facilityId)
      .then(setInmates)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  const searchInmates = useCallback((query: string) => {
    const q = query.toLowerCase();
    return inmates.filter((inmate: any) =>
      (inmate.first_name || '').toLowerCase().includes(q) ||
      (inmate.last_name || '').toLowerCase().includes(q) ||
      (inmate.inmate_number || '').toLowerCase().includes(q)
    );
  }, [inmates]);

  return { inmates, loading, error, refresh, searchInmates };
}
