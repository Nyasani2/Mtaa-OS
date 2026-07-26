import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tribe, TribePost } from '@/lib/tribes/types';

export function useTribes() {
  const [tribes, setTribes] = useState<Tribe[]>([]);
  const [posts, setPosts] = useState<TribePost[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTribes = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('tribes').select('*').limit(50);
    if (!error) setTribes(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTribes(); }, [fetchTribes]);
  return { tribes, posts, loading, fetchTribes };
}
