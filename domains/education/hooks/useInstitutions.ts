import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Institution {
  id: string;
  name: string;
  type: 'primary' | 'secondary' | 'tertiary' | 'vocational';
  country: string;
  city: string;
  logo_url?: string;
  student_count: number;
  teacher_count: number;
  rating: number;
  is_verified: boolean;
  status: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export function useInstitutions(filters?: {
  country?: string;
  city?: string;
  type?: string;
  search?: string;
  verified_only?: boolean;
}) {
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const realtimeRef = useRef<any>(null);

  const fetchInstitutions = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);

      let query = supabase
        .from('education_institutions')
        .select('id, name, institution_type, country, city, logo_url, student_count, teacher_count, rating, is_verified, status, created_at')
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (filters?.country) query = query.eq('country', filters.country);
      if (filters?.city) query = query.eq('city', filters.city);
      if (filters?.type) query = query.eq('institution_type', filters.type);
      if (filters?.search) query = query.ilike('name', `%${filters.search}%`);
      if (filters?.verified_only) query = query.eq('is_verified', true);

      const { data, error: err } = await query;
      if (err) throw err;

      const mapped: Institution[] = (data || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        type: row.institution_type || 'primary',
        country: row.country || 'Unknown',
        city: row.city || 'Unknown',
        logo_url: row.logo_url,
        student_count: row.student_count || 0,
        teacher_count: row.teacher_count || 0,
        rating: row.rating || 0,
        is_verified: row.is_verified || false,
        status: row.status,
        created_at: row.created_at,
      }));

      if (isRefresh || pageNum === 0) {
        setInstitutions(mapped);
      } else {
        setInstitutions(prev => [...prev, ...mapped]);
      }

      setHasMore((data || []).length === PAGE_SIZE);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load institutions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters?.country, filters?.city, filters?.type, filters?.search, filters?.verified_only]);

  const refresh = useCallback(() => {
    setPage(0);
    fetchInstitutions(0, true);
  }, [fetchInstitutions]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || refreshing) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchInstitutions(nextPage);
  }, [hasMore, loading, refreshing, page, fetchInstitutions]);

  const createInstitution = useCallback(async (payload: Partial<Institution>) => {
    const { data, error } = await supabase.from('education_institutions').insert(payload).select().single();
    if (error) throw error;
    refresh();
    return data;
  }, [refresh]);

  const updateInstitution = useCallback(async (id: string, payload: Partial<Institution>) => {
    const { data, error } = await supabase.from('education_institutions').update(payload).eq('id', id).select().single();
    if (error) throw error;
    setInstitutions(prev => prev.map(i => i.id === id ? { ...i, ...payload } : i));
    return data;
  }, []);

  // Realtime
  useEffect(() => {
    fetchInstitutions(0);

    realtimeRef.current = supabase
      .channel('education_institutions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'education_institutions' }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  return { institutions, loading, refreshing, error, hasMore, refresh, loadMore, createInstitution, updateInstitution };
}
