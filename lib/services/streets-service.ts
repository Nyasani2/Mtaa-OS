import { supabase } from '@/lib/supabase';

export interface StreetPost {
  id: string;
  creator_id: string;
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'none';
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  saves_count: number;
  shares_count: number;
  view_count: number;
  created_at: string;
  updated_at: string;
  creator?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  };
  is_liked?: boolean;
  is_saved?: boolean;
}

export interface StreetPostWithAuthor extends StreetPost {}

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  likes_count: number;
  parent_id?: string;
  created_at: string;
  user?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  };
}

// ============================================
// FEED
// ============================================

export async function fetchFeed(limit = 20, offset = 0): Promise<StreetPost[]> {
  return getFeedPosts(limit, offset);
}

export async function getFeedPosts(limit = 20, offset = 0): Promise<StreetPost[]> {
  const { data: user } = await supabase.auth.getUser();
  const userId = user.user?.id;

  console.log('[getFeedPosts] Fetching posts, userId:', userId);

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
    console.error('[getFeedPosts] ERROR:', error);
    throw error;
  }

  console.log('[getFeedPosts] Returned', data?.length || 0, 'posts');
  if (data && data.length > 0) {
    console.log('[getFeedPosts] First post:', {
      id: data[0].id,
      creator: data[0].creator,
      media_url: data[0].media_url?.substring(0, 50),
      media_type: data[0].media_type,
    });
  }

  if (!data) return [];

  if (userId) {
    const postIds = data.map(p => p.id);
    const [{ data: likes }, { data: saves }] = await Promise.all([
      supabase.from('streets_likes').select('post_id').in('post_id', postIds).eq('user_id', userId),
      supabase.from('streets_saves').select('post_id').in('post_id', postIds).eq('user_id', userId),
    ]);
    const likedSet = new Set(likes?.map(l => l.post_id) || []);
    const savedSet = new Set(saves?.map(s => s.post_id) || []);
    return data.map(post => ({ ...post, is_liked: likedSet.has(post.id), is_saved: savedSet.has(post.id) }));
  }

  return data;
}

// ============================================
// POSTS
// ============================================

export async function createPost(post: {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio' | 'none';
  is_public?: boolean;
}): Promise<StreetPost> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  console.log('[createPost] Creating post:', {
    content: post.content?.substring(0, 50),
    media_url: post.media_url?.substring(0, 50),
    media_type: post.media_type,
    is_public: post.is_public,
  });

  const { data, error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: user.user.id,
      content: post.content,
      media_url: post.media_url || null,
      media_type: post.media_type || 'none',
      is_public: post.is_public !== false,
      likes_count: 0, comments_count: 0, saves_count: 0, shares_count: 0, view_count: 0,
    })
    .select(`*, creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, avatar_url)`)
    .single();

  if (error) {
    console.error('[createPost] ERROR:', error);
    throw error;
  }

  console.log('[createPost] Success:', data.id);
  return data;
}

export async function deletePost(postId: string): Promise<void> {
  const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
  if (error) throw error;
}

// ============================================
// MEDIA UPLOAD
// ============================================

export async function uploadMedia(
  file: File | Blob | { uri: string; type: string; name?: string },
  bucket: string = 'streets-media'
): Promise<string> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const ext = (file as any).name?.split('.').pop()
    || (file as any).type?.split('/').pop()
    || 'jpg';
  const filename = `${user.user.id}/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;

  console.log('[uploadMedia] Uploading to bucket:', bucket, 'filename:', filename);
  console.log('[uploadMedia] File type:', (file as any).type, 'uri:', (file as any).uri?.substring(0, 50));

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, file as any, { cacheControl: '3600', upsert: false });

  if (error) {
    console.error('[uploadMedia] ERROR:', error.message, error);
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
  console.log('[uploadMedia] Success, publicUrl:', publicUrl);
  return publicUrl;
}

// ============================================
// LIKES
// ============================================

export async function likePost(postId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_likes').insert({ post_id: postId, user_id: user.user.id }).select().maybeSingle();
  if (error && error.code !== '23505') { console.error('likePost error:', error); throw error; }
}

export async function unlikePost(postId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_likes').delete().eq('post_id', postId).eq('user_id', user.user.id);
  if (error) throw error;
}

export async function checkIsLiked(postId: string): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { data, error } = await supabase.from('streets_likes').select('post_id').eq('post_id', postId).eq('user_id', user.user.id).maybeSingle();
  if (error) { console.error('checkIsLiked error:', error); return false; }
  return !!data;
}

// ============================================
// SAVES
// ============================================

export async function savePost(postId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_saves').insert({ post_id: postId, user_id: user.user.id }).select().maybeSingle();
  if (error && error.code !== '23505') { console.error('savePost error:', error); throw error; }
}

export async function unsavePost(postId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_saves').delete().eq('post_id', postId).eq('user_id', user.user.id);
  if (error) throw error;
}

export async function checkIsSaved(postId: string): Promise<boolean> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;
  const { data, error } = await supabase.from('streets_saves').select('post_id').eq('post_id', postId).eq('user_id', user.user.id).maybeSingle();
  if (error) { console.error('checkIsSaved error:', error); return false; }
  return !!data;
}

// ============================================
// COMMENTS — FIXED to use user:user_profiles with user_id
// ============================================

export async function getComments(postId: string, parentId?: string | null): Promise<StreetComment[]> {
  let query = supabase
    .from('streets_comments')
    .select(`
      *,
      user:user_profiles!streets_comments_user_id_fkey(user_id, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (parentId === null) {
    query = query.is('parent_id', null);
  } else if (parentId) {
    query = query.eq('parent_id', parentId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getComments] ERROR:', error);
    throw error;
  }

  return data || [];
}

export async function createComment(postId: string, content: string, parentId?: string): Promise<StreetComment> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');

  const insertData: any = {
    post_id: postId,
    user_id: user.user.id,
    content,
    likes_count: 0,
  };
  if (parentId) insertData.parent_id = parentId;

  const { data, error } = await supabase
    .from('streets_comments')
    .insert(insertData)
    .select(`*, user:user_profiles!streets_comments_user_id_fkey(user_id, display_name, avatar_url)`)
    .single();

  if (error) {
    console.error('[createComment] ERROR:', error);
    throw error;
  }

  return data;
}

export async function deleteComment(commentId: string): Promise<void> {
  const { error } = await supabase.from('streets_comments').delete().eq('id', commentId);
  if (error) throw error;
}

// ============================================
// SHARES
// ============================================

export async function sharePost(postId: string): Promise<void> {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) throw new Error('Not authenticated');
  const { error } = await supabase.from('streets_shares').insert({ post_id: postId, user_id: user.user.id }).select().maybeSingle();
  if (error && error.code !== '23505') { console.error('sharePost error:', error); throw error; }
}

// ============================================
// VIEWS
// ============================================

export async function incrementViewCount(postId: string): Promise<void> {
  try {
    await supabase.rpc('increment_streets_counter', { p_post_id: postId, p_column_name: 'view_count' });
  } catch {
    await supabase.from('streets_posts').update({ view_count: supabase.rpc('coalesce', { val: 'view_count', default: 0 }).add(1) }).eq('id', postId);
  }
}

// ============================================
// CREATOR STATS
// ============================================

export async function getCreatorStats(creatorId: string) {
  const { data, error } = await supabase.from('streets_creator_stats').select('*').eq('creator_id', creatorId).single();
  if (error && error.code !== 'PGRST116') { console.error('getCreatorStats error:', error); throw error; }
  return data;
}

// ============================================
// MISSING EXPORTS — FeedCard.tsx compatibility
// ============================================

export const isLiked = checkIsLiked;
export const isSaved = checkIsSaved;

export async function toggleLike(postId: string): Promise<boolean> {
  const currentlyLiked = await checkIsLiked(postId);
  if (currentlyLiked) { await unlikePost(postId); return false; }
  else { await likePost(postId); return true; }
}

export async function toggleSave(postId: string): Promise<boolean> {
  const currentlySaved = await checkIsSaved(postId);
  if (currentlySaved) { await unsavePost(postId); return false; }
  else { await savePost(postId); return true; }
}

export async function recordShare(postId: string): Promise<void> {
  return sharePost(postId);
}
