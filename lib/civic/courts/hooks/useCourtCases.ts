import { useState, useEffect, useCallback } from 'react';
import { CourtCasesService } from '../services/courtCases';

export function useCourtCases(courtHouseId?: string) {
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

  const getCaseStats = useCallback(() => {
    const byStatus: Record<string, number> = {};
    const byType: Record<string, number> = {};
    cases.forEach((c: any) => {
      byStatus[c.status] = (byStatus[c.status] || 0) + 1;
      byType[c.case_type] = (byType[c.case_type] || 0) + 1;
    });
    return { total: cases.length, byStatus, byType };
  }, [cases]);

  return { cases, loading, error, refresh, getCaseStats };
}
