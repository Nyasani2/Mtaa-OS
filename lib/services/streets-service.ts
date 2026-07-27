// lib/services/streets-service.ts
// MTAA Streets — Canonical Service

import { supabase } from '@/lib/supabase';
import { Platform } from 'react-native';

export interface StreetPost {
  id: string;
  creator_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text' | null;
  is_public: boolean;
  is_live: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator?: {
    user_id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

export interface CreatePostInput {
  content?: string;
  caption?: string;
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'text';
  hashtags?: string[];
  is_public?: boolean;
  allow_comments?: boolean;
  thumbnail_url?: string | null;
}

// NOTE: broken bucket constant removed 2026-07-18 — see STREETS_BUCKET below

/* ─────────── FEED ─────────── */

export async function getFeedPosts(limit = 20, offset = 0): Promise<StreetPost[]> {
  try {
    // FIXED 2026-07-18: this query used an embedded relationship
    // (creator:user_profiles!streets_posts_creator_id_fkey(...)) naming
    // an EXPLICIT foreign key constraint — but that constraint,
    // streets_posts_creator_id_fkey, actually points creator_id at
    // auth.users(id), not user_profiles. PostgREST rejects this outright
    // since the named FK doesn't establish any relationship to
    // user_profiles at all. This meant the entire main Streets feed
    // query has been failing on every call — verified via
    // pg_constraint directly before fixing, same root cause as the
    // mstudio video-embedding bug fixed earlier in this audit, just
    // hitting the feed itself this time rather than a secondary screen.
    const { data: posts, error } = await supabase
      .from('streets_posts')
      .select('*')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[streets-service] getFeedPosts error:', error);
      return [];
    }

    if (!posts || posts.length === 0) {
      return [];
    }

    const creatorIds = [...new Set(posts.map((p) => p.creator_id))];
    const { data: creators } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', creatorIds);

    const creatorMap = new Map((creators || []).map((c) => [c.user_id, c]));

    const enriched = posts.map((p) => ({
      ...p,
      creator: creatorMap.get(p.creator_id) || null,
    }));

    console.log('[streets-service] getFeedPosts returned:', enriched.length, 'posts');
    return enriched as StreetPost[];
  } catch (err) {
    console.error('[streets-service] getFeedPosts crash:', err);
    return [];
  }
}

/* ─────────── LIKE ─────────── */

export async function toggleLike(postId: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.warn('[streets-service] toggleLike: no user');
      return false;
    }

    const { data: existing } = await supabase
      .from('streets_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('streets_likes').delete().eq('id', existing.id);
      await supabase.rpc('decrement_post_likes', { post_id: postId });
      console.log('[streets-service] toggleLike: unliked', postId.slice(0, 8));
      return false;
    } else {
      await supabase.from('streets_likes').upsert(
        { post_id: postId, user_id: user.id },
        { onConflict: 'post_id,user_id', ignoreDuplicates: true }
      );
      await supabase.rpc('increment_post_likes', { post_id: postId });
      console.log('[streets-service] toggleLike: liked', postId.slice(0, 8));
      return true;
    }
  } catch (err) {
    console.error('[streets-service] toggleLike error:', err);
    return false;
  }
}

export async function checkIsLiked(postId: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return false;

    const { data } = await supabase
      .from('streets_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    return !!data;
  } catch {
    return false;
  }
}

/* ─────────── SAVE ─────────── */

export async function toggleSave(postId: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return false;

    const { data: existing } = await supabase
      .from('streets_saves')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await supabase.from('streets_saves').delete().eq('id', existing.id);
      await supabase.rpc('decrement_saves', { post_id: postId });
      return false;
    } else {
      await supabase.from('streets_saves').upsert(
        { post_id: postId, user_id: user.id },
        { onConflict: 'post_id,user_id', ignoreDuplicates: true }
      );
      await supabase.rpc('increment_saves', { post_id: postId });
      return true;
    }
  } catch {
    return false;
  }
}

/* ─────────── SHARE ─────────── */

export async function recordShare(postId: string): Promise<void> {
  try {
    await supabase.rpc('increment_shares', { post_id: postId });
  } catch (err) {
    console.error('[streets-service] recordShare error:', err);
  }
}

/* ─────────── COMMENTS ─────────── */

export async function getComments(postId: string) {
  try {
    const { data, error } = await supabase
      .from('streets_comments')
      .select(`
        *,
        author:user_profiles!streets_comments_user_id_fkey(user_id, display_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[streets-service] getComments error:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('[streets-service] getComments crash:', err);
    return [];
  }
}

export async function addComment(postId: string, content: string) {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return null;

    const { data, error } = await supabase
      .from('streets_comments')
      .insert({ post_id: postId, user_id: user.id, content })
      .select()
      .single();

    if (error) {
      console.error('[streets-service] addComment error:', error);
      return null;
    }
    return data;
  } catch (err) {
    console.error('[streets-service] addComment crash:', err);
    return null;
  }
}

/* ─────────── CREATE POST ─────────── */

export async function createPost(input: CreatePostInput): Promise<StreetPost | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.warn('[streets-service] createPost: no user');
      return null;
    }

    const { data, error } = await supabase
      .from('streets_posts')
      .insert({
        creator_id: user.id,
        content: input.content || null,
        caption: input.caption || null,
        media_url: input.media_url || null,
        media_type: input.media_type || 'text',
        hashtags: input.hashtags || [],
        is_public: input.is_public !== false,
        thumbnail_url: input.thumbnail_url || null,
      })
      .select()
      .single();

    if (error) {
      console.error('[streets-service] createPost error:', error);
      return null;
    }

    console.log('[streets-service] createPost success:', data?.id?.slice(0, 8));
    return data as StreetPost;
  } catch (err) {
    console.error('[streets-service] createPost crash:', err);
    return null;
  }
}

/* ─────────── DELETE POST ─────────── */

export async function deletePost(postId: string): Promise<boolean> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return false;

    const { error } = await supabase
      .from('streets_posts')
      .delete()
      .eq('id', postId)
      .eq('creator_id', user.id);

    if (error) {
      console.error('[streets-service] deletePost error:', error);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

/* ─────────── MEDIA UPLOAD ─────────── */

const STREETS_BUCKET = 'streets-media';
// FIXED 2026-07-18: was hardcoded to 'media', which internal notes flag
// as schema-broken. Verified 'streets-media' exists live in storage.

export interface UploadMediaResult {
  mediaUrl: string;
  thumbnailUrl: string | null;
}

/**
 * FIXED 2026-07-18: this function's signature never matched what
 * app/(os)/streets/create.tsx actually calls — confirmed 3 separate
 * mismatched versions existed (this one, a second orphaned attempt at
 * lib/services/upload-media-fix.ts with zero importers, and the call
 * site itself). Rewritten to match the real call site exactly:
 *   uploadMedia(uri, fileName, mimeType, onProgress) -> { mediaUrl, thumbnailUrl }
 *
 * The URI-to-uploadable-data conversion below is copied from the
 * confirmed-working avatar upload flow in app/(os)/profile/edit.tsx
 * (17 real objects in the 'avatars' bucket) rather than reinvented —
 * Platform.OS === 'web' needs a Blob, native RN needs an ArrayBuffer
 * via fetch(uri).arrayBuffer(), a bare URI string was never valid
 * input to supabase.storage.upload() in the first place.
 */
export async function uploadMedia(
  uri: string,
  fileName: string,
  mimeType: string,
  onProgress?: (progress: { percentage: number }) => void
): Promise<UploadMediaResult> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user;
  if (!user) {
    throw new Error('Not authenticated');
  }

  onProgress?.({ percentage: 10 });

  const ext = fileName.split('.').pop()?.toLowerCase() || (mimeType.startsWith('video') ? 'mp4' : 'jpg');
  const path = `${user.id}/${Date.now()}.${ext}`;

  let fileData: Blob | ArrayBuffer;
  if (Platform.OS === 'web') {
    fileData = await (await fetch(uri)).blob();
  } else {
    fileData = await (await fetch(uri)).arrayBuffer();
  }

  onProgress?.({ percentage: 50 });

  const { error: uploadError } = await supabase.storage
    .from(STREETS_BUCKET)
    .upload(path, fileData, { contentType: mimeType, upsert: true });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  onProgress?.({ percentage: 90 });

  const { data: urlData } = supabase.storage.from(STREETS_BUCKET).getPublicUrl(path);
  if (!urlData?.publicUrl) {
    throw new Error('Failed to get public URL after upload');
  }

  onProgress?.({ percentage: 100 });

  return { mediaUrl: urlData.publicUrl, thumbnailUrl: null };
}
