import { useState, useCallback, useEffect } from 'react';
import {
  getFeedPosts,
  createPost,
  likePost,
  unlikePost,
  isLiked,
  getComments,
  addComment,
  deleteComment,
  sharePost,
  savePost,
  unsavePost,
  isSaved,
  followUser,
  unfollowUser,
  isFollowing,
  deletePost,
  getPostById,
  type StreetsPost,
  type StreetsComment,
  type CreatePostInput,
} from '@/lib/services/streets-service';

export function useStreetsFeed(feedType: 'for-you' | 'following' | 'discover' = 'for-you') {
  const [posts, setPosts] = useState<StreetsPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 20;

  const loadPosts = useCallback(async (reset = false) => {
    if (loading) return;
    setLoading(true);
    try {
      const newOffset = reset ? 0 : offset;
      const data = await getFeedPosts(feedType, LIMIT, newOffset);
      if (reset) {
        setPosts(data);
        setOffset(LIMIT);
      } else {
        setPosts(prev => [...prev, ...data]);
        setOffset(newOffset + LIMIT);
      }
      setHasMore(data.length === LIMIT);
    } catch (e) {
      console.error('Feed load error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feedType, offset, loading]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadPosts(true);
  }, [loadPosts]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) loadPosts(false);
  }, [loading, hasMore, loadPosts]);

  useEffect(() => {
    loadPosts(true);
  }, [feedType]);

  return { posts, loading, refreshing, hasMore, refresh, loadMore };
}

export function useCreatePost() {
  const [creating, setCreating] = useState(false);

  const submit = useCallback(async (input: CreatePostInput) => {
    setCreating(true);
    try {
      const post = await createPost(input);
      return post;
    } catch (e) {
      console.error('Create post error:', e);
      throw e;
    } finally {
      setCreating(false);
    }
  }, []);

  return { submit, creating };
}

export function usePostActions(postId: string) {
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [comments, setComments] = useState<StreetsComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([isLiked(postId), isSaved(postId)]).then(([l, s]) => {
      if (mounted) { setLiked(l); setSaved(s); }
    });
    return () => { mounted = false; };
  }, [postId]);

  const toggleLike = useCallback(async () => {
    try {
      if (liked) {
        await unlikePost(postId);
        setLiked(false);
      } else {
        await likePost(postId);
        setLiked(true);
      }
    } catch (e) {
      console.error('Like error:', e);
    }
  }, [liked, postId]);

  const toggleSave = useCallback(async () => {
    try {
      if (saved) {
        await unsavePost(postId);
        setSaved(false);
      } else {
        await savePost(postId);
        setSaved(true);
      }
    } catch (e) {
      console.error('Save error:', e);
    }
  }, [saved, postId]);

  const toggleFollow = useCallback(async (userId: string) => {
    try {
      if (following) {
        await unfollowUser(userId);
        setFollowing(false);
      } else {
        await followUser(userId);
        setFollowing(true);
      }
    } catch (e) {
      console.error('Follow error:', e);
    }
  }, [following]);

  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const data = await getComments(postId);
      setComments(data);
    } catch (e) {
      console.error('Comments load error:', e);
    } finally {
      setCommentsLoading(false);
    }
  }, [postId]);

  const submitComment = useCallback(async (content: string) => {
    try {
      const comment = await addComment(postId, content);
      setComments(prev => [...prev, comment]);
      return comment;
    } catch (e) {
      console.error('Comment error:', e);
      throw e;
    }
  }, [postId]);

  const removeComment = useCallback(async (commentId: string) => {
    try {
      await deleteComment(commentId);
      setComments(prev => prev.filter(c => c.id !== commentId));
    } catch (e) {
      console.error('Delete comment error:', e);
    }
  }, []);

  const handleShare = useCallback(async () => {
    try {
      await sharePost(postId);
    } catch (e) {
      console.error('Share error:', e);
    }
  }, [postId]);

  const handleDelete = useCallback(async () => {
    try {
      await deletePost(postId);
    } catch (e) {
      console.error('Delete post error:', e);
      throw e;
    }
  }, [postId]);

  return {
    liked, saved, following, comments, commentsLoading,
    toggleLike, toggleSave, toggleFollow, loadComments,
    submitComment, removeComment, handleShare, handleDelete,
  };
}

export function usePost(postId: string) {
  const [post, setPost] = useState<StreetsPost | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    getPostById(postId).then(data => {
      if (mounted) { setPost(data); setLoading(false); }
    });
    return () => { mounted = false; };
  }, [postId]);

  return { post, loading };
}
