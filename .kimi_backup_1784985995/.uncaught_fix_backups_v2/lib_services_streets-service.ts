/**
 * MTAA OS V10 — Streets Service
 * EXPLICIT QUERY PATTERN ONLY. No implicit joins.
 * streets_posts.creator_id → user_profiles.id
 */
import { supabase } from '@/lib/supabase/client';

export interface StreetsPost {
  id: string;
  creator_id: string;
  content: string;
  media_urls: string[] | null;
  location: any | null;
  visibility: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
}

export interface StreetsPostWithCreator extends StreetsPost {
  creator: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    user_id: string;
  } | null;
}

const TABLE = 'streets_posts';

/** Fetch feed with EXPLICIT two-step query (no implicit join alias bug) */
export async function fetchStreetsFeed(options: {
  limit?: number;
  offset?: number;
  visibility?: string;
} = {}): Promise<StreetsPostWithCreator[]> {
  const { limit = 20, offset = 0, visibility = 'public' } = options;

  // Step 1: Fetch posts explicitly
  const { data: posts, error: postsError } = await supabase
    .from(TABLE)
    .select('*')
    .eq('visibility', visibility)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (postsError) throw postsError;
  if (!posts || posts.length === 0) return [];

  // Step 2: Fetch creators explicitly by IDs
  const creatorIds = [...new Set(posts.map((p: any) => p.creator_id).filter(Boolean))];
  let creatorsMap = new Map<string, any>();

  if (creatorIds.length > 0) {
    const { data: creators, error: creatorsError } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url, user_id')
      .in('id', creatorIds);

    if (!creatorsError && creators) {
      creators.forEach((c: any) => creatorsMap.set(c.id, c));
    }
  }

  // Step 3: Merge manually
  return posts.map((post: any) => ({
    ...post,
    creator: creatorsMap.get(post.creator_id) ?? null,
  }));
}

/** Fetch single post with creator (explicit pattern) */
export async function fetchStreetsPostById(postId: string): Promise<StreetsPostWithCreator | null> {
  const { data: post, error } = await supabase
    .from(TABLE)
    .select('*')
    .eq('id', postId)
    .single();

  if (error || !post) return null;

  const { data: creator } = await supabase
    .from('user_profiles')
    .select('id, full_name, avatar_url, user_id')
    .eq('id', post.creator_id)
    .single();

  return { ...post, creator: creator ?? null };
}

/** Create post */
export async function createStreetsPost(payload: {
  creator_id: string;
  content: string;
  media_urls?: string[];
  location?: any;
  visibility?: string;
}) {
  const { data, error } = await supabase.from(TABLE).insert(payload).select().single();
  if (error) throw error;
  return data;
}

/** Like / Unlike */
export async function toggleStreetsLike(postId: string, userId: string) {
  const { data: existing } = await supabase
    .from('streets_likes')
    .select('id')
    .eq('post_id', postId)
    .eq('user_id', userId)
    .single();

  if (existing) {
    await supabase.from('streets_likes').delete().eq('id', existing.id);
    await supabase.rpc('decrement_streets_likes', { post_id: postId });
    return { liked: false };
  } else {
    await supabase.from('streets_likes').insert({ post_id: postId, user_id: userId });
    await supabase.rpc('increment_streets_likes', { post_id: postId });
    return { liked: true };
  }
}

/** Fetch comments for a post (explicit pattern) */
export async function fetchStreetsComments(postId: string) {
  const { data: comments, error: cErr } = await supabase
    .from('streets_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (cErr) throw cErr;
  if (!comments || comments.length === 0) return [];

  const userIds = [...new Set(comments.map((c: any) => c.user_id).filter(Boolean))];
  let userMap = new Map<string, any>();

  if (userIds.length > 0) {
    const { data: users } = await supabase
      .from('user_profiles')
      .select('id, full_name, avatar_url')
      .in('id', userIds);
    if (users) users.forEach((u: any) => userMap.set(u.id, u));
  }

  return comments.map((c: any) => ({ ...c, user: userMap.get(c.user_id) ?? null }));
}
