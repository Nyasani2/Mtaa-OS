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
  thumbnail_url?: string | null;
  is_public?: boolean;
  allow_comments?: boolean;
}

// NOTE: broken bucket constant removed 2026-07-18 — see STREETS_BUCKET below

/* ─────────── FEED ─────────── */


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
        media_url: input.media_url || null,
        media_type: input.media_type || 'text',
        is_public: input.is_public !== false,
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
