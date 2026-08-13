// @ts-nocheck
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface FeedPost {
  id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  author_role: string;
  institution_id?: string;
  institution_name?: string;
  content: string;
  media_url?: string;
  created_at: string;
  likes_count: number;
  comments_count: number;
  scope: 'school' | 'country' | 'africa';
  is_liked?: boolean;
  subject_name?: string;
  grade_level?: string;
}

export interface FeedFilters {
  scope?: 'school' | 'country' | 'africa';
  institution_id?: string;
  subject_name?: string;
  grade_level?: string;
  search?: string;
}

const PAGE_SIZE = 20;

export function useEducationFeed(filters?: FeedFilters) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const realtimeRef = useRef<any>(null);

  const fetchPosts = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (pageNum === 0) setLoading(true);

      let query = supabase
        .from('education_feed_posts')
        .select(`
          id, author_id, content, media_url, created_at, likes_count, comments_count, scope,
          institution_id, subject_name, grade_level,
          author:author_id (full_name, avatar_url, role),
          institution:institution_id (name)
        `)
        .order('created_at', { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (filters?.scope) query = query.eq('scope', filters.scope);
      if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
      if (filters?.subject_name) query = query.eq('subject_name', filters.subject_name);
      if (filters?.grade_level) query = query.eq('grade_level', filters.grade_level);
      if (filters?.search) query = query.ilike('content', `%${filters.search}%`);

      const { data, error: err } = await query;
      if (err) throw err;

      const mapped: FeedPost[] = (data || []).map((row: any) => ({
        id: row.id,
        author_id: row.author_id,
        author_name: row.author?.full_name || 'Unknown',
        author_avatar: row.author?.avatar_url,
        author_role: row.author?.role || 'user',
        institution_id: row.institution_id,
        institution_name: row.institution?.name,
        content: row.content,
        media_url: row.media_url,
        created_at: row.created_at,
        likes_count: row.likes_count || 0,
        comments_count: row.comments_count || 0,
        scope: row.scope || 'school',
        subject_name: row.subject_name,
        grade_level: row.grade_level,
      }));

      if (isRefresh || pageNum === 0) {
        setPosts(mapped);
      } else {
        setPosts(prev => [...prev, ...mapped]);
      }

      setHasMore((data || []).length === PAGE_SIZE);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters?.scope, filters?.institution_id, filters?.subject_name, filters?.grade_level, filters?.search]);

  const refresh = useCallback(() => {
    setPage(0);
    fetchPosts(0, true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading || refreshing) return;
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage);
  }, [hasMore, loading, refreshing, page, fetchPosts]);

  const likePost = useCallback(async (postId: string) => {
    if (!user?.id) return;
    const { error } = await supabase.rpc('toggle_feed_like', {
      p_post_id: postId,
      p_user_id: user.id,
    });
    if (!error) {
      setPosts(prev => prev.map((p: any) =>
        p.id === postId
          ? { ...p, is_liked: !p.is_liked, likes_count: p.is_liked ? p.likes_count - 1 : p.likes_count + 1 }
          : p
      ));
    }
  }, [user?.id]);

  // Realtime subscription
  useEffect(() => {
    fetchPosts(0);

    realtimeRef.current = supabase
      .channel('education_feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'education_feed_posts' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          refresh();
        } else if (payload.eventType === 'UPDATE') {
          setPosts(prev => prev.map((p: any) => p.id === payload.new.id ? { ...p, ...payload.new } : p));
        } else if (payload.eventType === 'DELETE') {
          setPosts(prev => prev.filter((p: any) => p.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      if (realtimeRef.current) supabase.removeChannel(realtimeRef.current);
    };
  }, []);

  return { posts, loading, refreshing, error, hasMore, refresh, loadMore, likePost };
}
