// lib/civic/transport/civic_modules_v3/transport_ntsa/hooks/useLicenses.ts
import { useState, useEffect } from 'react';
import { useIdentity } from '@/lib/auth/identity';
import { supabase } from '@/lib/supabase/client';

export function useLicenses() {
  const { user } = useIdentity();
  const [licenses, setLicenses] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from('driving_licenses').select('*').eq('user_id', user.id)
      .then(({ data }) => { setLicenses(data ?? []); setLoading(false); });
  }, [user]);

  return { licenses, loading };
}
