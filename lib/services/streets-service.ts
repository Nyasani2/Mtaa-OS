// lib/services/streets-service.ts
// MTAA Streets — Canonical Service

import { supabase } from '@/lib/supabase';

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
  media_url?: string | null;
  media_type?: 'image' | 'video' | 'text';
  is_public?: boolean;
}

const BUCKET_NAME = 'media';

/* ─────────── FEED ─────────── */

export async function getFeedPosts(limit = 20, offset = 0): Promise<StreetPost[]> {
  try {
    const { data, error } = await supabase
      .from('streets_posts')
      .select(`
        *,
        creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, avatar_url)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[streets-service] getFeedPosts error:', error);
      return [];
    }

    console.log('[streets-service] getFeedPosts returned:', data?.length || 0, 'posts');
    return (data || []) as StreetPost[];
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

export async function uploadMedia(
  file: File | Blob,
  folder: string = 'streets'
): Promise<string | null> {
  try {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) {
      console.warn('[streets-service] uploadMedia: no user');
      return null;
    }

    const ext = file instanceof File ? file.name.split('.').pop() || 'jpg' : 'jpg';
    const path = `${folder}/${user.id}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(path, file, { upsert: true });

    if (uploadError) {
      console.error('[streets-service] uploadMedia upload error:', uploadError);
      return null;
    }

    const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
    console.log('[streets-service] uploadMedia success:', urlData?.publicUrl?.slice(0, 60));
    return urlData?.publicUrl || null;
  } catch (err) {
    console.error('[streets-service] uploadMedia crash:', err);
    return null;
  }
}
