import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }

    const load = async () => {
      try {
        // FIXED: profiles -> user_profiles, .eq('id') -> .eq('user_id')
        const { data, error: err } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (err) throw err;
        setProfile(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId]);

  return { profile, loading, error };
}
