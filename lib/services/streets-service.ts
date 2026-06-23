import { supabase } from '@/lib/supabase';

// ============================================
// FIXED uploadMedia - uses correct bucket name
// ============================================
export async function uploadMedia(
  file: File | Blob | { uri: string; type: string; name: string },
  bucket: string = 'media'
): Promise<string> {
  console.log('[streets-service] uploadMedia called, bucket:', bucket);

  const user = (await supabase.auth.getUser()).data.user;
  if (!user) throw new Error('Not authenticated');

  const fileExt = file instanceof File 
    ? file.name.split('.').pop() 
    : 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = `${user.id}/${fileName}`;

  console.log('[streets-service] Uploading to:', { bucket, filePath });

  // CRITICAL FIX: Ensure bucket is a plain string, not encoded
  const cleanBucket = String(bucket).trim();

  const { data, error } = await supabase.storage
    .from(cleanBucket)
    .upload(filePath, file, {
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

// ============================================
// FIXED Comments - proper types and functions
// ============================================
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

  const { error } = await supabase
    .from('streets_comments')
    .insert({ 
      post_id: postId, 
      content: content.trim() 
    });

  if (error) {
    console.error('[streets-service] createComment error:', error);
    throw error;
  }

  console.log('[streets-service] createComment success');
}

// ============================================
// FIXED createPost - handles missing media gracefully
// ============================================
export interface CreatePostInput {
  content: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'text';
  is_public?: boolean;
  location?: string;
}

export async function createPost(input: CreatePostInput) {
  console.log('[streets-service] createPost:', input);

  const { error } = await supabase
    .from('streets_posts')
    .insert({
      content: input.content,
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
