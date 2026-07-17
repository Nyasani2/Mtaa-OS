import { supabase } from '@/lib/supabase';

export interface FeedPost {
  id: string;
  creator_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video';
  created_at: string;
  updated_at: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  is_published: boolean;
  is_featured: boolean;
  category?: string;
  tags?: string[];
  location?: string;
  latitude?: number;
  longitude?: number;
  creator?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    username?: string;
  };
}

export interface FeedComment {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  parent_id?: string;
  author?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface FeedLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface FeedShare {
  id: string;
  post_id: string;
  user_id: string;
  platform?: string;
  created_at: string;
}

class FeedService {
  async getFeed(options: {
    limit?: number;
    offset?: number;
    category?: string;
    tag?: string;
    search?: string;
  } = {}) {
    const { limit = 20, offset = 0, category, tag, search } = options;

    let query = supabase
      .from('education_posts')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url, username)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq('category', category);
    }
    if (tag) {
      query = query.contains('tags', [tag]);
    }
    if (search) {
      query = query.or(`content.ilike.%${search}%,title.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as FeedPost[];
  }

  async getPostById(postId: string) {
    const { data, error } = await supabase
      .from('education_posts')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url, username)
      `)
      .eq('id', postId)
      .single();

    if (error) throw error;
    return data as FeedPost;
  }

  async createPost(post: Partial<FeedPost>) {
    const { data, error } = await supabase
      .from('education_posts')
      .insert(post)
      .select()
      .single();

    if (error) throw error;
    return data as FeedPost;
  }

  async updatePost(postId: string, updates: Partial<FeedPost>) {
    const { data, error } = await supabase
      .from('education_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (error) throw error;
    return data as FeedPost;
  }

  async deletePost(postId: string) {
    const { error } = await supabase
      .from('education_posts')
      .delete()
      .eq('id', postId);

    if (error) throw error;
  }

  async getComments(postId: string) {
    const { data, error } = await supabase
      .from('education_comments')
      .select(`
        *,
        author:author_id(id, full_name, avatar_url)
      `)
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []) as FeedComment[];
  }

  async addComment(postId: string, content: string, parentId?: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_comments')
      .insert({
        post_id: postId,
        author_id: userData.user.id,
        content,
        parent_id: parentId || null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as FeedComment;
  }

  async likePost(postId: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    const { data: existing } = await supabase
      .from('education_likes')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userData.user.id)
      .single();

    if (existing) {
      await supabase
        .from('education_likes')
        .delete()
        .eq('id', existing.id);

      await supabase.rpc('decrement_likes', { post_id: postId });
      return false;
    } else {
      await supabase
        .from('education_likes')
        .insert({
          post_id: postId,
          user_id: userData.user.id,
        });

      await supabase.rpc('increment_likes', { post_id: postId });
      return true;
    }
  }

  async sharePost(postId: string, platform?: string) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');

    await supabase
      .from('education_shares')
      .insert({
        post_id: postId,
        user_id: userData.user.id,
        platform: platform || null,
      });

    await supabase.rpc('increment_shares', { post_id: postId });
  }

  async incrementViews(postId: string) {
    await supabase.rpc('increment_views', { post_id: postId });
  }

  async getFeaturedPosts(limit: number = 5) {
    const { data, error } = await supabase
      .from('education_posts')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url, username)
      `)
      .eq('is_published', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as FeedPost[];
  }

  async getPostsByUser(userId: string, limit: number = 20) {
    const { data, error } = await supabase
      .from('education_posts')
      .select(`
        *,
        creator:creator_id(id, full_name, avatar_url, username)
      `)
      .eq('creator_id', userId)
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data || []) as FeedPost[];
  }
}

export const feedService = new FeedService();
export default feedService;
