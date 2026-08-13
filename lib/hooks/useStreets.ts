// lib/hooks/useStreets.ts
// FIXED 2026-08-13: Auto-load on mount, proper author fetching, bridges service API with screen

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

  const loadFeed = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1 && !append) setLoading(true);
    setError(null);
    try {
      const offset = (pageNum - 1) * 20;
      console.log('[useStreets] fetchStreetsPosts limit=20 offset=' + offset);
      const data = await fetchStreetsPosts(20, offset);
      console.log('[useStreets] Returned', data.length, 'posts');

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

      if (data.length > 0) {
        const creatorIds = [...new Set(data.map((p) => p.creator_id))];
        console.log('[useStreets] Fetching authors for', creatorIds.length, 'creators');
        const authorMap = await fetchAuthorProfiles(creatorIds);
        console.log('[useStreets] Authors resolved:', Object.keys(authorMap).length);
        setAuthors(authorMap);
      } else {
        setAuthors({});
      }
    } catch (err: any) {
      console.error('[useStreets] loadFeed error:', err);
      setError(err.message || 'Failed to load feed');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Auto-load feed on mount
  useEffect(() => {
    loadFeed(1, false);
  }, [loadFeed]);

  const loadPosts = useCallback((shouldRefresh?: boolean) => {
    if (shouldRefresh) {
      setRefreshing(true);
      loadFeed(1, false);
    }
  }, [loadFeed]);

  const likePost = useCallback(async (postId: string) => {
    if (!user?.id) return { liked: false, count: 0 };
    try {
      const result = await toggleLikePost(postId, user.id);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: result.count } : p))
      );
      return result;
    } catch (err: any) {
      console.error('[useStreets] likePost error:', err);
      return { liked: false, count: 0 };
    }
  }, [user?.id]);

  const isLiked = useCallback(async (postId: string) => {
    if (!user?.id) return false;
    try {
      return await checkUserLiked(postId, user.id);
    } catch (err) {
      return false;
    }
  }, [user?.id]);

  const handleShare = useCallback(async (postId: string) => {
    if (!user?.id) return;
    try {
      const result = await sharePost(postId, user.id);
      if (result.success) {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, shares_count: result.shares_count } : p))
        );
      }
    } catch (err) {
      console.error('[useStreets] handleShare error:', err);
    }
  }, [user?.id]);

  const handleRepost = useCallback(async (postId: string) => {
    if (!user?.id) return null;
    try {
      return await repostPost(postId, user.id);
    } catch (err) {
      console.error('[useStreets] handleRepost error:', err);
      return null;
    }
  }, [user?.id]);

  const markViewed = useCallback(async (postId: string) => {
    try {
      await incrementViewCount(postId);
    } catch (err) {
      // best-effort
    }
  }, []);

  const handleBoost = useCallback(() => {
    console.log('[useStreets] Boost placeholder — wire to advert flow');
  }, []);

  const getComments = useCallback(async (postId: string) => {
    try {
      return await fetchComments(postId);
    } catch (err: any) {
      console.error('[useStreets] getComments error:', err);
      return [] as StreetsComment[];
    }
  }, []);

  const postComment = useCallback(async (postId: string, content: string) => {
    if (!user?.id) return null;
    try {
      const comment = await addComment(postId, user.id, content);
      if (comment) {
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p
          )
        );
      }
      return comment;
    } catch (err: any) {
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
    loadPosts,
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
