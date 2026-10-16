import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  fetchStreetsPosts,
  fetchPostsByUser,
  checkUserLiked,
  fetchComments,
  addComment,
  sharePost,
  repostPost,
  incrementViewCount,
} from '@/lib/services/streets-service';

export function useStreets(userId?: string) {
  const { user } = useAuthStore();
  const targetUserId = userId || user?.id || '';
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [authors, setAuthors] = useState<Record<string, any>>({});
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  const loadPosts = useCallback(async (limit: number | boolean = 20, offset = 0) => {
    const actualLimit = typeof limit === 'boolean' ? 20 : limit;
    if (typeof limit === 'boolean' && limit) setRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const data = await fetchStreetsPosts(actualLimit, offset);
      setPosts(data);
      
      const authorIds = [...new Set(data.map((p: any) => p.creator_id).filter(Boolean))];
      if (authorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('user_profiles')
          .select('id, full_name, avatar_url')
          .in('id', authorIds);
        
        const authorMap: Record<string, any> = {};
        (profiles || []).forEach((p: any) => {
          authorMap[p.id] = p;
        });
        setAuthors(authorMap);
      }

      if (targetUserId) {
        const { data: likes } = await supabase
          .from('education_feed_likes')
          .select('post_id')
          .eq('user_id', targetUserId)
          .in('post_id', data.map((p: any) => p.id));
        
        const likedMap: Record<string, boolean> = {};
        (likes || []).forEach((l: any) => {
          likedMap[l.post_id] = true;
        });
        setLikedPosts(likedMap);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId]);

  const loadUserPosts = useCallback(async (targetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchPostsByUser(targetId);
      setPosts(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleShare = useCallback(async (postId: string) => {
    try {
      await sharePost(postId, targetUserId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, shares_count: (p.shares_count || 0) + 1 } : p));
      return true;
    } catch (err: any) {
      setError(err.message);
      return false;
    }
  }, [targetUserId]);

  const handleRepost = useCallback(async (postId: string, caption?: string) => {
    try {
      const reposted = await repostPost(postId, targetUserId, caption);
      if (reposted) {
        setPosts(prev => [reposted, ...prev]);
      }
      return reposted;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [targetUserId]);

  const handleView = useCallback(async (postId: string) => {
    try {
      await incrementViewCount(postId);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, views_count: (p.views_count || 0) + 1 } : p));
    } catch (err: any) {
      console.error(err);
    }
  }, []);

  const likePost = useCallback(async (postId: string): Promise<{ liked: boolean }> => {
    if (!targetUserId) return { liked: false };
    try {
      const { data: existing } = await supabase
        .from('education_feed_likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (existing) {
        await supabase.from('education_feed_likes').delete().eq('id', existing.id);
        setLikedPosts(prev => ({ ...prev, [postId]: false }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1) } : p));
        return { liked: false };
      } else {
        await supabase.from('education_feed_likes').insert({ post_id: postId, user_id: targetUserId });
        setLikedPosts(prev => ({ ...prev, [postId]: true }));
        setPosts(prev => prev.map(p => p.id === postId ? { ...p, likes_count: (p.likes_count || 0) + 1 } : p));
        return { liked: true };
      }
    } catch (err: any) {
      setError(err.message);
      return { liked: false };
    }
  }, [targetUserId]);

  const isLiked = useCallback((postId: string) => {
    return !!likedPosts[postId];
  }, [likedPosts]);

  const markViewed = handleView;

  const handleBoost = useCallback(async (postId: string) => {
    console.log('Boosting post:', postId);
    return true;
  }, []);

  const getComments = useCallback(async (postId: string) => {
    try {
      return await fetchComments(postId);
    } catch (err: any) {
      setError(err.message);
      return [];
    }
  }, []);

  const postComment = useCallback(async (postId: string, content: string) => {
    try {
      const newComment = await addComment(postId, targetUserId, content);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments_count: (p.comments_count || 0) + 1 } : p));
      return newComment;
    } catch (err: any) {
      setError(err.message);
      return null;
    }
  }, [targetUserId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  return {
    posts,
    loading,
    error,
    authors,
    loadPosts,
    loadUserPosts,
    handleShare,
    handleRepost,
    handleView,
    likePost,
    isLiked,
    markViewed,
    handleBoost,
    getComments,
    postComment,
    refreshing,
  };
}
