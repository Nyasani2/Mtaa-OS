import { useState, useCallback, useEffect, useRef } from 'react';
import {
  loadFeed,
  loadFollowing,
  loadDiscover,
  getCreatorProfiles,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  checkUserLiked,
  uploadMedia,
  type StreetPost,
  type CreatorProfile,
} from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export type TabType = 'feed' | 'following' | 'discover';

export function useStreets() {
  const user = useAuthStore((s) => s.user);
  const userId = user?.id;

  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [profiles, setProfiles] = useState<Record<string, CreatorProfile>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('feed');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());
  const offsetRef = useRef(0);

  const fetchProfiles = useCallback(async (postList: StreetPost[]) => {
    const ids = postList.map((p) => p.creator_id).filter(Boolean);
    if (ids.length === 0) return;
    const map = await getCreatorProfiles(ids);
    setProfiles((prev) => ({ ...prev, ...map }));
  }, []);

  const checkLikes = useCallback(async (postList: StreetPost[]) => {
    if (!userId) return;
    const checks = await Promise.all(
      postList.map((p) => checkUserLiked(p.id, userId).then((liked) => ({ id: p.id, liked })))
    );
    setLikedPosts((prev) => {
      const next = new Set(prev);
      checks.forEach((c) => {
        if (c.liked) next.add(c.id);
        else next.delete(c.id);
      });
      return next;
    });
  }, [userId]);

  const loadPosts = useCallback(async (tab: TabType, offset = 0, append = false) => {
    setLoading(true);
    try {
      let data: StreetPost[] = [];
      if (tab === 'feed') data = await loadFeed(offset);
      else if (tab === 'following') {
        if (!userId) { setPosts([]); setHasMore(false); return; }
        data = await loadFollowing(userId, offset);
      } else if (tab === 'discover') data = await loadDiscover(offset);

      if (append) {
        setPosts((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPosts = data.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      } else {
        setPosts(data);
      }

      setHasMore(data.length >= 10);
      await fetchProfiles(data);
      await checkLikes(data);
    } catch (e) {
      console.error('loadPosts error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId, fetchProfiles, checkLikes]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    offsetRef.current = 0;
    loadPosts(activeTab, 0, false);
  }, [activeTab, loadPosts]);

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    offsetRef.current += 10;
    loadPosts(activeTab, offsetRef.current, true);
  }, [loading, hasMore, activeTab, loadPosts]);

  const switchTab = useCallback((tab: TabType) => {
    setActiveTab(tab);
    offsetRef.current = 0;
    setHasMore(true);
    loadPosts(tab, 0, false);
  }, [loadPosts]);

  const handleCreate = useCallback(async (post: Partial<StreetPost>, mediaFile?: File) => {
    let mediaUrl = post.media_url;
    if (mediaFile) {
      mediaUrl = await uploadMedia(mediaFile);
    }
    const created = await createPost({ ...post, media_url: mediaUrl });
    setPosts((prev) => [created, ...prev]);
    await fetchProfiles([created]);
    return created;
  }, [fetchProfiles]);

  const handleDelete = useCallback(async (postId: string) => {
    if (!userId) throw new Error('Not authenticated');
    await deletePost(postId, userId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
  }, [userId]);

  const handleLike = useCallback(async (postId: string) => {
    if (!userId) return;
    const isLiked = likedPosts.has(postId);
    setLikedPosts((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(postId);
      else next.add(postId);
      return next;
    });
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? -1 : 1)) }
          : p
      )
    );
    try {
      if (isLiked) await unlikePost(postId, userId);
      else await likePost(postId, userId);
    } catch (e) {
      setLikedPosts((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(postId);
        else next.delete(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, likes_count: Math.max(0, p.likes_count + (isLiked ? 1 : -1)) }
            : p
        )
      );
    }
  }, [userId, likedPosts]);

  useEffect(() => {
    offsetRef.current = 0;
    loadPosts('feed', 0, false);
  }, [loadPosts]);

  return {
    posts,
    profiles,
    loading,
    refreshing,
    hasMore,
    activeTab,
    likedPosts,
    userId,
    refresh,
    loadMore,
    switchTab,
    handleCreate,
    handleDelete,
    handleLike,
  };
}
