import { useState, useEffect, useCallback } from 'react';
import {
  getFeedPosts,
  getTrendingPosts,
  getPostsByHashtag,
  getUserPosts,
  createPost,
  likePost,
  unlikePost,
  addComment,
  type StreetPost,
  type CreatePostInput,
  type StreetComment,
} from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useStreetsFeed() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadFeed = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (pageNum === 1) setLoading(true);
    setError(null);
    try {
      const data = await getFeedPosts({ page: pageNum, limit: 20 });
      if (append) {
        setPosts(prev => {
          const existing = new Set(prev.map(p => p.id));
          return [...prev, ...data.filter(p => !existing.has(p.id))];
        });
      } else { setPosts(data); }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (err: any) { setError(err.message || 'Failed to load feed'); if (!append) setPosts([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadFeed(1); }, [loadFeed]);
  const loadMore = useCallback(() => { if (hasMore && !loading) loadFeed(page + 1, true); }, [hasMore, loading, page, loadFeed]);
  const refresh = useCallback(() => loadFeed(1), [loadFeed]);

  const handleLike = useCallback(async (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const newLiked = !post.is_liked_by_user;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked_by_user: newLiked, likes_count: newLiked ? (p.likes_count || 0) + 1 : (p.likes_count || 0) - 1 } : p));
    try { if (newLiked) await likePost(postId); else await unlikePost(postId); }
    catch (err) { setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_liked_by_user: !newLiked, likes_count: !newLiked ? (p.likes_count || 0) + 1 : (p.likes_count || 0) - 1 } : p)); }
  }, [posts]);

  return { posts, loading, error, hasMore, loadMore, refresh, handleLike };
}

export function useStreetsTrending() {
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getTrendingPosts().then(setPosts).catch((err: any) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  return { posts, loading, error };
}

export function useCreatePost() {
  const { user } = useAuthStore();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (input: CreatePostInput) => {
    if (!user) { setError('Not authenticated'); return null; }
    setCreating(true); setError(null);
    try { const post = await createPost({ ...input, creator_id: user.id }); return post; }
    catch (err: any) { setError(err.message || 'Failed to create post'); return null; }
    finally { setCreating(false); }
  }, [user]);

  return { submit, creating, error };
}
