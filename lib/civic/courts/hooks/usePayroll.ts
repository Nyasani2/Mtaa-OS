import { useState, useEffect, useCallback } from 'react';
import { CourtPayrollService } from '../services/courtPayroll';

export function usePayroll(courtHouseId?: string, period?: string) {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtPayrollService.getPayroll(courtHouseId, period)
      .then(setPayrolls)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId, period]);

  useEffect(() => { refresh(); }, [refresh]);

  return { payrolls, loading, error, refresh };
}
