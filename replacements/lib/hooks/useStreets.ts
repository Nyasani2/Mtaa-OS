import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { getFeedPosts, likePost, unlikePost } from '@/lib/services/streets-service';
import type { StreetsPost } from '@/lib/services/streets-service';

export function useStreets() {
  const [posts, setPosts] = useState<StreetsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const user = useAuthStore((s) => s.user);

  const loadPosts = useCallback(async (pageNum = 1) => {
    setLoading(true);
    try {
      const result = await getFeedPosts({ page: pageNum, limit: 20 });
      const data = result.data || [];
      setPosts((prev) => {
        if (pageNum === 1) return data;
        const existing = new Set(prev.map((p) => p.id));
        return [...prev, ...data.filter((p: StreetsPost) => !existing.has(p.id))];
      });
      setHasMore(data.length === 20);
      setPage(pageNum);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleLike = useCallback(async (postId: string) => {
    const post = posts.find((p) => p.id === postId);
    if (!post || !user?.id) return;
    const currentlyLiked = post.is_liked_by_user || false;
    const newLiked = !currentlyLiked;
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, is_liked_by_user: newLiked, likes_count: p.likes_count + (newLiked ? 1 : -1) }
          : p
      )
    );
    try {
      if (newLiked) await likePost(postId, user.id);
      else await unlikePost(postId, user.id);
    } catch {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, is_liked_by_user: currentlyLiked, likes_count: p.likes_count + (currentlyLiked ? 1 : -1) }
            : p
        )
      );
    }
  }, [posts, user]);

  useEffect(() => {
    loadPosts(1);
  }, [loadPosts]);

  return { posts, loading, hasMore, page, loadPosts, handleLike };
}
