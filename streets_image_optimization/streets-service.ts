import { supabase } from '@/lib/supabase/client';
import * as FileSystem from 'expo-file-system';

// ─── TYPES ───
export interface CreatePostInput {
  caption: string;
  media_urls: string[];
  post_type: string;
  creator_id: string;
  location?: string;
  tags?: string[];
}

export interface Post {
  id: string;
  caption: string;
  media_urls: string[] | null;
  post_type: string;
  like_count: number;
  comment_count: number;
  share_count: number;
  creator_id: string;
  creator?: { full_name: string; avatar_url?: string };
  created_at: string;
  updated_at: string;
  location?: string;
  tags?: string[];
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface Comment {
  id: string;
  post_id: string;
  creator_id: string;
  creator?: { full_name: string; avatar_url?: string };
  content: string;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  actor_id: string;
  actor?: { full_name: string; avatar_url?: string };
  type: 'like' | 'comment' | 'follow' | 'mention' | 'save';
  post_id?: string;
  read: boolean;
  created_at: string;
}

// ─── STORAGE UPLOAD ───
const BUCKET = 'streets-media';

export const streetsService = {
  // Upload media with metadata for CDN optimization
  async uploadMedia(uri: string, type: 'image' | 'video' | 'audio'): Promise<string | null> {
    const ext = type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3';
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const filePath = `${type}s/${fileName}`;

    // Read file as base64 for upload
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const blob = Buffer.from(base64, 'base64');

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, blob, {
        contentType: type === 'image' ? 'image/jpeg' : type === 'video' ? 'video/mp4' : 'audio/mpeg',
        cacheControl: '86400', // 24h CDN cache
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    return urlData.publicUrl;
  },

  // ─── POSTS ───
  async createPost(input: CreatePostInput): Promise<Post> {
    const { data, error } = await supabase
      .from('streets_posts')
      .insert({
        caption: input.caption,
        media_urls: input.media_urls,
        post_type: input.post_type,
        creator_id: input.creator_id,
        location: input.location,
        tags: input.tags,
      })
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .single();
    if (error) throw error;
    return data;
  },

  async getFeed(page = 1, limit = 20, userId?: string): Promise<Post[]> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase
      .from('streets_posts')
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error } = await query;
    if (error) throw error;

    // Enrich with like/save status if userId provided
    if (userId && data) {
      const postIds = data.map(p => p.id);
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('streets_likes').select('post_id').in('post_id', postIds).eq('user_id', userId),
        supabase.from('streets_saves').select('post_id').in('post_id', postIds).eq('user_id', userId),
      ]);
      const likedSet = new Set(likes?.map(l => l.post_id) || []);
      const savedSet = new Set(saves?.map(s => s.post_id) || []);
      return data.map(p => ({ ...p, is_liked: likedSet.has(p.id), is_saved: savedSet.has(p.id) }));
    }
    return data || [];
  },

  async getPostById(postId: string, userId?: string): Promise<Post | null> {
    const { data, error } = await supabase
      .from('streets_posts')
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .eq('id', postId)
      .single();
    if (error) return null;

    if (userId) {
      const [{ data: likes }, { data: saves }] = await Promise.all([
        supabase.from('streets_likes').select('post_id').eq('post_id', postId).eq('user_id', userId).single(),
        supabase.from('streets_saves').select('post_id').eq('post_id', postId).eq('user_id', userId).single(),
      ]);
      return { ...data, is_liked: !!likes, is_saved: !!saves };
    }
    return data;
  },

  async getPostsByCreator(creatorId: string, page = 1, limit = 21): Promise<Post[]> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error } = await supabase
      .from('streets_posts')
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .eq('creator_id', creatorId)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return data || [];
  },

  async deletePost(postId: string): Promise<void> {
    const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
    if (error) throw error;
  },

  // ─── LIKES ───
  async toggleLike(postId: string, userId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('streets_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('streets_likes').delete().eq('id', existing.id);
      await supabase.rpc('decrement_like_count', { post_id: postId });
    } else {
      await supabase.from('streets_likes').insert({ post_id: postId, user_id: userId });
      await supabase.rpc('increment_like_count', { post_id: postId });
    }
  },

  // ─── SAVES ───
  async toggleSave(postId: string, userId: string): Promise<void> {
    const { data: existing } = await supabase
      .from('streets_saves')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase.from('streets_saves').delete().eq('id', existing.id);
    } else {
      await supabase.from('streets_saves').insert({ post_id: postId, user_id: userId });
    }
  },

  // ─── COMMENTS ───
  async getComments(postId: string): Promise<Comment[]> {
    const { data, error } = await supabase
      .from('streets_comments')
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async addComment(postId: string, userId: string, content: string): Promise<Comment> {
    const { data, error } = await supabase
      .from('streets_comments')
      .insert({ post_id: postId, creator_id: userId, content })
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .single();
    if (error) throw error;
    // Increment comment count
    await supabase.rpc('increment_comment_count', { post_id: postId });
    return data;
  },

  async deleteComment(commentId: string): Promise<void> {
    const { error } = await supabase.from('streets_comments').delete().eq('id', commentId);
    if (error) throw error;
  },

  // ─── FOLLOWS ───
  async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
    const { data: existing } = await supabase
      .from('streets_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();

    if (existing) {
      await supabase.from('streets_follows').delete().eq('id', existing.id);
      return false; // now unfollowed
    } else {
      await supabase.from('streets_follows').insert({ follower_id: followerId, following_id: followingId });
      return true; // now following
    }
  },

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data } = await supabase
      .from('streets_follows')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single();
    return !!data;
  },

  async getFollowCounts(userId: string): Promise<{ followers: number; following: number }> {
    const [{ count: followers }, { count: following }] = await Promise.all([
      supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('following_id', userId),
      supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('follower_id', userId),
    ]);
    return { followers: followers || 0, following: following || 0 };
  },

  // ─── NOTIFICATIONS ───
  async getNotifications(userId: string, page = 1, limit = 20): Promise<NotificationItem[]> {
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    const { data, error } = await supabase
      .from('streets_notifications')
      .select('*, actor:user_profiles(full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(from, to);
    if (error) throw error;
    return data || [];
  },

  async markNotificationRead(notificationId: string): Promise<void> {
    await supabase.from('streets_notifications').update({ read: true }).eq('id', notificationId);
  },

  async markAllNotificationsRead(userId: string): Promise<void> {
    await supabase.from('streets_notifications').update({ read: true }).eq('user_id', userId);
  },

  // ─── SEARCH ───
  async searchPosts(query: string, limit = 20): Promise<Post[]> {
    const { data, error } = await supabase
      .from('streets_posts')
      .select('*, creator:user_profiles(full_name, avatar_url)')
      .or(`caption.ilike.%${query}%,tags.cs.{${query}}`)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async searchUsers(query: string, limit = 20): Promise<{ id: string; full_name: string; avatar_url?: string }[]> {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .ilike('full_name', `%${query}%`)
      .limit(limit);
    if (error) throw error;
    return data || [];
  },

  async getTrendingTags(limit = 10): Promise<{ tag: string; count: number }[]> {
    // Returns most used tags from streets_posts
    const { data, error } = await supabase.rpc('get_trending_tags', { limit_count: limit });
    if (error) throw error;
    return data || [];
  },
};
