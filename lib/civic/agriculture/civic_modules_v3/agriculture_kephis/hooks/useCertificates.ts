// lib/civic/agriculture/civic_modules_v3/agriculture_kephis/hooks/useCertificates.ts
import { useState, useEffect } from 'react';
import { useIdentity } from '@/lib/auth/identity';
import { supabase } from '@/lib/supabase/client';

export function useCertificates() {
  const { user } = useIdentity();
  const [certificates, setCertificates] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from('certificates').select('*').eq('user_id', user.id)
      .then(({ data }) => { setCertificates(data ?? []); setLoading(false); });
  }, [user]);

  return { certificates, loading };
}
