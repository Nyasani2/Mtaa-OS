import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeedPosts, StreetPost } from '@/lib/services/streets-service';

export function useFeed() {
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('For You');
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const limit = 10;

  const fetchPosts = useCallback(async (reset = false) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getFeedPosts(limit, newOffset);
      if (reset) {
        setPosts(data);
        setOffset(data.length);
      } else {
        setPosts(prev => [...prev, ...data]);
        setOffset(prev => prev + data.length);
      }
      setHasMore(data.length === limit);
    } catch (err) {
      console.error('useFeed error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [offset, isLoading]);

  const refreshFeed = useCallback(() => {
    setOffset(0);
    setHasMore(true);
    fetchPosts(true);
  }, [fetchPosts]);

  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      fetchPosts(false);
    }
  }, [isLoading, hasMore, fetchPosts]);

  useEffect(() => {
    refreshFeed();
  }, [activeTab]);

  return {
    posts,
    isLoading,
    activeTab,
    setActiveTab,
    refreshFeed,
    loadMore,
    hasMore,
  };
}
