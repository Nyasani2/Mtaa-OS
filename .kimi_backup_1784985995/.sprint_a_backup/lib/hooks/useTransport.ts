import { useState, useCallback } from 'react';

export function useTransport() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRoutes = useCallback(async () => {
    setLoading(true);
    // TODO: Implement
    setLoading(false);
  }, []);

  return { routes, loading, fetchRoutes };
}
