import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export function useMediaContent(userId) {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchMedia = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch real posts from streets_posts using actual column names
      const { data: posts, error: postsError } = await supabase
        .from('streets_posts')
        .select('*')
        .eq('creator_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      // Map to gallery format using REAL data only
      const mapped = (posts || []).map(post => {
        // BUG FIX: thumbnail should ONLY be thumbnail_url, never fallback to media_url
        // because media_url is a video file and Image component can't render videos
        const thumbnail = post.thumbnail_url || null;
        const type = post.media_type?.toLowerCase().includes('video') ? 'video' : 'photo';

        // Format duration from seconds
        let duration = null;
        if (post.duration) {
          const mins = Math.floor(post.duration / 60);
          const secs = post.duration % 60;
          duration = `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        return {
          id: post.id,
          type,
          uri: post.media_url,
          thumbnail,  // null when no thumbnail_url — triggers placeholder in MediaGallery
          title: post.title || post.content || 'Untitled',
          duration,
          views: post.views_count || 0,
          likes: post.likes_count || 0,
          comments: post.comments_count || 0,
          shares: post.shares_count || 0,
          createdAt: post.created_at,
        };
      });

      setMedia(mapped);
    } catch (err) {
      console.error('Error fetching media:', err);
      setError(err.message || 'Failed to load content');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  return { media, loading, error, refresh: fetchMedia };
}
