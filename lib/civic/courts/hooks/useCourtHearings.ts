import { useState, useEffect, useCallback } from 'react';
import { CourtHearingsService } from '../services/courtHearings';

export function useCourtHearings(courtHouseId?: string, caseId?: string) {
  const [hearings, setHearings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtHearingsService.getHearings(courtHouseId, caseId)
      .then(setHearings)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId, caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  const getUpcomingHearings = useCallback(() => {
    const now = new Date().toISOString();
    return hearings.filter((h: any) => h.scheduled_date > now && h.status !== 'completed');
  }, [hearings]);

  return { hearings, loading, error, refresh, getUpcomingHearings };
}
