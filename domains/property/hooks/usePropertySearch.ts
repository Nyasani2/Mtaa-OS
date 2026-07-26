import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function usePropertySearch() {
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (query: string, location?: string, maxPrice?: number) => {
    setLoading(true);
    try {
      let q = supabase.from('properties').select('*').ilike('title', `%${query}%`);
      if (location) q = q.ilike('location', `%${location}%`);
      if (maxPrice) q = q.lte('price', maxPrice);
      const { data } = await q.limit(50);
      setResults(data || []);
    } catch (e) { setResults([]); }
    setLoading(false);
  }, []);

  return { results, loading, search };
}
