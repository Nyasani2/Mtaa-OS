import { useState, useEffect, useCallback } from 'react';
import { CourtJuryService } from '../services/courtJury';

export function useJury(caseId?: string) {
  const [jurors, setJurors] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    Promise.all([
      CourtJuryService.getJurors(),
      CourtJuryService.getAssignments(caseId)
    ])
      .then(([j, a]) => { setJurors(j); setAssignments(a); })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { jurors, assignments, loading, error, refresh };
}
