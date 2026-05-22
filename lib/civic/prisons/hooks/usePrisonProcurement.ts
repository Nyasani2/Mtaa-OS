import { useState, useEffect, useCallback } from 'react';
import { PrisonProcurementService } from '../services/prisonProcurement';

export function usePrisonProcurement(facilityId?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonProcurementService.getProcurements(facilityId)
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}
