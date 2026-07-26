import { useState, useCallback } from 'react';

export function useSearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string) => {
    setLoading(true);
    // TODO: Implement
    setLoading(false);
  }, []);

  return { results, loading, search };
}
