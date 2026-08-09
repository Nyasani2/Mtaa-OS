import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface Teacher {
  id: string;
  full_name: string;
  avatar_url?: string;
  email?: string;
  phone?: string;
  subjects: string[];
  institution_id: string;
  institution_name?: string;
  years_experience: number;
  rating: number;
  is_verified: boolean;
  verification_status: string;
  employment_status: string;
  bio?: string;
  created_at: string;
}

const PAGE_SIZE = 20;

export function useTeachers(institutionId?: string, filters?: {
  subject?: string;
  verified_only?: boolean;
  search?: string;
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const realtimeRef = useRef<any>(null);

  const fetchTeachers = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);

      let query = supabase
        .from('education_teachers')
        .select(`
          id, full_name, avatar_url, email, phone, subjects_taught, years_experience, rating,
          is_verified, verification_status, employment_status, bio, created_at,
          institution:institution_id (id, name)
        `)
        .eq('status', 'active')
        .order('rating', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (institutionId) query = query.eq('institution_id', institutionId);
      if (filters?.subject) query = query.contains('subjects_taught', [filters.subject]);
      if (filters?.verified_only) query = query.eq('is_verified', true);
      if (filters?.search) query = query.ilike('full_name', `%${filters.search}%`);

      const { data, error: err } = await query;
      if (err) throw err;

      const mapped: Teacher[] = (data || []).map((row: any) => ({
        id: row.id,
        full_name: row.full_name,
        avatar_url: row.avatar_url,
        email: row.email,
        phone: row.phone,
        subjects: row.subjects_taught || [],
        institution_id: row.institution?.id || institutionId || '',
        institution_name: row.institution?.name || 'Unknown',
        years_experience: row.years_experience || 0,
        rating: row.rating || 0,
        is_verified: row.is_verified || false,
        verification_status: row.verification_status || 'pending',
        employment_status: row.employment_status || 'active',
        bio: row.bio,
        created_at: row.created_at,
      }));

      if (isRefresh || pageNum === 0) {
        setTeachers(mapped);
      } else {
        setTeachers(prev => [...prev, ...mapped]);
      }

      setHasMore((data || []).length === PAGE_SIZE);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load teachers');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [institutionId, filters?.subject, filters?.verified_only, filters?.search]);

  const refresh = useCallback(() => {
    setPage(0);
    fetchTeachers(0, true);
  }, [fetchTeachers]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || refreshing) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchTeachers(nextPage);
  }, [hasMore, loading, refreshing, page, fetchTeachers]);

  const createTeacher = useCallback(async (payload: Partial<Teacher>) => {
    const { data, error } = await supabase.from('education_teachers').insert(payload).select().single();
    if (error) throw error;
    refresh();
    return data;
  }, [refresh]);

  const updateTeacher = useCallback(async (id: string, payload: Partial<Teacher>) => {
    const { data, error } = await supabase.from('education_teachers').update(payload).eq('id', id).select().single();
    if (error) throw error;
    setTeachers(prev => prev.map(t => t.id === id ? { ...t, ...payload } : t));
    return data;
  }, []);

  // Realtime
  useEffect(() => {
    fetchTeachers(0);

    const channelName = institutionId ? `teachers_${institutionId}` : 'teachers_all';
    realtimeRef.current = supabase
      .channel(channelName)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'education_teachers',
        filter: institutionId ? `institution_id=eq.${institutionId}` : undefined,
      }, () => {
        refresh();
      })
      .subscribe();

    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, [institutionId]);

  return { teachers, loading, refreshing, error, hasMore, refresh, loadMore, createTeacher, updateTeacher };
}
