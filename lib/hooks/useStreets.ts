import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useStreets() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPost = useCallback(async (postData) => {
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .insert({ ...postData, creator_id: user?.id })
        .select()
        .single();
      if (error) throw error;
      setPosts(prev => [data, ...prev]);
      return data;
    } catch (e) {
      setError(e.message);
      throw e;
    }
  }, [user?.id]);

  useEffect(() => {
    fetchFeed();
  }, [fetchFeed]);

  return { posts, loading, error, fetchFeed, createPost };
}
