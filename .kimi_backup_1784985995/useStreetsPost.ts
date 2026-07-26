/**
 * MTAA OS V10 — useStreetsPost Hook
 * Single post view with comments. Explicit queries only.
 */
import { useCallback, useEffect, useState } from 'react';
import {
  fetchStreetsPostById,
  fetchStreetsComments,
  toggleStreetsLike,
  StreetsPostWithCreator,
} from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useStreetsPost(postId: string) {
  const [post, setPost] = useState<StreetsPostWithCreator | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.session?.user?.id);

  const loadPost = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);
    try {
      const [p, c] = await Promise.all([
        fetchStreetsPostById(postId),
        fetchStreetsComments(postId),
      ]);
      setPost(p);
      setComments(c);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [postId]);

  const like = useCallback(async () => {
    if (!userId || !postId) return;
    await toggleStreetsLike(postId, userId);
    setPost((prev) =>
      prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev
    );
  }, [userId, postId]);

  const addComment = useCallback(
    async (text: string) => {
      if (!userId || !postId) return;
      const { supabase } = await import('@/lib/supabase/client');
      const { data, error } = await supabase
        .from('streets_comments')
        .insert({ post_id: postId, user_id: userId, content: text })
        .select()
        .single();
      if (error) throw error;
      setComments((prev) => [...prev, { ...data, user: null }]);
    },
    [userId, postId]
  );

  useEffect(() => {
    loadPost();
  }, [loadPost]);

  return { post, comments, isLoading, error, refresh: loadPost, like, addComment };
}
