import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export function useProfile(userId?: string) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase.from('profiles').select('*').eq('id', userId).single()
      .then(({ data, error }) => {
        if (!error) setProfile(data);
        setLoading(false);
      });
  }, [userId]);

  return { profile, loading };
}
