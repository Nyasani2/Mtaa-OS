import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import {
  getFeed,
  getPost,
  createPost,
  likePost,
  unlikePost,
  deletePost,
  checkLiked,
  getComments,
  addComment,
  deleteComment,
  getUserPosts,
  uploadMedia,
  searchPosts,
  incrementView,
  StreetsError,
} from '@/lib/services/streets-service';
import type { StreetPost, CreatePostInput, StreetComment } from '@/lib/services/streets-service';

const PAGE_SIZE = 20;

export interface UseStreetsReturn {
  posts: StreetPost[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  createPost: (input: CreatePostInput) => Promise<StreetPost>;
  likePost: (postId: string) => Promise<void>;
  unlikePost: (postId: string) => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  getPostById: (postId: string) => Promise<StreetPost | null>;
}

export function useStreets(): UseStreetsReturn {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const fetchFeed = useCallback(async (targetPage: number, isRefresh: boolean) => {
    if (!user) return;

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const pageNum = targetPage + 1;
      const data = await getFeed({ page: pageNum, limit: PAGE_SIZE });
      if (abortRef.current?.signal.aborted) return;

      if (isRefresh) {
        setPosts(data);
        setPage(1);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
        setPage(targetPage + 1);
      }
      setHasMore(data.length === PAGE_SIZE);
    } catch (err: any) {
      if (abortRef.current?.signal.aborted) return;
      const message = err instanceof StreetsError ? err.message : 'Failed to load feed';
      setError(message);
      console.error('[useStreets] fetchFeed error:', err);
    } finally {
      if (!abortRef.current?.signal.aborted) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [user]);

  const refresh = useCallback(async () => {
    await fetchFeed(0, true);
  }, [fetchFeed]);

  const loadMore = useCallback(async () => {
    if (loading || refreshing || !hasMore) return;
    await fetchFeed(page, false);
  }, [fetchFeed, loading, refreshing, hasMore, page]);

  const handleCreatePost = useCallback(async (input: CreatePostInput): Promise<StreetPost> => {
    if (!user) throw new Error('Not authenticated');
    const newPost = await createPost(input);
    setPosts(prev => [newPost, ...prev]);
    return newPost;
  }, [user]);

  const handleLikePost = useCallback(async (postId: string) => {
    if (!user) return;
    await likePost(postId);
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: (p.likes_count || 0) + 1, is_liked: true }
        : p
    ));
  }, [user]);

  const handleUnlikePost = useCallback(async (postId: string) => {
    if (!user) return;
    await unlikePost(postId);
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, likes_count: Math.max(0, (p.likes_count || 0) - 1), is_liked: false }
        : p
    ));
  }, [user]);

  const handleDeletePost = useCallback(async (postId: string) => {
    if (!user) return;
    await deletePost(postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  }, [user]);

  const handleGetPostById = useCallback(async (postId: string): Promise<StreetPost | null> => {
    return getPost(postId);
  }, []);

  useEffect(() => {
    refresh();
    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [refresh]);

  return {
    posts,
    loading,
    refreshing,
    error,
    hasMore,
    refresh,
    loadMore,
    createPost: handleCreatePost,
    likePost: handleLikePost,
    unlikePost: handleUnlikePost,
    deletePost: handleDeletePost,
    getPostById: handleGetPostById,
  };
}

// ─── usePostDetail hook ─────────────────────────────────
export interface UsePostDetailReturn {
  post: StreetPost | null;
  comments: StreetComment[];
  loading: boolean;
  refreshing: boolean;
  liked: boolean;
  likesCount: number;
  commentText: string;
  setCommentText: (text: string) => void;
  submitting: boolean;
  imageError: boolean;
  setImageError: (err: boolean) => void;
  loadData: (showLoader?: boolean) => Promise<void>;
  onRefresh: () => void;
  handleLike: () => Promise<void>;
  handleSubmitComment: () => Promise<void>;
  handleDeletePost: () => void;
  handleDeleteComment: (commentId: string, commentUserId: string) => void;
}

export function usePostDetail(postId: string | undefined): UsePostDetailReturn {
  const { user } = useAuthStore();
  const [post, setPost] = useState<StreetPost | null>(null);
  const [comments, setComments] = useState<StreetComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imageError, setImageError] = useState(false);

  const loadData = useCallback(async (showLoader: boolean = true) => {
    if (!postId) return;
    if (showLoader) setLoading(true);
    try {
      const [postData, commentsData, likedStatus] = await Promise.all([
        getPost(postId),
        getComments(postId),
        user ? checkLiked(postId) : Promise.resolve(false),
      ]);
      setPost(postData);
      setComments(commentsData);
      setLiked(likedStatus);
      setLikesCount(postData?.likes_count || 0);
      setImageError(false);
    } catch (e: any) {
      console.error('[usePostDetail] loadData error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  const handleLike = useCallback(async () => {
    if (!user || !post) return;
    try {
      if (liked) {
        await unlikePost(post.id);
        setLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
      } else {
        await likePost(post.id);
        setLiked(true);
        setLikesCount(c => c + 1);
      }
    } catch (e) {
      // silent
    }
  }, [liked, post, user]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !postId || !user) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(postId, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setPost(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
    } catch (e: any) {
      console.error('[usePostDetail] comment error:', e);
    } finally {
      setSubmitting(false);
    }
  }, [commentText, postId, user]);

  const handleDeletePost = useCallback(() => {
    console.log('[usePostDetail] Delete post requested');
  }, []);

  const handleDeleteComment = useCallback((commentId: string, commentUserId: string) => {
    if (commentUserId !== user?.id) return;
    deleteComment(commentId).then(() => {
      setComments(prev => prev.filter(c => c.id !== commentId));
      setPost(prev => prev ? { ...prev, comments_count: Math.max(0, (prev.comments_count || 0) - 1) } : prev);
    }).catch(console.error);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return {
    post,
    comments,
    loading,
    refreshing,
    liked,
    likesCount,
    commentText,
    setCommentText,
    submitting,
    imageError,
    setImageError,
    loadData,
    onRefresh,
    handleLike,
    handleSubmitComment,
    handleDeletePost,
    handleDeleteComment,
  };
}

// Alias for backward compatibility
export const useFeed = useStreets;
