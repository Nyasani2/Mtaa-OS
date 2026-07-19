import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useTraditionalMedicine() {
  const [healers, setHealers] = useState<any[]>([]);
  const [remedies, setRemedies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: h } = await supabase.from('health_traditional_healers').select('*').eq('is_verified', true).eq('is_active', true).order('rating', { ascending: false });
      setHealers(h || []);
      const { data: r } = await supabase.from('health_herbal_remedies').select('*').eq('is_active', true).eq('is_approved_by_regulator', true).order('rating', { ascending: false });
      setRemedies(r || []);
    } finally { setLoading(false); }
  }, [supabase]);

  const searchHealers = useCallback(async (query: string) => {
    if (!query.trim()) { fetchData(); return; }
    const { data } = await supabase.from('health_traditional_healers').select('*').ilike('full_name', `%${query}%`).eq('is_verified', true).eq('is_active', true);
    setHealers(data || []);
  }, [supabase, fetchData]);

  const searchRemedies = useCallback(async (query: string) => {
    if (!query.trim()) { fetchData(); return; }
    const { data } = await supabase.from('health_herbal_remedies').select('*').ilike('name', `%${query}%`).eq('is_active', true);
    setRemedies(data || []);
  }, [supabase, fetchData]);

  useEffect(() => { fetchData(); }, [fetchData]);
  return { healers, remedies, loading, searchHealers, searchRemedies };
}
