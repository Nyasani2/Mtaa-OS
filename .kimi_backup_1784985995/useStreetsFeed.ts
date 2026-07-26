/**
 * MTAA OS V10 — useStreetsFeed Hook
 * Uses EXPLICIT query pattern. No implicit joins. No FK alias crashes.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchStreetsFeed,
  fetchStreetsComments,
  toggleStreetsLike,
  createStreetsPost,
  StreetsPostWithCreator,
} from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useStreetsFeed() {
  const [posts, setPosts] = useState<StreetsPostWithCreator[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadFeed = useCallback(
    async (refresh = false) => {
      const currentOffset = refresh ? 0 : offset;
      setIsLoading(!refresh);
      setIsRefreshing(refresh);
      setError(null);

      try {
        const data = await fetchStreetsFeed({ limit: 15, offset: currentOffset });
        if (refresh) {
          setPosts(data);
          setOffset(15);
        } else {
          setPosts((prev) => [...prev, ...data]);
          setOffset((prev) => prev + 15);
        }
        setHasMore(data.length === 15);
      } catch (e: any) {
        setError(e.message || 'Feed load failed');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [offset]
  );

  const refresh = useCallback(() => loadFeed(true), [loadFeed]);
  const loadMore = useCallback(() => loadFeed(false), [loadFeed]);

  const likePost = useCallback(
    async (postId: string) => {
      if (!userId) return;
      try {
        await toggleStreetsLike(postId, userId);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, likes_count: p.likes_count + (p.likes_count >= 0 ? 1 : 0) }
              : p
          )
        );
      } catch (e: any) {
        setError(e.message);
      }
    },
    [userId]
  );

  const createPost = useCallback(
    async (content: string, mediaUrls?: string[]) => {
      if (!userId) throw new Error('Not authenticated');
      const post = await createStreetsPost({
        creator_id: userId,
        content,
        media_urls: mediaUrls ?? [],
        visibility: 'public',
      });
      setPosts((prev) => [{ ...post, creator: null }, ...prev]);
      return post;
    },
    [userId]
  );

  useEffect(() => {
    loadFeed(true);
  }, []);

  return {
    posts,
    isLoading,
    isRefreshing,
    hasMore,
    error,
    refresh,
    loadMore,
    likePost,
    createPost,
  };
}
