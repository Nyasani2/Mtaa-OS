import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useSearch() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    supabase
      .from('apps')
      .select('*')
      .limit(20)
      .then(({ data, error }) => {
        if (!isMounted) return;
        if (error) setError(error.message);
        else setData(data || []);
        setLoading(false);
      });
    return () => { isMounted = false; };
  }, []);

  return { data, loading, error, refetch: () => setLoading(true) };
}
