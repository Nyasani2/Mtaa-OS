import { supabase } from '@/lib/supabase';

export interface ProfileData {
  id: string;
  user_id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  verified: boolean;
  created_at: string;
}

export interface CreatorData {
  creator_category: string[];
  monetization_enabled: boolean;
  monetization_status: string;
  content_count: number;
  total_views: number;
  total_likes: number;
  subscriber_count: number;
  earnings_total: number;
}

export interface BusinessData {
  business_name: string | null;
  business_type: string | null;
  kra_pin: string | null;
  tax_reference: string | null;
  business_verified: boolean;
  storefront_enabled: boolean;
}

export interface ProfileStats {
  followers_count: number;
  following_count: number;
  content_count: number;
  total_views: number;
  total_likes: number;
}

export interface TimelineItem {
  id: string;
  content_type: string;
  source_app: string;
  title: string | null;
  description: string | null;
  media_url: string | null;
  thumbnail_url: string | null;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  metadata: Record<string, any>;
}

// ─── Fetch Full Profile ───
export async function fetchProfile(userId: string): Promise<{
  profile: ProfileData | null;
  creator: CreatorData | null;
  business: BusinessData | null;
  stats: ProfileStats;
}> {
  const [{ data: profile }, { data: creator }, { data: business }, { data: stats }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', userId).single(),
    supabase.from('creator_profiles').select('*').eq('user_id', userId).single(),
    supabase.from('business_profiles').select('*').eq('user_id', userId).single(),
    supabase.rpc('get_profile_stats', { p_user_id: userId }),
  ]);

  return {
    profile: profile as ProfileData | null,
    creator: creator as CreatorData | null,
    business: business as BusinessData | null,
    stats: stats?.[0] || { followers_count: 0, following_count: 0, content_count: 0, total_views: 0, total_likes: 0 },
  };
}

// ─── Fetch Profile Timeline (cross-app content) ───
export async function fetchProfileTimeline(userId: string, limit = 20): Promise<TimelineItem[]> {
  const { data, error } = await supabase
    .from('profile_content_timeline')
    .select('*')
    .eq('user_id', userId)
    .eq('is_public', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Profile] Timeline error:', error.message);
    throw error;
  }

  return (data || []) as TimelineItem[];
}

// ─── Fetch Profile Content by Type ───
export async function fetchProfileContentByType(userId: string, contentType: string): Promise<TimelineItem[]> {
  const { data, error } = await supabase
    .from('profile_content_timeline')
    .select('*')
    .eq('user_id', userId)
    .eq('content_type', contentType)
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as TimelineItem[];
}

// ─── Toggle Follow ───
export async function toggleFollow(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  if (user.id === targetUserId) throw new Error('Cannot follow yourself');

  const { data: existing } = await supabase
    .from('profile_followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  if (existing) {
    await supabase.from('profile_followers').delete().eq('id', existing.id);
    return false;
  } else {
    await supabase.from('profile_followers').insert({
      follower_id: user.id,
      following_id: targetUserId,
    });
    return true;
  }
}

// ─── Check if Following ───
export async function isFollowing(targetUserId: string): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from('profile_followers')
    .select('id')
    .eq('follower_id', user.id)
    .eq('following_id', targetUserId)
    .maybeSingle();

  return !!data;
}

// ─── Fetch Followers List ───
export async function fetchFollowers(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('profile_followers')
    .select('follower_id, created_at, profiles:follower_id(id, full_name, avatar_url, username)')
    .eq('following_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── Fetch Following List ───
export async function fetchFollowing(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('profile_followers')
    .select('following_id, created_at, profiles:following_id(id, full_name, avatar_url, username)')
    .eq('follower_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// ─── Generate QR Code ───
export async function generateProfileQR(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const qrData = `mtaa://profile/${user.id}`;
  await supabase.from('// STUB_REMOVED: "profile_qr_codes"').upsert({
    user_id: user.id,
    qr_data: qrData,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  return qrData;
}

// ─── Update Profile ───
export async function updateProfile(payload: {
  full_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  avatar_url?: string;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('profiles').update(payload).eq('id', user.id);
  if (error) throw error;
}

// ─── Update Creator Profile ───
export async function updateCreatorProfile(payload: Partial<CreatorData>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('creator_profiles').upsert({
    user_id: user.id,
    ...payload,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}

// ─── Update Business Profile ───
export async function updateBusinessProfile(payload: Partial<BusinessData>): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('business_profiles').upsert({
    user_id: user.id,
    ...payload,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
}
