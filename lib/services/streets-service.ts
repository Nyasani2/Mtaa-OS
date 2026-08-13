import { supabase } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

// ── Types ──────────────────────────────────────────────────
export interface StreetsPost {
  id: string;
  creator_id: string;
  content: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  media_type?: 'image' | 'video';
  content_type?: string;
  hashtags?: string[];
  is_public?: boolean;
  is_live?: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  view_count: number;
  duration_seconds?: number;
  created_at: string;
  updated_at: string;
}

export interface StreetsComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
}

export interface AuthorProfile {
  user_id: string;
  full_name?: string;
  avatar_url?: string;
  username?: string;
}

export interface PostAnalytics {
  post_id: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  saves: number;
}

// ── Safe RPC caller (prevents e.json crash) ────────────────
async function safeRpc(name: string, params: Record<string, any>): Promise<boolean> {
  try {
    const { error } = await supabase.rpc(name, params);
    if (error) {
      console.warn(`[Streets] RPC ${name} failed:`, error.message);
      return false;
    }
    return true;
  } catch (e: any) {
    console.warn(`[Streets] RPC ${name} exception:`, e?.message || e);
    return false;
  }
}

// ── Posts ──────────────────────────────────────────────────
export async function fetchStreetsPosts(limit = 20, offset = 0): Promise<StreetsPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[Streets] fetch posts error:', error);
    throw new Error(error.message);
  }
  return (data || []) as StreetsPost[];
}

export async function fetchPostsByUser(userId: string, limit = 50): Promise<StreetsPost[]> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('creator_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Streets] fetch user posts error:', error);
    return [];
  }
  return (data || []) as StreetsPost[];
}

export async function fetchPostById(postId: string): Promise<StreetsPost | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (error) {
    console.error('[Streets] fetch post by id error:', error);
    return null;
  }
  return data as StreetsPost;
}

// ── Author Profiles ────────────────────────────────────────
export async function fetchAuthorProfiles(userIds: string[]): Promise<Record<string, AuthorProfile>> {
  if (!userIds.length) return {};
  const uniqueIds = [...new Set(userIds)].filter(Boolean);

  // Step 1: Get all columns that actually exist in user_profiles
  let existingCols: string[] = [];
  try {
    const { data: colData, error: colError } = await supabase
      .from('user_profiles')
      .select('*')
      .limit(1);
    if (!colError && colData && colData.length > 0) {
      existingCols = Object.keys(colData[0]);
    }
  } catch {
    // Fallback: try common columns
    existingCols = ['user_id', 'full_name', 'display_name', 'name', 'username', 'avatar_url', 'photo_url', 'profile_image'];
  }

  // Build select string with only existing columns
  const desiredCols = ['user_id', 'full_name', 'display_name', 'name', 'username', 'avatar_url', 'photo_url', 'profile_image'];
  const selectCols = desiredCols.filter((c) => existingCols.includes(c));
  if (!selectCols.includes('user_id')) selectCols.unshift('user_id');

  const selectStr = selectCols.join(',');

  const { data, error } = await supabase
    .from('user_profiles')
    .select(selectStr)
    .in('user_id', uniqueIds);

  if (error) {
    console.error('[Streets] fetch author profiles error:', error);
    return uniqueIds.reduce((acc, id) => {
      acc[id] = { user_id: id, full_name: 'Anonymous', username: 'user' };
      return acc;
    }, {} as Record<string, AuthorProfile>);
  }

  const profileMap: Record<string, AuthorProfile> = {};

  for (const row of (data || [])) {
    const name = (row as any).full_name || (row as any).display_name || (row as any).name || (row as any).username || 'Anonymous';
    const username = (row as any).username || (row as any).name || 'user';
    const avatar = (row as any).avatar_url || (row as any).photo_url || (row as any).profile_image || undefined;

    profileMap[(row as any).user_id] = {
      user_id: (row as any).user_id,
      full_name: name,
      username: username,
      avatar_url: avatar,
    };
  }

  // Fill missing IDs with anonymous
  for (const id of uniqueIds) {
    if (!profileMap[id]) {
      profileMap[id] = { user_id: id, full_name: 'Anonymous', username: 'user' };
    }
  }

  return profileMap;
}

// ── Likes ──────────────────────────────────────────────────
export async function toggleLikePost(postId: string, userId: string): Promise<{ liked: boolean; count: number }> {
  const { data: existing } = await supabase
    .from('streets_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existing) {
    await supabase.from('streets_post_likes').delete().eq('id', existing.id);
    await safeRpc('decrement_streets_post_likes', { post_id: postId });
    const { data: post } = await supabase.from('streets_posts').select('likes_count').eq('id', postId).single();
    return { liked: false, count: post?.likes_count || 0 };
  } else {
    await supabase.from('streets_post_likes').insert({ post_id: postId, user_id: userId });
    await safeRpc('increment_streets_post_likes', { post_id: postId });
    const { data: post } = await supabase.from('streets_posts').select('likes_count').eq('id', postId).single();
    return { liked: true, count: post?.likes_count || 0 };
  }
}

export async function checkUserLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('streets_post_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .maybeSingle();
  return !!data;
}

// ── Comments ───────────────────────────────────────────────
export async function fetchComments(postId: string): Promise<StreetsComment[]> {
  const { data, error } = await supabase
    .from('streets_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Streets] fetch comments error:', error);
    return [];
  }
  return (data || []) as StreetsComment[];
}

export async function addComment(postId: string, userId: string, content: string): Promise<StreetsComment | null> {
  const { data, error } = await supabase
    .from('streets_comments')
    .insert({ post_id: postId, user_id: userId, content })
    .select()
    .single();

  if (error) {
    console.error('[Streets] add comment error:', error);
    return null;
  }

  await safeRpc('increment_streets_post_comments', { post_id: postId });
  return data as StreetsComment;
}

// ── Share / Repost ─────────────────────────────────────────
export async function sharePost(postId: string, userId: string): Promise<{ success: boolean; shares_count: number }> {
  await safeRpc('increment_streets_post_shares', { post_id: postId });
  const { data: post } = await supabase
    .from('streets_posts')
    .select('shares_count')
    .eq('id', postId)
    .single();
  return { success: true, shares_count: post?.shares_count || 0 };
}

export async function repostPost(postId: string, userId: string, caption?: string): Promise<StreetsPost | null> {
  const { data: original } = await supabase
    .from('streets_posts')
    .select('*')
    .eq('id', postId)
    .single();

  if (!original) return null;

  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: userId,
      content: caption || `Reposted: ${original.content || ''}`,
      caption: original.caption,
      media_url: original.media_url,
      thumbnail_url: original.thumbnail_url,
      media_type: original.media_type,
      hashtags: original.hashtags,
      is_public: true,
      is_live: false,
      duration_seconds: original.duration_seconds,
    })
    .select()
    .single();

  if (error) {
    console.error('[Streets] repost error:', error);
    return null;
  }

  await safeRpc('increment_streets_post_shares', { post_id: postId });
  return data as StreetsPost;
}

// ── Views ──────────────────────────────────────────────────
export async function incrementViewCount(postId: string): Promise<void> {
  await safeRpc('increment_streets_post_views', { post_id: postId });
}

// ── Analytics ──────────────────────────────────────────────
export async function fetchPostAnalytics(postId: string): Promise<PostAnalytics | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .select('id, view_count, likes_count, shares_count, comments_count, saves_count')
    .eq('id', postId)
    .single();

  if (error || !data) return null;

  return {
    post_id: data.id,
    views: data.view_count || 0,
    likes: data.likes_count || 0,
    shares: data.shares_count || 0,
    comments: data.comments_count || 0,
    saves: data.saves_count || 0,
  };
}

// ── Boost / Advert ─────────────────────────────────────────
export interface BoostParams {
  post_id: string;
  user_id: string;
  budget: number;
  duration_days: number;
  target_audience?: string;
}

export async function boostPost(params: BoostParams): Promise<{ success: boolean; advert_id?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('streets_adverts')
      .insert({
        post_id: params.post_id,
        user_id: params.user_id,
        budget: params.budget,
        duration_days: params.duration_days,
        target_audience: params.target_audience || null,
        status: 'pending',
        spent: 0,
        impressions: 0,
        clicks: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[Streets] boost post error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, advert_id: data.id };
  } catch (e: any) {
    return { success: false, error: e.message || 'Boost failed' };
  }
}

export async function fetchUserAdverts(userId: string) {
  const { data, error } = await supabase
    .from('streets_adverts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Streets] fetch adverts error:', error);
    return [];
  }
  return data || [];
}

// ── Video Thumbnail Generator ──────────────────────────────
export async function generateVideoThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL('image/jpeg', 0.8));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(null);
    };
  });
}

// ── Video Compression ──────────────────────────────────────
async function compressVideoWeb(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (file.size < 5 * 1024 * 1024) {
      resolve(file);
      return;
    }

    const video = document.createElement('video');
    video.src = URL.createObjectURL(file);
    video.muted = true;

    video.onloadedmetadata = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(video.src);
        resolve(file);
        return;
      }

      const maxWidth = 720;
      const scale = Math.min(1, maxWidth / video.videoWidth);
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;

      const stream = canvas.captureStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9',
        videoBitsPerSecond: 1_500_000,
      });

      const chunks: Blob[] = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      mediaRecorder.onstop = () => {
        URL.revokeObjectURL(video.src);
        const compressedBlob = new Blob(chunks, { type: 'video/webm' });
        const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, '.webm'), {
          type: 'video/webm',
        });
        resolve(compressedFile.size < file.size ? compressedFile : file);
      };

      mediaRecorder.onerror = () => {
        URL.revokeObjectURL(video.src);
        resolve(file);
      };

      mediaRecorder.start(100);
      video.play();

      const drawFrame = () => {
        if (video.paused || video.ended) {
          mediaRecorder.stop();
          return;
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        requestAnimationFrame(drawFrame);
      };
      drawFrame();
      video.onended = () => mediaRecorder.stop();
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(file);
    };
  });
}

// ── Upload Media ───────────────────────────────────────────
export async function uploadMedia(
  file: File,
  userId: string,
  onProgress?: (percent: number) => void
): Promise<{ url: string; thumbnailUrl?: string }> {
  if (!file) throw new Error('No file provided');

  let thumbnailUrl: string | undefined;

  // Generate thumbnail for videos
  if (file.type.startsWith('video/') && typeof document !== 'undefined') {
    onProgress?.(3);
    thumbnailUrl = await generateVideoThumbnail(file) || undefined;
    onProgress?.(5);

    try {
      const compressed = await compressVideoWeb(file);
      file = compressed;
    } catch (e) {
      console.warn('[Streets] Video compression failed, uploading original:', e);
    }
  }

  const ext = file.name.split('.').pop() || 'bin';
  const path = `${userId}/${uuidv4()}.${ext}`;

  onProgress?.(10);

  const { error: uploadError } = await supabase.storage
    .from('streets-media')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

  onProgress?.(80);

  if (uploadError) {
    console.error('[Streets] upload error:', uploadError);
    if (uploadError.message?.includes('Bucket not found')) {
      throw new Error('Storage bucket "streets-media" not found.');
    }
    if (uploadError.message?.includes('row-level security')) {
      throw new Error('Upload blocked by RLS. Run the SQL to add storage policies.');
    }
    throw new Error(uploadError.message);
  }

  const { data: publicUrlData } = supabase.storage
    .from('streets-media')
    .getPublicUrl(path);

  onProgress?.(100);
  return { url: publicUrlData.publicUrl, thumbnailUrl };
}

// ── Create Post ────────────────────────────────────────────
export async function createPost(params: {
  creatorId: string;
  content: string;
  caption?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaType?: 'image' | 'video';
  hashtags?: string[];
  isPublic?: boolean;
  durationSeconds?: number;
}): Promise<StreetsPost | null> {
  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: params.creatorId,
      content: params.content,
      caption: params.caption || null,
      media_url: params.mediaUrl || null,
      thumbnail_url: params.thumbnailUrl || null,
      media_type: params.mediaType || 'image',
      content_type: 'post',
      hashtags: params.hashtags || [],
      is_public: params.isPublic !== false,
      is_live: false,
      duration_seconds: params.durationSeconds || null,
    })
    .select()
    .single();

  if (error) {
    console.error('[Streets] create post error:', error);
    throw new Error(error.message);
  }
  return data as StreetsPost;
}

// ── Delete Post ────────────────────────────────────────────
export async function deletePost(postId: string, userId: string): Promise<boolean> {
  const { error } = await supabase
    .from('streets_posts')
    .delete()
    .eq('id', postId)
    .eq('creator_id', userId);

  if (error) {
    console.error('[Streets] delete post error:', error);
    return false;
  }
  return true;
}
