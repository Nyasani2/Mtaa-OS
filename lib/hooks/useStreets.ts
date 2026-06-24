import { useState, useCallback, useRef } from 'react';
import {
  getFeedPosts,
  getUserPosts,
  getFollowingFeed,
  createPost,
  uploadMedia,
  likePost,
  unlikePost,
  deletePost,
  getPostById,
  type StreetPost,
  type CreatePostInput,
} from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useStreets() {
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const offsetRef = useRef(0);
  const user = useAuthStore((s) => s.user);

  const loadFeed = useCallback(async (newOffset: number = 0, limit: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFeedPosts(newOffset, limit);
      setPosts((prev) => (newOffset === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === limit);
      offsetRef.current = newOffset + data.length;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadFollowing = useCallback(async (newOffset: number = 0, limit: number = 20) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getFollowingFeed(user?.id ?? '', newOffset, limit);
      setPosts((prev) => (newOffset === 0 ? data : [...prev, ...data]));
      setHasMore(data.length === limit);
      offsetRef.current = newOffset + data.length;
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const loadDiscover = useCallback(async (newOffset: number = 0, limit: number = 20) => {
    return loadFeed(newOffset, limit);
  }, [loadFeed]);

  const submitPost = useCallback(async (input: Omit<CreatePostInput, 'creator_id'>) => {
    if (!user?.id) {
      throw new Error('You must be logged in to create a post');
    }
    setLoading(true);
    setError(null);
    try {
      const post = await createPost({ ...input, creator_id: user.id });
      setPosts((prev) => [post, ...prev]);
      return post;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const upload = useCallback(async (file: File | Blob, fileName: string) => {
    return uploadMedia(file, fileName);
  }, []);

  const likePostFn = useCallback(async (postId: string) => {
    try {
      await likePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes_count: p.likes_count + 1 } : p
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const unlikePostFn = useCallback(async (postId: string) => {
    try {
      await unlikePost(postId);
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p
        )
      );
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const remove = useCallback(async (postId: string) => {
    if (!user?.id) return;
    try {
      await deletePost(postId, user.id);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (err: any) {
      setError(err.message);
    }
  }, [user?.id]);

  const getPost = useCallback(async (postId: string) => {
    return getPostById(postId);
  }, []);

  const reset = useCallback(() => {
    setPosts([]);
    offsetRef.current = 0;
    setHasMore(true);
    setError(null);
  }, []);

  return {
    posts,
    loading,
    error,
    hasMore,
    user,
    loadFeed,
    loadFollowing,
    loadDiscover,
    submitPost,
    upload,
    likePost: likePostFn,
    unlikePost: unlikePostFn,
    remove,
    getPost,
    reset,
  };
}
