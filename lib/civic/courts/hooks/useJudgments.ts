import { useState, useEffect, useCallback } from 'react';
import { CourtJudgmentsService } from '../services/courtJudgments';

export function useJudgments(caseId?: string) {
  const [judgments, setJudgments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    CourtJudgmentsService.getJudgments(caseId)
      .then(setJudgments)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [caseId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { judgments, loading, error, refresh };
}
