import { supabase } from '@/lib/supabase';

// ============================================
// TYPES
// ============================================
export interface StreetPost {
  id: string;
  creator_id: string;
  content: string | null;
  media_url: string | null;
  media_type: 'image' | 'video' | 'text' | null;
  is_public: boolean;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  saves_count: number;
  view_count: number;
  location: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreetPostWithAuthor extends StreetPost {
  creator?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
    username?: string;
  };
}

export interface StreetComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    user_id: string;
    display_name: string;
    avatar_url?: string;
  };
}

export interface CreatePostInput {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'text';
  is_public?: boolean;
  location?: string;
}

// ============================================
// FEED
// ============================================
export async function getFeedPosts(limit = 10, offset = 0): Promise<StreetPostWithAuthor[]> {
  console.log('[streets-service] getFeedPosts:', { limit, offset });

  const { data, error } = await supabase
    .from('streets_posts')
    .select(`
      *,
      creator:user_profiles!streets_posts_creator_id_fkey(user_id, display_name, avatar_url, username)
    `)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('[streets-service] getFeedPosts error:', error);
    throw error;
  }

  const posts = (data || []).map((post: any) => ({
    ...post,
    creator: Array.isArray(post.creator) ? post.creator[0] : post.creator,
  }));

  console.log('[streets-service] getFeedPosts returned:', posts.length, 'posts');
  if (posts.length > 0) {
    console.log('[streets-service] First post ID:', posts[0].id, 'creator_id:', posts[0].creator_id);
  }
  return posts;
}

export async function fetchFeed(options?: { limit?: number; offset?: number }): Promise<StreetPostWithAuthor[]> {
  console.log('[streets-service] fetchFeed called');
  return getFeedPosts(options?.limit, options?.offset);
}

// ============================================
// LIKES
// ============================================
export async function toggleLike(postId: string): Promise<boolean> {
  console.log('[streets-service] toggleLike:', postId);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // FIX: Use .maybeSingle() instead of .single() to avoid 406 when no row exists
  const { data: existing } = await supabase
    .from('streets_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from('streets_likes').delete().eq('id', existing.id);
    // FIX: Use correct RPC name decrement_post_likes
    await supabase.rpc('decrement_post_likes', { post_id: postId });
    console.log('[streets-service] Unliked');
    return false;
  } else {
    await supabase.from('streets_likes').insert({ post_id: postId, user_id: user.id });
    // FIX: Use correct RPC name increment_post_likes
    await supabase.rpc('increment_post_likes', { post_id: postId });
    console.log('[streets-service] Liked');
    return true;
  }
}

// ============================================
// SAVES
// ============================================
export async function toggleSave(postId: string): Promise<boolean> {
  console.log('[streets-service] toggleSave:', postId);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

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
    await supabase.from('streets_saves').insert({ post_id: postId, user_id: user.id });
    await supabase.rpc('increment_saves', { post_id: postId });
    return true;
  }
}

// ============================================
// SHARES
// ============================================
export async function recordShare(postId: string): Promise<void> {
  console.log('[streets-service] recordShare:', postId);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  await supabase.from('streets_shares').insert({ post_id: postId, user_id: user.id });
  await supabase.rpc('increment_shares', { post_id: postId });
}

// ============================================
// COMMENTS
// ============================================
export async function getComments(postId: string): Promise<StreetComment[]> {
  console.log('[streets-service] getComments:', postId);

  const { data, error } = await supabase
    .from('streets_comments')
    .select(`
      *,
      user:user_profiles(user_id, display_name, avatar_url)
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[streets-service] getComments error:', error);
    throw error;
  }

  console.log('[streets-service] getComments returned:', data?.length || 0);
  return (data || []) as StreetComment[];
}

export async function createComment(postId: string, content: string): Promise<void> {
  console.log('[streets-service] createComment:', { postId, content: content.substring(0, 30) });

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be logged in to comment');
  }

  const { error } = await supabase
    .from('streets_comments')
    .insert({ 
      post_id: postId, 
      content: content.trim(),
      user_id: user.id,
    });

  if (error) {
    console.error('[streets-service] createComment error:', error);
    throw new Error(error.message || 'Failed to post comment');
  }

  console.log('[streets-service] createComment success');
}

// ============================================
// POSTS
// ============================================
export async function createPost(input: CreatePostInput) {
  console.log('[streets-service] createPost:', input);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('streets_posts')
    .insert({
      creator_id: user.id,
      content: input.content || null,
      media_url: input.media_url || null,
      media_type: input.media_type || 'text',
      is_public: input.is_public !== false,
      location: input.location || null,
    });

  if (error) {
    console.error('[streets-service] createPost error:', error);
    throw error;
  }

  console.log('[streets-service] createPost success');
}

export async function deletePost(postId: string): Promise<void> {
  console.log('[streets-service] deletePost:', postId);
  const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
  if (error) throw error;
}

// ============================================
// UPLOAD
// ============================================
export async function uploadMedia(
  file: File | Blob | { uri: string; type: string; name: string },
  bucket: string = 'media'
): Promise<string> {
  console.log('[streets-service] uploadMedia called');
  console.log('[streets-service] bucket param:', bucket);
  console.log('[streets-service] file constructor:', file?.constructor?.name);

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  let cleanBucket: string;
  let cleanFile: any;

  if (typeof bucket === 'string' && bucket.length < 50 && !bucket.startsWith('data:')) {
    cleanBucket = bucket;
    cleanFile = file;
  } else if (typeof file === 'string' && file.length < 50) {
    cleanBucket = file;
    cleanFile = bucket;
  } else {
    cleanBucket = 'media';
    cleanFile = file;
  }

  cleanBucket = String(cleanBucket).trim();
  console.log('[streets-service] cleanBucket:', cleanBucket);

  // CRITICAL FIX: Convert Blob to File to prevent bucket corruption (2Q== bug)
  if (cleanFile instanceof Blob && !(cleanFile instanceof File)) {
    const blobType = cleanFile.type || 'image/jpeg';
    const ext = blobType.includes('video') ? 'mp4' : 'jpg';
    const fileName = `media_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${ext}`;
    cleanFile = new File([cleanFile], fileName, { type: blobType });
    console.log('[streets-service] Converted Blob to File:', fileName);
  }

  console.log('[streets-service] cleanFile instanceof File:', cleanFile instanceof File);
  console.log('[streets-service] cleanFile name:', cleanFile?.name);

  const fileExt = cleanFile instanceof File 
    ? cleanFile.name.split('.').pop() 
    : cleanFile?.name?.split('.').pop() || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  console.log('[streets-service] Uploading to bucket:', cleanBucket, 'path:', filePath);

  const { data, error } = await supabase.storage
    .from(cleanBucket)
    .upload(filePath, cleanFile, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('[streets-service] Upload error:', error);
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(cleanBucket)
    .getPublicUrl(filePath);

  console.log('[streets-service] Upload success:', urlData.publicUrl.substring(0, 60));
  return urlData.publicUrl;
}
