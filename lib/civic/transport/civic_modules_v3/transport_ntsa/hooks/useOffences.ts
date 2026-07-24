// lib/civic/transport/civic_modules_v3/transport_ntsa/hooks/useOffences.ts
import { useState, useEffect } from 'react';
import { useIdentity } from '@/lib/auth/identity';
import { supabase } from '@/lib/supabase';

export function useOffences() {
  const { user } = useIdentity();
  const [offences, setOffences] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from('traffic_offences').select('*').eq('user_id', user.id)
      .then(({ data }) => { setOffences(data ?? []); setLoading(false); });
  }, [user]);

  return { offences, loading };
}
