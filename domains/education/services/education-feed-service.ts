import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface FeedPost {
  id: string;
  institution_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface FeedPostWithAuthor extends FeedPost {
  author?: {
    user_id: string;
    full_name: string;
    avatar_url: string;
  } | null;
  is_liked?: boolean;
}

export async function getFeedPosts(filters?: {
  institution_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_feed_posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data: posts, error } = await query;
    if (error) throw error;
    return { data: (posts || []) as FeedPost[], error: null };
  } catch (error: any) {
    console.error('getFeedPosts error:', error);
    return { data: [], error };
  }
}

export async function getFeedPostById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_feed_posts')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as FeedPost, error: null };
  } catch (error: any) {
    console.error('getFeedPostById error:', error);
    return { data: null, error };
  }
}

export async function createFeedPost(post: Partial<FeedPost>) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('education_feed_posts')
      .insert([{ ...post, status: 'published' }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as FeedPost, error: null };
  } catch (error: any) {
    console.error('createFeedPost error:', error);
    return { data: null, error };
  }
}

export async function likeFeedPost(postId: string) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('education_feed_likes')
      .insert([{ post_id: postId, user_id: userId }]);
    if (error && !error.message.includes('duplicate')) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('likeFeedPost error:', error);
    return { success: false, error };
  }
}

export async function unlikeFeedPost(postId: string) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('education_feed_likes')
      .delete()
      .eq('post_id', postId)
      .eq('user_id', userId);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('unlikeFeedPost error:', error);
    return { success: false, error };
  }
}
