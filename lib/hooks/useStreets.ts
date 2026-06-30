import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useFeed() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const currentPage = isRefresh ? 0 : page;

      // FIX: Query posts without implicit join (avoids user_profiles_1 alias issue)
      const { data: postsData, error: postsError } = await supabase
        .from('streets_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

      if (postsError) throw postsError;

      // Get unique creator_ids from posts
      const creatorIds = [...new Set((postsData || []).map(p => p.creator_id).filter(Boolean))];

      // Fetch creator profiles separately
      let profilesMap: Record<string, any> = {};
      if (creatorIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from('user_profiles')
          .select('id, display_name, username, avatar_url')
          .in('id', creatorIds);

        if (!profilesError && profilesData) {
          profilesMap = Object.fromEntries(profilesData.map(p => [p.id, p]));
        }
      }

      // Merge posts with creator profiles
      const enrichedPosts = (postsData || []).map(post => ({
        ...post,
        creator: profilesMap[post.creator_id] || null,
      }));

      if (isRefresh) {
        setPosts(enrichedPosts);
        setPage(1);
      } else {
        setPosts(prev => [...prev, ...enrichedPosts]);
        setPage(prev => prev + 1);
      }
      setHasMore((postsData || []).length === PAGE_SIZE);
    } catch (e: any) {
      setError(e.message);
      console.error('Feed fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page]);

  const refresh = useCallback(() => fetchFeed(true), [fetchFeed]);
  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchFeed(false);
  }, [loading, hasMore, fetchFeed]);

  const createPost = useCallback(async (postData: any) => {
    try {
      const { data, error: supaError } = await supabase
        .from('streets_posts')
        .insert({ ...postData, creator_id: user?.id })
        .select()
        .single();
      if (supaError) throw supaError;
      setPosts(prev => [data, ...prev]);
      return data;
    } catch (e: any) {
      setError(e.message);
      throw e;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFeed(true);
  }, []);

  return { posts, loading, refreshing, error, hasMore, refresh, loadMore, createPost };
}
