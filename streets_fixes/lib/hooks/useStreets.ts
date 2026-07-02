import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { streetsService } from '@/lib/services/streets-service';
import type { StreetsPost } from '@/lib/types/streets';

export interface UseStreetsReturn {
  posts: StreetsPost[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (content: string, mediaUrl?: string, mediaType?: string) => Promise<void>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  addComment: (postId: string, content: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
}

export function useStreets(): UseStreetsReturn {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<StreetsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(async (pageNum: number, append: boolean = false) => {
    if (!user) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    setError(null);

    try {
      const data = await streetsService.getFeed(pageNum, 20);

      if (abortControllerRef.current?.signal.aborted) return;

      setPosts(prev => append ? [...prev, ...data] : data);
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err: any) {
      if (abortControllerRef.current?.signal.aborted) return;

      const message = err instanceof Error
        ? err.message
        : 'Failed to load feed. Please try again.';

      setError(message);
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [user]);

  const refresh = useCallback(async () => {
    setPage(0);
    await fetchFeed(0, false);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    await fetchFeed(page + 1, true);
  }, [fetchFeed, loading, hasMore, page]);

  const createPost = useCallback(async (content: string, mediaUrl?: string, mediaType?: string) => {
    if (!user) throw new Error('Not authenticated');
    const newPost = await streetsService.createPost({ content, mediaUrl, mediaType });
    setPosts(prev => [newPost, ...prev]);
  }, [user]);

  const likePost = useCallback(async (postId: string) => {
    if (!user) return;
    await streetsService.likePost(postId);
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked: true } : p
    ));
  }, [user]);

  const unlikePost = useCallback(async (postId: string) => {
    if (!user) return;
    await streetsService.unlikePost(postId);
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1), is_liked: false } : p
    ));
  }, [user]);

  const addComment = useCallback(async (postId: string, content: string) => {
    if (!user) return;
    await streetsService.addComment(postId, content);
    setPosts(prev => prev.map(p => 
      p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
    ));
  }, [user]);

  const deletePost = useCallback(async (postId: string) => {
    if (!user) return;
    await streetsService.deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, [user]);

  useEffect(() => {
    refresh();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [refresh]);

  return {
    posts,
    loading,
    error,
    hasMore,
    refresh,
    loadMore,
    createPost,
    likePost,
    unlikePost,
    addComment,
    deletePost,
  };
}
