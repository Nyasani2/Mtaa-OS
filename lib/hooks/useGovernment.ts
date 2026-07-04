import { useState, useCallback } from 'react';

export function useGovernment() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    // TODO: Implement
    setLoading(false);
  }, []);

  return { services, loading, fetchServices };
}
