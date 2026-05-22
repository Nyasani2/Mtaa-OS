import { useState, useEffect, useCallback } from 'react';
import { PrisonAttendanceService } from '../services/prisonAttendance';

export function usePrisonAttendance(facilityId: string, date?: string) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonAttendanceService.getAttendance(facilityId, date)
      .then(setRecords)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [facilityId, date]);

  useEffect(() => { refresh(); }, [refresh]);

  return { records, loading, error, refresh };
}
