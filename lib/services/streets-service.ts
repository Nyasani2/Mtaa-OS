import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/types/supabase';
import { compressMedia, formatBytes } from '@/lib/utils/media-compressor';

export type StreetPost = Database['public']['Tables']['streets_posts']['Row'] & {
  creator?: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  } | null;
};

export type StreetComment = Database['public']['Tables']['streets_comments']['Row'] & {
  user_name?: string | null;
  user_avatar?: string | null;
};

export type StreetLike = Database['public']['Tables']['streets_likes']['Row'];

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface CreatePostInput {
  content: string;
  caption?: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'audio' | 'text';
  hashtags?: string[];
  is_public?: boolean;
  allow_comments?: boolean;
  thumbnail_url?: string | null;
}

// ─── ERROR CLASS ──────────────────────────────────────
export class StreetsError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'StreetsError';
  }
}

// ─── HELPER: Merge profiles into posts ────────────────
async function mergeProfiles(posts: any[]): Promise<StreetPost[]> {
  if (!posts || posts.length === 0) return [];

  const creatorIds = [...new Set(posts.map((p) => p.creator_id).filter(Boolean))];
  if (creatorIds.length === 0) return posts as StreetPost[];

  const { data: profiles, error: profileError } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, display_name, avatar_url, username, verified')
    .in('user_id', creatorIds);

  if (profileError) {
    console.warn('[StreetsService] Profile fetch error:', profileError);
  }

  const profileMap = new Map<string, any>();
  (profiles ?? []).forEach((profile: any) => {
    if (profile?.user_id) {
      profileMap.set(profile.user_id, profile);
    }
  });

  return posts.map((post) => ({
    ...post,
    creator: profileMap.get(post.creator_id) || null,
  })) as StreetPost[];
}

// ─── FEED ─────────────────────────────────────────────
export async function getFeed(options?: {
  page?: number;
  limit?: number;
  hashtag?: string;
}): Promise<StreetPost[]> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 20;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('streets_posts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (options?.hashtag) {
    query = query.contains('hashtags', [options.hashtag]);
  }

  const { data, error } = await query;
  if (error) throw new StreetsError(error.message, error.code);
  if (!data || data.length === 0) return [];

  return mergeProfiles(data);
}

// ─── SINGLE POST ──────────────────────────────────────
export async function getPost(postId: string): Promise<StreetPost | null> {
  if (!postId) throw new StreetsError('Post ID is required');

  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new StreetsError(error.message, error.code);
  }
  if (!data) return null;

  const posts = await mergeProfiles([data]);
  return posts[0] || null;
}

export const getPostById = getPost;

// ─── CREATE POST ──────────────────────────────────────
export async function createPost(params: CreatePostInput): Promise<StreetPost> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: userId,
      content: params.content,
      caption: params.caption ?? params.content,
      media_url: params.media_url ?? null,
      media_type: params.media_type ?? 'text',
      hashtags: params.hashtags ?? [],
      is_public: params.is_public ?? true,
      allow_comments: params.allow_comments ?? true,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      view_count: 0,
      thumbnail_url: params.thumbnail_url ?? null,
    })
    .select()
    .single();

  if (error) throw new StreetsError(error.message, error.code);

  const posts = await mergeProfiles([data]);
  return posts[0] as StreetPost;
}

// ─── DELETE POST ──────────────────────────────────────
export async function deletePost(postId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  const { data: post } = await supabase
    .from('streets_posts')
    .select('media_url,thumbnail_url')
    .eq('id', postId)
    .single();

  // Delete media from storage
  if (post?.media_url) {
    try {
      const path = post.media_url.split('/streets-media/')[1];
      if (path) {
        await supabase.storage.from('streets-media').remove([path]);
      }
    } catch (e) {
      console.warn('[StreetsService] Failed to delete media:', e);
    }
  }

  // Delete thumbnail from storage
  if (post?.thumbnail_url) {
    try {
      const thumbPath = post.thumbnail_url.split('/streets-media/')[1];
      if (thumbPath) {
        await supabase.storage.from('streets-media').remove([thumbPath]);
      }
    } catch (e) {
      console.warn('[StreetsService] Failed to delete thumbnail:', e);
    }
  }

  const { error } = await supabase
    .from('streets_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', userId);

  if (error) throw new StreetsError(error.message, error.code);
}

// ─── LIKES ────────────────────────────────────────────
export async function likePost(postId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  const { error } = await supabase
    .from('streets_likes')
    .insert({ post_id: postId, user_id: userId })
    .select();

  if (error && !error.message.includes('duplicate') && !error.message.includes('unique')) {
    throw new StreetsError(error.message, error.code);
  }
}

export async function unlikePost(postId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  const { error } = await supabase
    .from('streets_likes')
    .delete()
    .eq('post_id', postId)
    .eq('user_id', userId);

  if (error) throw new StreetsError(error.message, error.code);
}

export async function checkLiked(postId: string): Promise<boolean> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return false;

  const { data, error } = await supabase
    .from('streets_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw new StreetsError(error.message, error.code);
  return !!data;
}

// ─── COMMENTS ─────────────────────────────────────────
export async function getComments(postId: string): Promise<StreetComment[]> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw new StreetsError(error.message, error.code);
  if (!data || data.length === 0) return [];

  const userIds = [...new Set(data.map((c: any) => c.user_id).filter(Boolean))];

  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('user_id, full_name, display_name, avatar_url')
    .in('user_id', userIds);

  const profileMap = new Map<string, any>();
  (profiles ?? []).forEach((p: any) => {
    if (p?.user_id) profileMap.set(p.user_id, p);
  });

  return data.map((c: any) => ({
    ...c,
    user_name: profileMap.get(c.user_id)?.display_name || profileMap.get(c.user_id)?.full_name || 'Unknown',
    user_avatar: profileMap.get(c.user_id)?.avatar_url || null,
  })) as StreetComment[];
}

export async function addComment(postId: string, content: string): Promise<StreetComment> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  const { data, error } = await supabase
    .from('streets_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();

  if (error) throw new StreetsError(error.message, error.code);

  const comments = await getComments(postId);
  return comments.find((c) => c.id === data.id) || {
    ...data,
    user_name: 'You',
    user_avatar: null,
  };
}

export async function deleteComment(commentId: string): Promise<void> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  const { error } = await supabase
    .from('streets_comments')
    .delete()
    .eq('id', commentId)
    .eq('user_id', userId);

  if (error) throw new StreetsError(error.message, error.code);
}

// ─── VIEWS ────────────────────────────────────────────
export async function incrementView(postId: string): Promise<void> {
  try {
    await supabase.rpc('increment_streets_view', { post_id: postId });
  } catch (e) {
    // RPC may not exist
  }
}

// ─── USER POSTS ───────────────────────────────────────
export async function getUserPosts(
  userId: string,
  options?: { page?: number; limit?: number }
): Promise<StreetPost[]> {
  const page = options?.page ?? 1;
  const limit = options?.limit ?? 30;
  const offset = (page - 1) * limit;

  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('creator_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw new StreetsError(error.message, error.code);
  if (!data || data.length === 0) return [];

  return mergeProfiles(data);
}

// ─── MEDIA UPLOAD (WITH COMPRESSION) ──────────────────
export async function uploadMedia(
  fileUri: string,
  fileName: string,
  fileType: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<{ mediaUrl: string; thumbnailUrl?: string }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) throw new StreetsError('Not authenticated');

  // ─── COMPRESS BEFORE UPLOAD ────────────────────────
  console.log(`[StreetsService] Compressing ${fileType}...`);
  const compressed = await compressMedia(fileUri, fileType);
  console.log(`[StreetsService] Compressed to ${formatBytes(compressed.size)}`);

  const uploadUri = compressed.uri;
  const isVideo = fileType.startsWith('video/');

  // Upload main media
  const response = await fetch(uploadUri);
  const blob = await response.blob();
  const fileSize = blob.size;

  const filePath = `${userId}/${Date.now()}_${fileName}`;

  if (onProgress) onProgress({ loaded: 0, total: fileSize, percentage: 0 });

  const { error: uploadError } = await supabase.storage
    .from('streets-media')
    .upload(filePath, blob, {
      cacheControl: '86400',
      upsert: true,
      contentType: fileType,
    });

  if (uploadError) {
    if (fileSize > 6 * 1024 * 1024) {
      throw new StreetsError(
        `File too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Max 6MB for direct upload.`
      );
    }
    throw new StreetsError(uploadError.message, uploadError.name);
  }

  if (onProgress) onProgress({ loaded: fileSize, total: fileSize, percentage: 100 });

  const { data: urlData } = supabase.storage
    .from('streets-media')
    .getPublicUrl(filePath);

  // Upload thumbnail if video
  let thumbnailUrl: string | undefined;
  if (isVideo && compressed.thumbnailUri) {
    try {
      const thumbResponse = await fetch(compressed.thumbnailUri);
      const thumbBlob = await thumbResponse.blob();
      const thumbPath = `${userId}/${Date.now()}_thumb_${fileName.replace(/\.[^/.]+$/, '')}.jpg`;

      await supabase.storage
        .from('streets-media')
        .upload(thumbPath, thumbBlob, {
          cacheControl: '86400',
          upsert: true,
          contentType: 'image/jpeg',
        });

      const { data: thumbUrlData } = supabase.storage
        .from('streets-media')
        .getPublicUrl(thumbPath);

      thumbnailUrl = thumbUrlData.publicUrl;
    } catch (e) {
      console.warn('[StreetsService] Thumbnail upload failed:', e);
    }
  }

  return {
    mediaUrl: urlData.publicUrl,
    thumbnailUrl,
  };
}

// ─── SEARCH ───────────────────────────────────────────
export async function searchPosts(query: string, limit: number = 20): Promise<StreetPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('is_public', true)
    .or(`content.ilike.%${query}%,caption.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new StreetsError(error.message, error.code);
  if (!data || data.length === 0) return [];

  return mergeProfiles(data);
}

// ─── SHARE COUNT ──────────────────────────────────────
export async function incrementShare(postId: string): Promise<void> {
  try {
    await supabase.rpc('increment_streets_share', { post_id: postId });
  } catch (e) {
    // Silently fail
  }
}

// ─── USER PROFILE ─────────────────────────────────────
export async function getUserProfile(userId: string): Promise<any | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('user_id, display_name, full_name, username, bio, avatar_url, verified, created_at')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new StreetsError(error.message, error.code);
  }
  return data;
}

// ─── FOLLOWER COUNTS ──────────────────────────────────
export async function getFollowerCounts(userId: string): Promise<{ followers: number; following: number }> {
  const [{ count: followers }, { count: following }] = await Promise.all([
    supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
    supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
  ]);

  return {
    followers: followers ?? 0,
    following: following ?? 0,
  };
}

// ─── BACKWARD COMPATIBILITY ───────────────────────────
export const streetsService = {
  getFeed,
  getPost,
  getPostById,
  createPost,
  deletePost,
  likePost,
  unlikePost,
  checkLiked,
  getComments,
  addComment,
  deleteComment,
  incrementView,
  getUserPosts,
  uploadMedia,
  searchPosts,
  incrementShare,
  getUserProfile,
  getFollowerCounts,
};
