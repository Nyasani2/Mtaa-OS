// ============================================================================
// MTAA Profile OS — TIMELINE HOOK
// Extends your existing useProfile() with cross-app content
// Import alongside useProfile in your screen
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  fetchProfileStats,
  fetchProfileTimeline,
  toggleFollow,
  isFollowing,
  TimelineItem,
  ProfileStats,
} from '../services/profile-timeline-service';

export function useProfileTimeline(userId: string) {
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    followers_count: 0, following_count: 0, content_count: 0, total_views: 0, total_likes: 0
  });
  const [loading, setLoading] = useState(true);
  const [following, setFollowing] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'streets' | 'marketplace' | 'jobs' | 'tribes'>('all');

  const load = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [timelineData, statsData, followStatus] = await Promise.all([
        fetchProfileTimeline(userId, activeTab === 'all' ? undefined : `${activeTab}_post`),
        fetchProfileStats(userId),
        isFollowing(userId),
      ]);
      setTimeline(timelineData);
      setStats(statsData);
      setFollowing(followStatus);
    } catch (e) {
      console.error('[useProfileTimeline]', e);
    } finally {
      setLoading(false);
    }
  }, [userId, activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleFollow = async () => {
    try {
      const result = await toggleFollow(userId);
      setFollowing(result);
      const newStats = await fetchProfileStats(userId);
      setStats(newStats);
    } catch (e) { console.error(e); }
  };

  const filteredTimeline = activeTab === 'all'
    ? timeline
    : timeline.filter(t => t.source_app === activeTab);

  return {
    timeline: filteredTimeline,
    stats,
    loading,
    following,
    activeTab,
    setActiveTab,
    refresh: load,
    handleFollow,
  };
}
