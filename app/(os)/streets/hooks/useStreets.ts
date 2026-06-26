import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Post {
  id: string;
  creator_id: string;
  content: string | null;
  media_url: string | null;
  media_type: string;
  thumbnail_url: string | null;
  video_thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  creator: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null;
}

interface UseFeedReturn {
  posts: Post[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => void;
  loadMore: () => void;
}

export function useFeed(): UseFeedReturn {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const fetchPosts = useCallback(async (targetPage: number, isRefresh: boolean) => {
    if (isRefresh) setRefreshing(true);
    setError(null);
    try {
      const { data, error: supaError } = await supabase
        .from('streets_posts')
        .select('id, creator_id, content, media_url, media_type, thumbnail_url, video_thumbnail_url, likes_count, comments_count, shares_count, views_count, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .range(targetPage * 10, (targetPage + 1) * 10 - 1);

      if (supaError) throw supaError;

      const mapped = (data || []).map((p: any) => ({
        id: p.id,
        creator_id: p.creator_id,
        content: p.content,
        media_url: p.media_url,
        media_type: p.media_type || 'text',
        thumbnail_url: p.thumbnail_url,
        video_thumbnail_url: p.video_thumbnail_url,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        shares_count: p.shares_count || 0,
        views_count: p.views_count || 0,
        creator: p.creator ? {
          user_id: p.creator.user_id,
          full_name: p.creator.full_name,
          display_name: p.creator.display_name,
          username: p.creator.username,
          avatar_url: p.creator.avatar_url,
          verified: !!p.creator.verified,
        } : null,
      }));

      if (isRefresh || targetPage === 0) {
        setPosts(mapped);
      } else {
        setPosts(prev => [...prev, ...mapped]);
      }
      setHasMore(mapped.length === 10);
      setPage(targetPage + 1);
    } catch (e: any) {
      setError(e.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts(0, true);
  }, [fetchPosts]);

  const refresh = useCallback(() => {
    setPage(0);
    fetchPosts(0, true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      fetchPosts(page, false);
    }
  }, [loading, hasMore, page, fetchPosts]);

  return { posts, loading, refreshing, error, hasMore, refresh, loadMore };
}
