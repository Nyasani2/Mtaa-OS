import { useState, useCallback } from 'react';

export function useAnalytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    // TODO: Implement
    setLoading(false);
  }, []);

  return { data, loading, fetchAnalytics };
}
