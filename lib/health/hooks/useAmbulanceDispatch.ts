import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useAmbulanceDispatch() {
  const { user } = useAuthStore();
  const [units, setUnits] = useState<any[]>([]);
  const [activeDispatches, setActiveDispatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    const { data: u } = await supabase.from('health_ambulance_units').select('*').order('status', { ascending: true });
    setUnits(u || []);
    const { data: d } = await supabase.from('health_ambulance_dispatches').select('*').in('status', ['dispatched','en_route','on_scene','transporting']).order('created_at', { ascending: false });
    setActiveDispatches(d || []);
  }, [supabase]);

  const createDispatch = useCallback(async (payload: any) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('health_ambulance_dispatches').insert({ ...payload, dispatcher_id: user?.id, status: 'dispatched' }).select().single();
      if (error) throw error;
      if (payload.unit_id) await supabase.from('health_ambulance_units').update({ status: 'dispatched' }).eq('id', payload.unit_id);
      fetchData();
      return { success: true, dispatch: data };
    } catch (err: any) { return { success: false, error: err.message }; }
    finally { setLoading(false); }
  }, [user, supabase, fetchData]);

  const updateDispatch = useCallback(async (id: string, updates: any) => {
    const { error } = await supabase.from('health_ambulance_dispatches').update(updates).eq('id', id);
    if (!error) fetchData();
  }, [supabase, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { units, activeDispatches, createDispatch, updateDispatch, loading };
}
