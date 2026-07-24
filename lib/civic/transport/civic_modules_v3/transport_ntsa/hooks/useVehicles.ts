// lib/civic/transport/civic_modules_v3/transport_ntsa/hooks/useVehicles.ts
import { useState, useEffect } from 'react';
import { useIdentity } from '@/lib/auth/identity';
import { supabase } from '@/lib/supabase';

export function useVehicles() {
  const { user } = useIdentity();
  const [vehicles, setVehicles] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    supabase.from('vehicle_registrations').select('*').eq('user_id', user.id)
      .then(({ data }) => { setVehicles(data ?? []); setLoading(false); });
  }, [user]);

  return { vehicles, loading };
}
