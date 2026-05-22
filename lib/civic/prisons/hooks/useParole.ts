import { useState, useEffect, useCallback } from 'react';
import { PrisonParoleService } from '../services/prisonParole';

export function useParole(inmateId?: string) {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    setLoading(true);
    PrisonParoleService.getParoleReviews(inmateId)
      .then(setReviews)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [inmateId]);

  useEffect(() => { refresh(); }, [refresh]);

  return { reviews, loading, error, refresh };
}
