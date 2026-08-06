// lib/hooks/useStreets.ts
// FIXED 2026-08-06: unified auth, passes userId to service, no internal getUser

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  getFeedPosts,
  likePost,
  unlikePost,
  isPostLiked,
  type StreetPost,
} from '@/lib/services/streets-service';

export function useStreets() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1 && !append) setLoading(true);
    if (append) setLoading(false);
    setError(null);
    try {
      const data = await getFeedPosts({ page: pageNum, limit: 20 });
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
      setError(err.message || 'Failed to load feed');
      if (!append) setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(1);
  }, [loadFeed]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading && !refreshing) {
      loadFeed(page + 1, true);
    }
  }, [hasMore, loading, refreshing, page, loadFeed]);

  const handleLike = useCallback(async (postId: string) => {
    if (!user?.id) return;
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const currentlyLiked = post.is_liked_by_user || false;
    const newLiked = !currentlyLiked;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              is_liked_by_user: newLiked,
              likes_count: newLiked ? (p.likes_count || 0) + 1 : Math.max((p.likes_count || 0) - 1, 0),
            }
          : p
      )
    );

    try {
      if (newLiked) await likePost(postId, user.id);
      else await unlikePost(postId, user.id);
    } catch (err) {
      // Rollback
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                is_liked_by_user: currentlyLiked,
                likes_count: currentlyLiked ? (p.likes_count || 0) + 1 : Math.max((p.likes_count || 0) - 1, 0),
              }
            : p
        )
      );
    }
  }, [posts, user?.id]);

  const handleUnlike = useCallback(async (postId: string) => {
    if (!user?.id) return;
    await handleLike(postId); // toggle
  }, [user?.id, handleLike]);

  return {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    likePost: handleLike,
    unlikePost: handleUnlike,
  };
}

export function useCreatePost() {
  const user = useAuthStore((s) => s.user);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: any) => {
    if (!user?.id) { setError('Not authenticated'); return null; }
    setCreating(true); setError(null);
    try {
      const { createPost } = await import('@/lib/services/streets-service');
      const post = await createPost({ ...input, userId: user.id });
      return post;
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
      return null;
    } finally {
      setCreating(false);
    }
  }, [user?.id]);

  return { submit, creating, error };
}
