// @ts-nocheck
import { useState, useCallback, useEffect } from 'react';
import {
  getPosts,
  getPostsByUser,
  getAuthorProfiles,
  toggleLike,
  hasUserLiked,
  getComments,
  addComment,
  sharePost,
  repost,
  uploadMedia,
  createPost,
  incrementViewCount,
  fetchPostAnalytics,
  boostPost,
  type StreetsPost,
  type StreetsComment,
  type AuthorProfile,
  type PostAnalytics,
  type BoostParams,
} from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export function useStreets() {
  const { user, profile } = useAuthStore();
  const userId = user?.id || profile?.id;

  const [posts, setPosts] = useState<StreetsPost[]>([]);
  const [userPosts, setUserPosts] = useState<StreetsPost[]>([]);
  const [authors, setAuthors] = useState<Record<string, AuthorProfile>>({});
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load feed posts
  const loadPosts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const data = await getPosts(20, 0);
      setPosts(data);

      const creatorIds = data.map((p) => p.creator_id).filter(Boolean);
      if (creatorIds.length) {
        const profiles = await getAuthorProfiles(creatorIds);
        setAuthors(profiles);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load posts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Load user's own posts (for profile page)
  const loadUserPosts = useCallback(async (targetUserId?: string) => {
    const id = targetUserId || userId;
    if (!id) return;
    try {
      const data = await getPostsByUser(id, 50);
      setUserPosts(data);

      const creatorIds = data.map((p) => p.creator_id).filter(Boolean);
      if (creatorIds.length) {
        const profiles = await getAuthorProfiles(creatorIds);
        setAuthors((prev) => ({ ...prev, ...profiles }));
      }
    } catch (e: any) {
      console.error('Load user posts error:', e);
    }
  }, [userId]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const likePost = useCallback(async (postId: string) => {
    if (!userId) return { liked: false, count: 0 };
    try {
      const result = await toggleLike(postId, userId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: result.count } : p))
      );
      setUserPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes_count: result.count } : p))
      );
      return result;
    } catch (e: any) {
      console.error('Like error:', e);
      return { liked: false, count: 0 };
    }
  }, [userId]);

  const isLiked = useCallback(async (postId: string): Promise<boolean> => {
    if (!userId) return false;
    return hasUserLiked(postId, userId);
  }, [userId]);

  const getComments = useCallback(async (postId: string): Promise<StreetsComment[]> => {
    return getComments(postId);
  }, []);

  const postComment = useCallback(async (postId: string, content: string): Promise<StreetsComment | null> => {
    if (!userId || !content.trim()) return null;
    const comment = await addComment(postId, userId, content.trim());
    if (comment) {
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
      setUserPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      );
    }
    return comment;
  }, [userId]);

  const handleShare = useCallback(async (postId: string) => {
    try {
      const result = await sharePost(postId, userId || '');
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, shares_count: result.shares_count } : p))
      );
      setUserPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, shares_count: result.shares_count } : p))
      );

      const post = posts.find((p) => p.id === postId);
      const shareData: ShareData = {
        title: 'Check out this post on MTAA Streets',
        text: post?.content || '',
        url: `${window.location.origin}/streets/post/${postId}`,
      };

      if (navigator.share && navigator.canShare?.(shareData)) {
        await navigator.share(shareData);
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareData.url || '');
      }
      return result;
    } catch (e: any) {
      console.error('Share error:', e);
      return { success: false, shares_count: 0 };
    }
  }, [userId, posts]);

  const handleRepost = useCallback(async (postId: string, caption?: string) => {
    if (!userId) return null;
    try {
      const reposted = await repost(postId, userId, caption);
      if (reposted) {
        setPosts((prev) => [reposted, ...prev]);
        const authorProfiles = await getAuthorProfiles([reposted.creator_id]);
        setAuthors((prev) => ({ ...prev, ...authorProfiles }));
      }
      return reposted;
    } catch (e: any) {
      console.error('Repost error:', e);
      return null;
    }
  }, [userId]);

  const markViewed = useCallback(async (postId: string) => {
    try {
      await incrementViewCount(postId);
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, view_count: (p.view_count || 0) + 1 } : p))
      );
    } catch { /* silent */ }
  }, []);

  const getAnalytics = useCallback(async (postId: string): Promise<PostAnalytics | null> => {
    return fetchPostAnalytics(postId);
  }, []);

  const handleBoost = useCallback(async (postId: string, budget: number, durationDays: number) => {
    if (!userId) return { success: false, error: 'Not signed in' };
    return boostPost({
      post_id: postId,
      user_id: userId,
      budget,
      duration_days: durationDays,
    });
  }, [userId]);

  const [isPosting, setIsPosting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [postError, setPostError] = useState<string | null>(null);

  const publishPost = useCallback(
    async (params: {
      content: string;
      caption?: string;
      file?: File | null;
      mediaType?: 'image' | 'video';
      hashtags?: string[];
      isPublic?: boolean;
    }) => {
      if (!userId) {
        setPostError('You must be signed in to post');
        return null;
      }

      setIsPosting(true);
      setUploadProgress(0);
      setPostError(null);

      try {
        let mediaUrl: string | undefined;
        let thumbnailUrl: string | undefined;
        let durationSeconds: number | undefined;

        if (params.file) {
          if (params.mediaType === 'video' && params.file.type.startsWith('video/')) {
            durationSeconds = await getVideoDuration(params.file);
          }

          const result = await uploadMedia(params.file, userId, (pct) => {
            setUploadProgress(pct);
          });
          mediaUrl = result.url;
          thumbnailUrl = result.thumbnailUrl;
        }

        const post = await createPost({
          creatorId: userId,
          content: params.content,
          caption: params.caption,
          mediaUrl,
          thumbnailUrl,
          mediaType: params.mediaType,
          hashtags: params.hashtags,
          isPublic: params.isPublic,
          durationSeconds,
        });

        if (post) {
          setPosts((prev) => [post, ...prev]);
          setUserPosts((prev) => [post, ...prev]);
          const authorProfiles = await getAuthorProfiles([post.creator_id]);
          setAuthors((prev) => ({ ...prev, ...authorProfiles }));
        }

        return post;
      } catch (e: any) {
        const msg = e.message || 'Failed to create post';
        setPostError(msg);
        console.error('[useStreets] publishPost error:', e);
        return null;
      } finally {
        setIsPosting(false);
        setUploadProgress(0);
      }
    },
    [userId]
  );

  return {
    posts,
    userPosts,
    authors,
    loading,
    refreshing,
    error,
    loadPosts,
    loadUserPosts,
    likePost,
    isLiked,
    getComments,
    postComment,
    handleShare,
    handleRepost,
    markViewed,
    getAnalytics,
    handleBoost,
    isPosting,
    uploadProgress,
    postError,
    publishPost,
    userId,
  };
}

function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(video.src);
      resolve(Math.round(video.duration));
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(0);
    };
  });
}
