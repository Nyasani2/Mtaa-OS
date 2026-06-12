// domains/pulse/hooks/useFeed.ts
// MTAA Pulse — Feed Hook with pagination + smart algorithm

import { useState, useEffect, useCallback, useRef } from 'react';
import { feedEngine, type FeedPost } from '../services/feedEngine';
import { signalService } from '../services/signalService';
import { usePulseStore } from '../state/store';

export type FeedTab = 'for_you' | 'following' | 'trending';

export function useFeed(user_id: string) {
  const store = usePulseStore();
  const [data, setData] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeedTab>('for_you');
  const [hasMore, setHasMore] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const pageRef = useRef(0);

  const loadFeed = useCallback(async (tab: FeedTab = activeTab, refresh = false) => {
    if (refresh) pageRef.current = 0;
    const page = pageRef.current;
    const limit = 25;

    setLoading(true);
    setError(null);

    try {
      let posts: FeedPost[] = [];

      switch (tab) {
        case 'for_you':
          posts = await feedEngine.getForYouFeed(user_id, limit);
          break;
        case 'following':
          posts = await feedEngine.getFollowingFeed(user_id, limit);
          break;
        case 'trending':
          posts = await feedEngine.getTrendingFeed(limit);
          break;
      }

      if (page === 0) {
        setData(posts);
      } else {
        setData(prev => [...prev, ...posts]);
      }

      setHasMore(posts.length === limit);
      pageRef.current = page + 1;

      await signalService.recordSignal(user_id, {
        action: 'view',
        metadata: { tab, post_count: posts.length },
      });
    } catch (e: any) {
      setError(e.message);
      console.error('Feed load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, user_id]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadFeed(activeTab, true);
  }, [activeTab, loadFeed]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) {
      loadFeed(activeTab, false);
    }
  }, [loading, hasMore, activeTab, loadFeed]);

  const switchTab = useCallback((tab: FeedTab) => {
    setActiveTab(tab);
    store.setActiveTab(tab as any);
    pageRef.current = 0;
    loadFeed(tab, true);
  }, [store, loadFeed]);

  useEffect(() => {
    loadFeed('for_you', true);
  }, [user_id]);

  return {
    data,
    loading,
    error,
    refreshing,
    hasMore,
    activeTab,
    refresh,
    loadMore,
    switchTab,
  };
}
