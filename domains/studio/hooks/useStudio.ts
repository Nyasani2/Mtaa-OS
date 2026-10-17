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
}

export function useStudio() {
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [liveStreams, setLiveStreams] = useState<any[]>([]);
  const [streetsPosts, setStreetsPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const currentUserId = user?.id;

  const fetchVideos = useCallback(async (category?: string, search?: string) => {
    setLoading(true);
    setError(null);
    try {
      // FIX: Query studio_videos instead of studio_content
      let query = supabase
        .from('studio_videos')
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
          (v.description || '').toLowerCase().includes(s)
        );
      }
      setVideos(result);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLive = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('streets_live_streams')
        .select('*')
        .eq('is_active', true)
        .order('started_at', { ascending: false });
      if (err) throw err;
      setLiveStreams((data || []) as any[]);
    } catch (e: any) {
      console.error('fetchLive error:', e.message);
    }
  }, []);

  const fetchStreets = useCallback(async () => {
    try {
      const { data, error: err } = await supabase
        .from('streets_posts')
        .select('*')
        .eq('media_type', 'video')
        .order('created_at', { ascending: false })
        .limit(15);
      if (err) throw err;
      setStreetsPosts(data || []);
    } catch (e: any) {
      console.error('fetchStreets error:', e.message);
    }
  }, []);

  const insertVideoRecord = useCallback(async (payload: {
    title: string;
    description?: string;
    video_url: string;
    thumbnail_url?: string;
    category?: string;
    duration_seconds?: number;
  }) => {
    if (!currentUserId) return null;
    // FIX: Insert into studio_videos with correct columns
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

  const getCreatorProfile = useCallback(async (userId: string) => {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .eq('user_id', userId)
      .single();

    if (!profile) return null;

    const { data: vids } = await supabase
      .from('studio_videos')
      .select('view_count')
      .eq('creator_id', userId);
    const totalViews = (vids || []).reduce((sum: number, v: any) => sum + (v.view_count || 0), 0);

    return {
      user_id: userId,
      display_name: profile.display_name,
      avatar_url: profile.avatar_url,
      total_views: totalViews,
    };
  }, []);

  return {
    videos,
    liveStreams,
    streetsPosts,
    loading,
    error,
    fetchVideos,
    fetchLive,
    fetchStreets,
    insertVideoRecord,
    getCreatorProfile,
    currentUserId,
  };
}
