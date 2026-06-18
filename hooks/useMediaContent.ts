// hooks/useMediaContent.ts
// FIXED: Uses creator_id (not user_id)

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface MediaItem {
  id: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: 'image' | 'video';
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
}

export function useMediaContent(userId: string | undefined) {
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMedia = useCallback(async () => {
    if (!userId) {
      setMedia([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('streets_posts')
        .select('id, media_url, thumbnail_url, media_type, caption, created_at, likes_count, comments_count')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMedia(data || []);
    } catch (err) {
      console.error('useMediaContent error:', err);
      setMedia([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const refresh = useCallback(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { media, loading, refresh };
}
