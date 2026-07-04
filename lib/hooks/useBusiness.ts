import { useState, useCallback } from 'react';

export function useBusiness() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    // TODO: Implement
    setLoading(false);
  }, []);

  return { businesses, loading, fetchBusinesses };
}
