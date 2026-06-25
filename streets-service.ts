import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/useAuthStore';

export interface StreetPost {
  id: string;
  creator_id: string;
  title: string | null;
  caption: string | null;
  content: string | null;
  media_type: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  hashtags: string[] | null;
  location: string | null;
  duration: number | null;
  video_duration: number | null;
  is_public: boolean;
  allow_comments: boolean;
  allow_duet: boolean;
  is_live: boolean;
  is_sponsored: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  published_at: string;
  creator?: {
    user_id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
  };
  isLiked?: boolean;
  isSaved?: boolean;
  isFollowing?: boolean;
}

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  likes_count: number;
  created_at: string;
  user?: {
    user_id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
  };
  replies?: StreetComment[];
}

export interface StreetLiveStream {
  id: string;
  user_id: string;
  title: string | null;
  stream_key: string;
  status: 'live' | 'ended' | 'scheduled';
  viewer_count: number;
  thumbnail_url: string | null;
  started_at: string | null;
  ended_at: string | null;
  created_at: string;
  creator?: {
    user_id: string;
    display_name: string;
    username: string | null;
    avatar_url: string | null;
  };
}

// ============================================================
// FEED
// ============================================================

export async function getFeedPosts(
  page: number = 1,
  limit: number = 10
): Promise<{ posts: StreetPost[]; error: string | null; hasMore: boolean }> {
  try {
    const user = useAuthStore.getState().user;
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Query public posts with creator profile joined
    const { data: posts, error: postsError } = await supabase
      .from('streets_posts')
      .select(`
        *,
        creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (postsError) {
      console.error('Feed query error:', postsError);
      return { posts: [], error: postsError.message, hasMore: false };
    }

    if (!posts || posts.length === 0) {
      return { posts: [], error: null, hasMore: false };
    }

    const postIds = posts.map((p) => p.id);

    // Check if user liked any of these posts
    let likedPostIds: Set<string> = new Set();
    let savedPostIds: Set<string> = new Set();
    let followingIds: Set<string> = new Set();

    if (user) {
      const [{ data: likes }, { data: saves }, { data: follows }] = await Promise.all([
        supabase.from('streets_likes').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('streets_saves').select('post_id').eq('user_id', user.id).in('post_id', postIds),
        supabase.from('streets_follows').select('following_id').eq('follower_id', user.id),
      ]);

      likedPostIds = new Set(likes?.map((l) => l.post_id) || []);
      savedPostIds = new Set(saves?.map((s) => s.post_id) || []);
      followingIds = new Set(follows?.map((f) => f.following_id) || []);
    }

    const enrichedPosts: StreetPost[] = posts.map((post: any) => ({
      ...post,
      creator: post.creator
        ? {
            user_id: post.creator.user_id,
            display_name: post.creator.display_name,
            username: post.creator.username,
            avatar_url: post.creator.avatar_url,
          }
        : undefined,
      isLiked: likedPostIds.has(post.id),
      isSaved: savedPostIds.has(post.id),
      isFollowing: post.creator ? followingIds.has(post.creator.user_id) : false,
    }));

    return { posts: enrichedPosts, error: null, hasMore: posts.length === limit };
  } catch (err: any) {
    console.error('getFeedPosts error:', err);
    return { posts: [], error: err.message || 'Unknown error', hasMore: false };
  }
}

// ============================================================
// SINGLE POST
// ============================================================

export async function getPostById(postId: string): Promise<{ post: StreetPost | null; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;

    const { data: post, error } = await supabase
      .from('streets_posts')
      .select(`
        *,
        creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .eq('id', postId)
      .single();

    if (error || !post) {
      return { post: null, error: error?.message || 'Post not found' };
    }

    let isLiked = false;
    let isSaved = false;
    let isFollowing = false;

    if (user) {
      const [{ data: like }, { data: save }, { data: follow }] = await Promise.all([
        supabase.from('streets_likes').select('id').eq('post_id', postId).eq('user_id', user.id).single(),
        supabase.from('streets_saves').select('id').eq('post_id', postId).eq('user_id', user.id).single(),
        supabase.from('streets_follows').select('id').eq('follower_id', user.id).eq('following_id', post.creator_id).single(),
      ]);
      isLiked = !!like;
      isSaved = !!save;
      isFollowing = !!follow;
    }

    return {
      post: {
        ...post,
        creator: post.creator
          ? {
              user_id: post.creator.user_id,
              display_name: post.creator.display_name,
              username: post.creator.username,
              avatar_url: post.creator.avatar_url,
            }
          : undefined,
        isLiked,
        isSaved,
        isFollowing,
      },
      error: null,
    };
  } catch (err: any) {
    return { post: null, error: err.message };
  }
}

// ============================================================
// CREATE POST
// ============================================================

export interface CreatePostInput {
  title?: string;
  caption?: string;
  content?: string;
  media_type: 'video' | 'image' | 'audio' | 'text';
  media_url: string;
  thumbnail_url?: string;
  hashtags?: string[];
  location?: string;
  duration?: number;
  video_duration?: number;
  allow_comments?: boolean;
  allow_duet?: boolean;
  is_public?: boolean;
  scheduled_at?: string;
}

export async function createPost(input: CreatePostInput): Promise<{ post: StreetPost | null; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) {
      return { post: null, error: 'Not authenticated' };
    }

    const { data: post, error } = await supabase
      .from('streets_posts')
      .insert({
        creator_id: user.id,
        title: input.title || null,
        caption: input.caption || null,
        content: input.content || null,
        media_type: input.media_type,
        media_url: input.media_url,
        thumbnail_url: input.thumbnail_url || null,
        hashtags: input.hashtags || null,
        location: input.location || null,
        duration: input.duration || null,
        video_duration: input.video_duration || null,
        allow_comments: input.allow_comments ?? true,
        allow_duet: input.allow_duet ?? true,
        is_public: input.is_public ?? true,
        scheduled_at: input.scheduled_at || null,
        published_at: input.scheduled_at ? null : new Date().toISOString(),
      })
      .select(`
        *,
        creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .single();

    if (error || !post) {
      return { post: null, error: error?.message || 'Failed to create post' };
    }

    return {
      post: {
        ...post,
        creator: post.creator
          ? {
              user_id: post.creator.user_id,
              display_name: post.creator.display_name,
              username: post.creator.username,
              avatar_url: post.creator.avatar_url,
            }
          : undefined,
        isLiked: false,
        isSaved: false,
        isFollowing: false,
      },
      error: null,
    };
  } catch (err: any) {
    return { post: null, error: err.message };
  }
}

// ============================================================
// LIKE / UNLIKE
// ============================================================

export async function likePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('streets_likes')
      .insert({ post_id: postId, user_id: user.id });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unlikePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('streets_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// SAVE / UNSAVE
// ============================================================

export async function savePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('streets_saves')
      .insert({ post_id: postId, user_id: user.id });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unsavePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('streets_saves')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// FOLLOW / UNFOLLOW
// ============================================================

export async function followUser(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };
    if (user.id === userId) return { success: false, error: 'Cannot follow yourself' };

    const { error } = await supabase
      .from('streets_follows')
      .insert({ follower_id: user.id, following_id: userId });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function unfollowUser(userId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('streets_follows')
      .delete()
      .eq('follower_id', user.id)
      .eq('following_id', userId);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// COMMENTS
// ============================================================

export async function getComments(
  postId: string
): Promise<{ comments: StreetComment[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('streets_comments')
      .select(`
        *,
        user:user_profiles!streets_comments_user_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) return { comments: [], error: error.message };

    const comments: StreetComment[] = (data || []).map((c: any) => ({
      ...c,
      user: c.user
        ? {
            user_id: c.user.user_id,
            display_name: c.user.display_name,
            username: c.user.username,
            avatar_url: c.user.avatar_url,
          }
        : undefined,
    }));

    // Build thread structure
    const rootComments: StreetComment[] = [];
    const commentMap = new Map<string, StreetComment>();

    comments.forEach((c) => {
      commentMap.set(c.id, { ...c, replies: [] });
    });

    comments.forEach((c) => {
      const comment = commentMap.get(c.id)!;
      if (c.parent_id && commentMap.has(c.parent_id)) {
        const parent = commentMap.get(c.parent_id)!;
        parent.replies = parent.replies || [];
        parent.replies.push(comment);
      } else {
        rootComments.push(comment);
      }
    });

    return { comments: rootComments, error: null };
  } catch (err: any) {
    return { comments: [], error: err.message };
  }
}

export async function createComment(
  postId: string,
  content: string,
  parentId?: string
): Promise<{ comment: StreetComment | null; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { comment: null, error: 'Not authenticated' };

    const { data, error } = await supabase
      .from('streets_comments')
      .insert({
        post_id: postId,
        user_id: user.id,
        content,
        parent_id: parentId || null,
      })
      .select(`
        *,
        user:user_profiles!streets_comments_user_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .single();

    if (error || !data) return { comment: null, error: error?.message || 'Failed to create comment' };

    return {
      comment: {
        ...data,
        user: data.user
          ? {
              user_id: data.user.user_id,
              display_name: data.user.display_name,
              username: data.user.username,
              avatar_url: data.user.avatar_url,
            }
          : undefined,
        replies: [],
      },
      error: null,
    };
  } catch (err: any) {
    return { comment: null, error: err.message };
  }
}

// ============================================================
// SHARE
// ============================================================

export async function sharePost(postId: string, platform?: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;

    const { error } = await supabase
      .from('streets_shares')
      .insert({
        post_id: postId,
        user_id: user?.id || null,
        platform: platform || null,
      });

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ============================================================
// LIVE STREAMS
// ============================================================

export async function getLiveStreams(
  status: 'live' | 'ended' | 'all' = 'all'
): Promise<{ streams: StreetLiveStream[]; error: string | null }> {
  try {
    let query = supabase
      .from('streets_live_streams')
      .select(`
        *,
        creator:user_profiles!streets_live_streams_user_id_fkey(user_id, display_name, username, avatar_url)
      `);

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query.order('started_at', { ascending: false });

    if (error) return { streams: [], error: error.message };

    const streams: StreetLiveStream[] = (data || []).map((s: any) => ({
      ...s,
      creator: s.creator
        ? {
            user_id: s.creator.user_id,
            display_name: s.creator.display_name,
            username: s.creator.username,
            avatar_url: s.creator.avatar_url,
          }
        : undefined,
    }));

    return { streams, error: null };
  } catch (err: any) {
    return { streams: [], error: err.message };
  }
}

// ============================================================
// DISCOVER / TRENDING
// ============================================================

export async function getTrendingHashtags(): Promise<{ hashtags: any[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('streets_hashtags')
      .select('*')
      .order('usage_count', { ascending: false })
      .limit(20);

    if (error) return { hashtags: [], error: error.message };
    return { hashtags: data || [], error: null };
  } catch (err: any) {
    return { hashtags: [], error: err.message };
  }
}

export async function searchPosts(query: string): Promise<{ posts: StreetPost[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('streets_posts')
      .select(`
        *,
        creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .eq('is_public', true)
      .or(`title.ilike.%${query}%,caption.ilike.%${query}%,content.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) return { posts: [], error: error.message };

    const posts: StreetPost[] = (data || []).map((post: any) => ({
      ...post,
      creator: post.creator
        ? {
            user_id: post.creator.user_id,
            display_name: post.creator.display_name,
            username: post.creator.username,
            avatar_url: post.creator.avatar_url,
          }
        : undefined,
    }));

    return { posts, error: null };
  } catch (err: any) {
    return { posts: [], error: err.message };
  }
}

// ============================================================
// USER PROFILE POSTS
// ============================================================

export async function getUserPosts(userId: string): Promise<{ posts: StreetPost[]; error: string | null }> {
  try {
    const currentUser = useAuthStore.getState().user;
    const isOwnProfile = currentUser?.id === userId;

    let query = supabase
      .from('streets_posts')
      .select(`
        *,
        creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, username, avatar_url)
      `)
      .eq('creator_id', userId);

    if (!isOwnProfile) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) return { posts: [], error: error.message };

    const posts: StreetPost[] = (data || []).map((post: any) => ({
      ...post,
      creator: post.creator
        ? {
            user_id: post.creator.user_id,
            display_name: post.creator.display_name,
            username: post.creator.username,
            avatar_url: post.creator.avatar_url,
          }
        : undefined,
    }));

    return { posts, error: null };
  } catch (err: any) {
    return { posts: [], error: err.message };
  }
}

// ============================================================
// DELETE POST
// ============================================================

export async function deletePost(postId: string): Promise<{ success: boolean; error: string | null }> {
  try {
    const user = useAuthStore.getState().user;
    if (!user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
      .from('streets_posts')
      .delete()
      .eq('id', postId)
      .eq('creator_id', user.id);

    if (error) return { success: false, error: error.message };
    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
