// @ts-nocheck
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface StudioVideo {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  duration_seconds: number | null;
  category: string | null;
  view_count: number;
  likes_count: number;
  comments_count: number;
  status: string;
  visibility: string;
  created_at: string;
  creator_name?: string;
  creator_avatar?: string;
  creator_handle?: string;
}

export interface StudioLiveStream {
  id: string;
  creator_id: string;
  title: string;
  description: string | null;
  stream_url: string | null;
  thumbnail_url: string | null;
  status: string;
  total_viewers: number;
  started_at: string | null;
  created_at: string;
  creator_name?: string;
  creator_avatar?: string;
}

export interface StudioComment {
  id: string;
  video_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  user_name?: string;
  user_avatar?: string;
}

export interface CreatorProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  handle: string | null;
  followers_count: number;
  following_count: number;
  total_views: number;
  subscriber_count: number;
  total_revenue: number;
}

export function useStudio() {
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [liveStreams, setLiveStreams] = useState<StudioLiveStream[]>([]);
  const [streetsPosts, setStreetsPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentUserId = user?.id;

  // ── Fetch all videos (with creator info via view) ──
  const fetchVideos = useCallback(async (category?: string, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('studio_videos_with_creator')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (category && category !== 'All') {
        query = query.eq('category', category);
      }

      const { data, error: err } = await query;
      if (err) throw err;

      let result = (data || []) as StudioVideo[];
      if (search && search.trim()) {
        const s = search.toLowerCase();
        result = result.filter((v: any) =>
          (v.title || '').toLowerCase().includes(s) ||
          (v.description || '').toLowerCase().includes(s) ||
          (v.creator_name || '').toLowerCase().includes(s)
        );
      }
      setVideos(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Fetch live streams ──
  const fetchLive = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('studio_live_streams_with_creator')
        .select('*')
        .eq('status', 'live')
        .order('started_at', { ascending: false });
      if (err) throw err;
      setLiveStreams((data || []) as StudioLiveStream[]);
    } catch (e: any) {
      console.error('fetchLive error:', e.message);
    }
  }, []);

  // ── Fetch streets posts for MStudio feed — ROBUST ──
  const fetchStreets = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('streets_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);
      if (err) throw err;

      const posts = data || [];
      if (posts.length === 0) {
        setStreetsPosts([]);
        return;
      }

      // Try multiple possible creator ID columns
      const creatorIds = [...new Set(posts.map((p: any) => {
        return p.creator_id || p.user_id || p.profile_id || p.author_id || null;
      }).filter(Boolean))];

      let profiles: any[] = [];
      if (creatorIds.length > 0) {
        // Try user_id first (PK), then id fallback
        const { data: profData, error: profErr } = await supabase
          .from('user_profiles')
          .select('user_id, id, display_name, avatar_url, handle')
          .in('user_id', creatorIds);

        if (profErr || !profData || profData.length === 0) {
          // Fallback: try id column
          const { data: profData2 } = await supabase
            .from('user_profiles')
            .select('user_id, id, display_name, avatar_url, handle')
            .in('id', creatorIds);
          profiles = profData2 || [];
        } else {
          profiles = profData;
        }
      }

      const merged = posts.map((p: any) => {
        const cid = p.creator_id || p.user_id || p.profile_id || p.author_id;
        // Try match on user_id first, then id
        let prof = profiles.find((pr: any) => pr.user_id === cid);
        if (!prof) prof = profiles.find((pr: any) => pr.id === cid);

        return {
          ...p,
          creator_id: cid,
          creator_name: prof?.display_name || prof?.handle || p.creator_name || p.author_name || 'Unknown',
          creator_avatar: prof?.avatar_url || p.creator_avatar || null,
          creator_handle: prof?.handle || p.creator_handle || null,
          is_streets: true,
        };
      });

      setStreetsPosts(merged);
    } catch (e: any) {
      console.error('fetchStreets error:', e.message);
      setStreetsPosts([]);
    }
  }, []);

  // ── Get single video (studio or streets) ──
  const getVideo = useCallback(async (id: string) => {
    try {
      // Try studio first
      const { data: studioData, error: studioErr } = await supabase
        .from('studio_videos_with_creator')
        .select('*')
        .eq('id', id)
        .single();

      if (studioData && !studioErr) {
        return { ...studioData, source: 'studio' } as StudioVideo & { source: string };
      }

      // Fallback to streets_posts
      const { data: streetsData, error: streetsErr } = await supabase
        .from('streets_posts')
        .select('*')
        .eq('id', id)
        .single();

      if (streetsData && !streetsErr) {
        const cid = streetsData.creator_id || streetsData.user_id || streetsData.profile_id || streetsData.author_id;
        const { data: prof } = await supabase
          .from('user_profiles')
          .select('display_name, avatar_url, handle')
          .eq('user_id', cid)
          .single();

        // Fallback try id
        let profile = prof;
        if (!profile) {
          const { data: prof2 } = await supabase
            .from('user_profiles')
            .select('display_name, avatar_url, handle')
            .eq('id', cid)
            .single();
          profile = prof2;
        }

        return {
          ...streetsData,
          source: 'streets',
          creator_name: profile?.display_name || profile?.handle || streetsData.creator_name || 'Unknown',
          creator_avatar: profile?.avatar_url || streetsData.creator_avatar || null,
          creator_handle: profile?.handle || streetsData.creator_handle || null,
          view_count: streetsData.view_count || 0,
          likes_count: streetsData.likes_count || 0,
          comments_count: streetsData.comments_count || 0,
          duration_seconds: streetsData.duration_seconds || 0,
        } as any;
      }

      return null;
    } catch (e) {
      return null;
    }
  }, []);

  // ── Comments ──
  const fetchComments = useCallback(async (videoId: string) => {
    const { data, error: err } = await supabase
      .from('studio_comments')
      .select('*')
      .eq('video_id', videoId)
      .order('created_at', { ascending: false });
    if (err) return [];

    const comments = data || [];
    const userIds = [...new Set(comments.map((c: any) => c.user_id))];
    if (userIds.length === 0) return comments;

    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', userIds);

    const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
    return comments.map((c: any) => ({
      ...c,
      user_name: profMap.get(c.user_id)?.display_name || 'User',
      user_avatar: profMap.get(c.user_id)?.avatar_url,
    }));
  }, []);

  const postComment = useCallback(async (videoId: string, content: string) => {
    if (!currentUserId || !content.trim()) return false;
    const { error: err } = await supabase.from('studio_comments').insert({
      video_id: videoId,
      user_id: currentUserId,
      content: content.trim(),
    });
    if (err) {
      console.error('postComment error:', err.message);
      return false;
    }
    await supabase.rpc('increment_comments_count', { vid: videoId });
    return true;
  }, [currentUserId]);

  // ── Like / Unlike ──
  const toggleLike = useCallback(async (videoId: string) => {
    if (!currentUserId) return false;
    const { data: existing } = await supabase
      .from('studio_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', currentUserId)
      .single();

    if (existing) {
      await supabase.from('studio_likes').delete().eq('id', existing.id);
      await supabase.rpc('decrement_likes_count', { vid: videoId });
      return false;
    } else {
      await supabase.from('studio_likes').insert({ video_id: videoId, user_id: currentUserId });
      await supabase.rpc('increment_likes_count', { vid: videoId });
      return true;
    }
  }, [currentUserId]);

  const checkLiked = useCallback(async (videoId: string) => {
    if (!currentUserId) return false;
    const { data } = await supabase
      .from('studio_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('user_id', currentUserId)
      .single();
    return !!data;
  }, [currentUserId]);

  // ── Subscribe / Unsubscribe ──
  const toggleSubscribe = useCallback(async (creatorId: string) => {
    if (!currentUserId || creatorId === currentUserId) return false;
    const { data: existing } = await supabase
      .from('studio_subscriptions')
      .select('id')
      .eq('subscriber_id', currentUserId)
      .eq('creator_id', creatorId)
      .single();

    if (existing) {
      await supabase.from('studio_subscriptions').delete().eq('id', existing.id);
      return false;
    } else {
      await supabase.from('studio_subscriptions').insert({
        subscriber_id: currentUserId,
        creator_id: creatorId,
      });
      return true;
    }
  }, [currentUserId]);

  const checkSubscribed = useCallback(async (creatorId: string) => {
    if (!currentUserId) return false;
    const { data } = await supabase
      .from('studio_subscriptions')
      .select('id')
      .eq('subscriber_id', currentUserId)
      .eq('creator_id', creatorId)
      .single();
    return !!data;
  }, [currentUserId]);

  // ── Creator Profile with real stats ──
  const getCreatorProfile = useCallback(async (userId: string) => {
    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url, handle')
      .eq('user_id', userId)
      .single();

    // Fallback to id
    let prof = profile;
    if (!prof) {
      const { data: p2 } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, avatar_url, handle')
        .eq('id', userId)
        .single();
      prof = p2;
    }

    if (!prof) return null;

    const uid = prof.user_id || userId;

    const { count: followers } = await supabase
      .from('studio_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', uid);

    const { count: following } = await supabase
      .from('studio_subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('subscriber_id', uid);

    const { data: vids } = await supabase
      .from('studio_videos')
      .select('view_count')
      .eq('creator_id', uid);
    const totalViews = (vids || []).reduce((sum: number, v: any) => sum + (v.view_count || 0), 0);

    const { data: rev } = await supabase
      .from('studio_revenue')
      .select('amount')
      .eq('creator_id', uid);
    const totalRevenue = (rev || []).reduce((sum: number, r: any) => sum + parseFloat(r.amount || 0), 0);

    return {
      user_id: uid,
      display_name: prof.display_name,
      avatar_url: prof.avatar_url,
      handle: prof.handle,
      followers_count: followers || 0,
      following_count: following || 0,
      total_views: totalViews,
      subscriber_count: followers || 0,
      total_revenue: totalRevenue,
    } as CreatorProfile;
  }, []);

  // ── Creator's videos ──
  const getCreatorVideos = useCallback(async (userId: string) => {
    const { data, error: err } = await supabase
      .from('studio_videos_with_creator')
      .select('*')
      .eq('creator_id', userId)
      .eq('status', 'published')
      .order('created_at', { ascending: false });
    if (err) return [];
    return (data || []) as StudioVideo[];
  }, []);

  // ── Analytics ──
  const getAnalytics = useCallback(async (userId: string, period: string) => {
    const days = period === '7' ? 7 : period === '28' ? 28 : period === '90' ? 90 : 365;
    const since = new Date(Date.now() - days * 86400000).toISOString();

    const { data: views } = await supabase
      .from('studio_views')
      .select('watch_duration, created_at')
      .eq('creator_id', userId)
      .gte('created_at', since);

    const { data: subs } = await supabase
      .from('studio_subscriptions')
      .select('created_at')
      .eq('creator_id', userId)
      .gte('created_at', since);

    const { data: rev } = await supabase
      .from('studio_revenue')
      .select('amount, created_at')
      .eq('creator_id', userId)
      .gte('created_at', since);

    const viewList = views || [];
    const totalWatch = viewList.reduce((s: number, v: any) => s + (v.watch_duration || 0), 0);
    const avgDuration = viewList.length > 0 ? Math.round(totalWatch / viewList.length) : 0;
    const totalRevenue = (rev || []).reduce((s: number, r: any) => s + parseFloat(r.amount || 0), 0);

    return {
      views: viewList.length,
      watch_time_seconds: totalWatch,
      avg_duration_seconds: avgDuration,
      subscribers: (subs || []).length,
      revenue: totalRevenue,
    };
  }, []);

  // ── Upload: insert video record after storage upload ──
  const insertVideoRecord = useCallback(async (payload: {
    title: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    category?: string;
    duration_seconds?: number;
  }) => {
    if (!currentUserId) return null;
    const { data, error: err } = await supabase
      .from('studio_videos')
      .insert({
        creator_id: currentUserId,
        title: payload.title,
        description: payload.description || '',
        video_url: payload.video_url,
        thumbnail_url: payload.thumbnail_url || null,
        category: payload.category || 'Other',
        duration_seconds: payload.duration_seconds || 0,
        status: 'published',
        visibility: 'public',
      })
      .select()
      .single();
    if (err) {
      console.error('insertVideoRecord error:', err.message);
      return null;
    }
    return data;
  }, [currentUserId]);

  // ── Go Live: create stream record ──
  const createLiveStream = useCallback(async (title: string, description?: string) => {
    if (!currentUserId) return null;
    const streamKey = `live_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const { data, error: err } = await supabase
      .from('studio_live_streams')
      .insert({
        creator_id: currentUserId,
        title: title || 'Live Stream',
        description: description || '',
        stream_key: streamKey,
        status: 'live',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    if (err) {
      console.error('createLiveStream error:', err.message);
      return null;
    }
    return data;
  }, [currentUserId]);

  // ── Increment view count ──
  const incrementView = useCallback(async (videoId: string) => {
    if (!currentUserId) return;
    await supabase.rpc('increment_view_count', { vid: videoId });
    await supabase.from('studio_views').insert({
      video_id: videoId,
      user_id: currentUserId,
      creator_id: currentUserId,
      watch_duration: 0,
    });
  }, [currentUserId]);

  return {
    videos,
    liveStreams,
    streetsPosts,
    loading,
    error,
    fetchVideos,
    fetchLive,
    fetchStreets,
    getVideo,
    fetchComments,
    postComment,
    toggleLike,
    checkLiked,
    toggleSubscribe,
    checkSubscribed,
    getCreatorProfile,
    getCreatorVideos,
    getAnalytics,
    insertVideoRecord,
    createLiveStream,
    incrementView,
    currentUserId,
  };
}
