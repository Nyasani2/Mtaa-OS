import { useState, useEffect, useCallback } from 'react';
import { CourtAttendanceService } from '../services/courtAttendance';

export function useAttendance(courtHouseId: string, date?: string) {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtAttendanceService.getAttendance(courtHouseId, date)
      .then(setRecords)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [courtHouseId, date]);

  useEffect(() => { refresh(); }, [refresh]);

  return { records, loading, error, refresh };
}
