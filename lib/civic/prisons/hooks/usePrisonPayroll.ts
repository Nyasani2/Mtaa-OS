import { useState, useEffect, useCallback } from 'react';
import { PrisonPayrollService } from '../services/prisonPayroll';

export function usePrisonPayroll(facilityId?: string, period?: string) {
  const [payrolls, setPayrolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonPayrollService.getPayroll(facilityId, period)
      .then(setPayrolls)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId, period]);

  useEffect(() => { refresh(); }, [refresh]);

  return { payrolls, loading, error, refresh };
}
