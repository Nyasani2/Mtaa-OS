import { supabase } from '@/lib/supabase/client';
import type { StreetsPost, StreetsComment } from '@/lib/types/streets';

export interface CreatePostInput {
  content: string;
  mediaUrl?: string;
  mediaType?: string;
}

class StreetsService {
  async getFeed(page: number = 0, limit: number = 20): Promise<StreetsPost[]> {
    const from = page * limit;
    const to = from + limit - 1;

    const { data, error } = await supabase
      .from('streets_posts')
      .select(`
        id, creator_id, content, media_url, media_type,
        likes_count, comments_count, shares_count, views_count,
        created_at, updated_at, is_public, allow_comments, caption, hashtags,
        creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)
      `)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      id: row.id,
      content: row.content || row.caption || '',
      media_url: row.media_url,
      media_type: row.media_type,
      created_at: row.created_at,
      updated_at: row.updated_at,
      creator_id: row.creator_id,
      creator_name: row.creator?.display_name || row.creator?.full_name || row.creator?.username || 'Unknown',
      creator_avatar: row.creator?.avatar_url || null,
      creator_verified: row.creator?.verified || false,
      likes_count: row.likes_count || 0,
      comments_count: row.comments_count || 0,
      shares_count: row.shares_count || 0,
      views_count: row.views_count || 0,
      is_liked: false,
      is_public: row.is_public,
      allow_comments: row.allow_comments,
      hashtags: row.hashtags || [],
    }));
  }

  async createPost(input: CreatePostInput): Promise<StreetsPost> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    let mediaUrl: string | null = null;
    let mediaType: string = input.mediaType || 'text';

    // Upload media if provided
    if (input.mediaUrl) {
      const fileName = `${userData.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

      const response = await fetch(input.mediaUrl);
      const blob = await response.blob();

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('streets-media')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '86400',
          upsert: false,
        });

      if (uploadError) throw new Error(uploadError.message);

      const { data: urlData } = supabase.storage
        .from('streets-media')
        .getPublicUrl(fileName);

      mediaUrl = urlData.publicUrl;
      mediaType = 'image';
    }

    const { data, error } = await supabase
      .from('streets_posts')
      .insert({
        creator_id: userData.user.id,
        content: input.content,
        caption: input.content,
        media_url: mediaUrl,
        media_type: mediaType,
        is_public: true,
        allow_comments: true,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      content: data.content || data.caption || '',
      media_url: data.media_url,
      media_type: data.media_type,
      created_at: data.created_at,
      updated_at: data.updated_at,
      creator_id: data.creator_id,
      creator_name: userData.user.user_metadata?.display_name || 'You',
      creator_avatar: userData.user.user_metadata?.avatar_url || null,
      creator_verified: false,
      likes_count: 0,
      comments_count: 0,
      shares_count: 0,
      views_count: 0,
      is_liked: false,
      is_public: data.is_public,
      allow_comments: data.allow_comments,
      hashtags: data.hashtags || [],
    };
  }

  async likePost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('streets_likes')
      .insert({ post_id: postId, user_id: userData.user.id })
      .select()
      .maybeSingle();

    if (error && !error.message.includes('duplicate')) {
      throw new Error(error.message);
    }
  }

  async unlikePost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('streets_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userData.user.id);

    if (error) throw new Error(error.message);
  }

  async getComments(postId: string): Promise<StreetsComment[]> {
    const { data, error } = await supabase
      .from('streets_comments')
      .select(`
        id, content, created_at, post_id, user_id,
        user:user_profiles(user_id, full_name, display_name, username, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(error.message);

    return (data || []).map((row: any) => ({
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      post_id: row.post_id,
      user_id: row.user_id,
      user_name: row.user?.display_name || row.user?.full_name || row.user?.username || 'Unknown',
      user_avatar: row.user?.avatar_url || null,
    }));
  }

  async addComment(postId: string, content: string): Promise<StreetsComment> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('streets_comments')
      .insert({
        post_id: postId,
        user_id: userData.user.id,
        content: content.trim(),
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      id: data.id,
      content: data.content,
      created_at: data.created_at,
      post_id: data.post_id,
      user_id: data.user_id,
      user_name: userData.user.user_metadata?.display_name || 'You',
      user_avatar: userData.user.user_metadata?.avatar_url || null,
    };
  }

  async deletePost(postId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data: post } = await supabase
      .from('streets_posts')
      .select('creator_id, media_url')
      .eq('id', postId)
      .single();

    if (post?.creator_id !== userData.user.id) {
      throw new Error('Not authorized to delete this post');
    }

    // Delete media from storage
    if (post?.media_url) {
      const path = post.media_url.split('/streets-media/')[1];
      if (path) {
        await supabase.storage.from('streets-media').remove([path]);
      }
    }

    const { error } = await supabase
      .from('streets_posts')
      .delete()
      .eq('id', postId);

    if (error) throw new Error(error.message);
  }

  async getPostById(postId: string): Promise<StreetsPost | null> {
    const { data, error } = await supabase
      .from('streets_posts')
      .select(`
        id, creator_id, content, media_url, media_type,
        likes_count, comments_count, shares_count, views_count,
        created_at, updated_at, is_public, allow_comments, caption, hashtags,
        creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)
      `)
      .eq('id', postId)
      .single();

    if (error) return null;

    return {
      id: data.id,
      content: data.content || data.caption || '',
      media_url: data.media_url,
      media_type: data.media_type,
      created_at: data.created_at,
      updated_at: data.updated_at,
      creator_id: data.creator_id,
      creator_name: data.creator?.display_name || data.creator?.full_name || data.creator?.username || 'Unknown',
      creator_avatar: data.creator?.avatar_url || null,
      creator_verified: data.creator?.verified || false,
      likes_count: data.likes_count || 0,
      comments_count: data.comments_count || 0,
      shares_count: data.shares_count || 0,
      views_count: data.views_count || 0,
      is_liked: false,
      is_public: data.is_public,
      allow_comments: data.allow_comments,
      hashtags: data.hashtags || [],
    };
  }
}

export const streetsService = new StreetsService();
