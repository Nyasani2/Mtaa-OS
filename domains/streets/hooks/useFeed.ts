// lib/streets/hooks/useFeed.ts
// MTAA Streets — Feed Hook

import { useCallback, useEffect } from 'react';
import { useStreetsStore } from '../state';
import { fetchFeed, likePost, unlikePost, savePost, unsavePost, deletePost, pinPost } from '../services/feedService';

// Inline type since StreetFeedFilters may not be exported from types
export interface StreetFeedFilters {
  sortBy?: 'popular' | 'recent' | 'following';
  category?: string;
  location?: { lat: number; lng: number };
}

export function useFeed(userId?: string) {
  const store = useStreetsStore();

  const loadFeed = useCallback(async (reset: boolean = false) => {
    const page = reset ? 0 : (store as any).feedPage || 0;
    (store as any).setLoading?.(true);
    try {
      const { posts, hasMore } = await fetchFeed((store as any).feedFilters || {}, page, userId);
      if (reset) {
        (store as any).setFeedPosts?.(posts);
        (store as any).setFeedPage?.(1);
      } else {
        (store as any).appendFeedPosts?.(posts);
        (store as any).setFeedPage?.(page + 1);
      }
      (store as any).setFeedHasMore?.(hasMore);
    } catch (err) {
      console.error('Feed load error:', err);
    } finally {
      (store as any).setLoading?.(false);
    }
  }, [(store as any).feedFilters, (store as any).feedPage, userId]);

  const refreshFeed = useCallback(() => loadFeed(true), [loadFeed]);
  const loadMore = useCallback(() => loadFeed(false), [loadFeed]);

  const toggleLike = useCallback(async (postId: string) => {
    if (!userId) return;
    const post = (store as any).feedPosts?.find((p: any) => p.id === postId);
    if (!post) return;
    try {
      if (post.liked_by_me) {
        await unlikePost(postId, userId);
      } else {
        await likePost(postId, userId);
      }
      await refreshFeed();
    } catch (err) {
      console.error('Like toggle error:', err);
    }
  }, [(store as any).feedPosts, userId, refreshFeed]);

  const toggleSave = useCallback(async (postId: string) => {
    if (!userId) return;
    try {
      const post = (store as any).feedPosts?.find((p: any) => p.id === postId);
      if (post?.saved_by_me) {
        await unsavePost(postId, userId);
      } else {
        await savePost(postId, userId);
      }
      await refreshFeed();
    } catch (err) {
      console.error('Save toggle error:', err);
    }
  }, [(store as any).feedPosts, userId, refreshFeed]);

  const removePost = useCallback(async (postId: string) => {
    if (!userId) return;
    try {
      await deletePost(postId, userId);
      (store as any).setFeedPosts?.((store as any).feedPosts?.filter((p: any) => p.id !== postId) || []);
    } catch (err) {
      console.error('Delete post error:', err);
    }
  }, [(store as any).feedPosts, userId]);

  const setFilters = useCallback((filters: StreetFeedFilters) => {
    (store as any).setFeedFilters?.(filters);
    loadFeed(true);
  }, [store, loadFeed]);

  useEffect(() => {
    if ((store as any).feedPosts?.length === 0) {
      loadFeed(true);
    }
  }, []);

  return {
    posts: (store as any).feedPosts || [],
    loading: (store as any).feedLoading || false,
    hasMore: (store as any).feedHasMore || false,
    filters: (store as any).feedFilters || {},
    refreshFeed,
    loadMore,
    toggleLike,
    toggleSave,
    removePost,
    setFilters,
  };
}
