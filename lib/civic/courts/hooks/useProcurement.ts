import { useState, useEffect, useCallback } from 'react';
import { CourtProcurementService } from '../services/courtProcurement';

export function useProcurement(courtHouseId?: string) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtProcurementService.getProcurements(courtHouseId)
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { items, loading, error, refresh };
}
