// lib/hooks/useStreets.ts
// FIXED 2026-08-13: Auto-load on mount, proper error logging, safe authors fallback

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  fetchStreetsPosts,
  fetchAuthorProfiles,
  toggleLikePost,
  checkUserLiked,
  fetchComments,
  addComment,
  sharePost,
  repostPost,
  incrementViewCount,
  type StreetsPost,
  type StreetsComment,
  type AuthorProfile,
} from '@/lib/services/streets-service';

export function useStreets() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<StreetsPost[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorProfile>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // ── Auto-load feed on mount ──
  useEffect(() => {
    console.log('[useStreets] Mounting — auto-loading feed');
    loadFeed(1, false);
     
  }, []);

  // ── Build authors map whenever posts change ──
  useEffect(() => {
    if (posts.length === 0) {
      setAuthors({});
      return;
    }
    const userIds = [...new Set(posts.map((p) => p.creator_id).filter(Boolean))];
    if (userIds.length === 0) return;

    console.log('[useStreets] Fetching author profiles for', userIds.length, 'creators');
    fetchAuthorProfiles(userIds)
      .then((map) => {
        if (map) {
          console.log('[useStreets] Authors loaded:', Object.keys(map).length);
          setAuthors(map);
        }
      })
      .catch((err) => {
        console.error('[useStreets] fetchAuthorProfiles failed:', err);
        setAuthors({}); // safe fallback
      });
  }, [posts]);

  const loadFeed = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    console.log('[useStreets] loadFeed called — page:', pageNum, 'append:', append);
    if (pageNum === 1 && !append) setLoading(true);
    if (append) setRefreshing(false);
    setError(null);
    try {
      const data = await fetchStreetsPosts(20, (pageNum - 1) * 20);
      console.log('[useStreets] fetchStreetsPosts returned', data.length, 'posts');
      if (append) {
        setPosts((prev) => {
          const existing = new Set(prev.map((p) => p.id));
          return [...prev, ...data.filter((p) => !existing.has(p.id))];
        });
      } else {
        setPosts(data);
      }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err: any) {
      console.error('[useStreets] fetchStreetsPosts error:', err);
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const loadPosts = useCallback((refresh: boolean = false) => {
    console.log('[useStreets] loadPosts called — refresh:', refresh);
    if (refresh) {
      setPage(1);
      loadFeed(1, false);
    } else {
      loadFeed(page, false);
    }
  }, [loadFeed, page]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(1, false);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (!hasMore || loading) return;
    loadFeed(page + 1, true);
  }, [hasMore, loading, loadFeed, page]);

  const likePost = useCallback(async (postId: string) => {
    if (!user?.id) return { liked: false };
    try {
      const result = await toggleLikePost(postId, user.id);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: result.count, is_liked_by_user: result.liked }
            : p
        )
      );
      return { liked: result.liked };
    } catch (err: any) {
      console.error('[useStreets] likePost error:', err);
      setError(err.message || 'Failed to like post');
      return { liked: false };
    }
  }, [user?.id]);

  const isLiked = useCallback(async (postId: string) => {
    if (!user?.id) return false;
    try {
      return await checkUserLiked(postId, user.id);
    } catch {
      return false;
    }
  }, [user?.id]);

  const handleShare = useCallback(async (postId: string) => {
    if (!user?.id) return;
    try {
      await sharePost(postId, user.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p))
      );
    } catch (err: any) {
      console.error('[useStreets] handleShare error:', err);
    }
  }, [user?.id]);

  const handleRepost = useCallback(async (postId: string) => {
    if (!user?.id) return;
    try {
      await repostPost(postId, user.id);
    } catch (err: any) {
      console.error('[useStreets] handleRepost error:', err);
    }
  }, [user?.id]);

  const markViewed = useCallback(async (postId: string) => {
    try {
      await incrementViewCount(postId);
    } catch {
      // silent
    }
  }, []);

  const handleBoost = useCallback(() => {
    // TODO: implement boost
  }, []);

  const getComments = useCallback(async (postId: string): Promise<StreetsComment[]> => {
    try {
      return await fetchComments(postId);
    } catch (err) {
      console.error('[useStreets] getComments error:', err);
      return [];
    }
  }, []);

  const postComment = useCallback(async (postId: string, content: string): Promise<StreetsComment | null> => {
    if (!user?.id) return null;
    try {
      const comment = await addComment(postId, user.id, content);
      if (comment) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p
          )
        );
      }
      return comment;
    } catch (err) {
      console.error('[useStreets] postComment error:', err);
      return null;
    }
  }, [user?.id]);

  return {
    posts,
    authors,
    loading,
    refreshing,
    error,
    page,
    hasMore,
    loadFeed,
    loadPosts,
    refresh,
    loadMore,
    likePost,
    isLiked,
    handleShare,
    handleRepost,
    markViewed,
    handleBoost,
    getComments,
    postComment,
  };
}
