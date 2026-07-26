import { useState, useCallback } from 'react';

export function useCreator() {
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchContent = useCallback(async () => {
    setLoading(true);
    // TODO: Implement
    setLoading(false);
  }, []);

  return { content, loading, fetchContent };
}
