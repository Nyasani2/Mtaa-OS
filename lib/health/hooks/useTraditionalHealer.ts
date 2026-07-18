import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useTraditionalHealer() {
  const { supabase } = useSupabase();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [remedies, setRemedies] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: healer } = await supabase.from('health_traditional_healers').select('*').eq('user_id', user.id).single();
      setProfile(healer);
      if (healer) {
        const { data: rem } = await supabase.from('health_herbal_remedies').select('*').eq('healer_id', healer.id).order('created_at', { ascending: false });
        setRemedies(rem || []);
        const { data: consults } = await supabase.from('health_herbal_consultations').select('*').eq('healer_id', healer.id).order('created_at', { ascending: false }).limit(10);
        const { data: todayConsults } = await supabase.from('health_herbal_consultations').select('fee').eq('healer_id', healer.id).gte('created_at', new Date().toISOString().split('T')[0]);
        setStats({ consultationsToday: todayConsults?.length || 0, totalConsultations: consults?.length || 0, earningsToday: todayConsults?.reduce((s, c) => s + (c.fee || 0), 0) || 0, totalEarnings: consults?.reduce((s, c) => s + (c.fee || 0), 0) || 0, remediesCount: rem?.length || 0, recentConsultations: consults?.slice(0, 5) || [] });
      }
    } finally { setLoading(false); }
  }, [user, supabase]);

  const addRemedy = useCallback(async (payload: any) => {
    if (!profile) return;
    const { error } = await supabase.from('health_herbal_remedies').insert({ ...payload, healer_id: profile.id });
    if (!error) fetchData();
  }, [profile, supabase, fetchData]);

  const updateRemedy = useCallback(async (id: string, payload: any) => {
    const { error } = await supabase.from('health_herbal_remedies').update(payload).eq('id', id);
    if (!error) fetchData();
  }, [supabase, fetchData]);

  const deleteRemedy = useCallback(async (id: string) => {
    const { error } = await supabase.from('health_herbal_remedies').delete().eq('id', id);
    if (!error) fetchData();
  }, [supabase, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { profile, remedies, stats, loading, addRemedy, updateRemedy, deleteRemedy };
}
