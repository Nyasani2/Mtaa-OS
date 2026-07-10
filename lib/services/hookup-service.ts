import { supabase } from '@/lib/supabase';

export interface DiscoveryFilters {
  ageMin?: number;
  ageMax?: number;
  distanceMax?: number;
  gender?: string;
  verifiedOnly?: boolean;
  relationshipIntent?: string;
}

export interface HookupProfile {
  id: string;
  full_name: string;
  avatar_url: string;
  bio: string;
  age: number;
  gender: string;
  interests: string[];
  distance_km: number;
  verified_level: number;
  relationship_intent: string;
  occupation: string;
  city: string;
}

export interface MatchItem {
  id: string;
  match_id: string;
  full_name: string;
  avatar_url: string;
  last_message: string;
  last_message_at: string;
  unread_count: number;
  verified_level: number;
}

export interface LikeItem {
  id: string;
  profile_id: string;
  full_name: string;
  avatar_url: string;
  age: number;
  city: string;
  is_super: boolean;
  created_at: string;
  is_mutual: boolean;
}

// ===================== DISCOVERY =====================

export async function getDiscoveryProfiles(userId: string, filters?: DiscoveryFilters): Promise<HookupProfile[]> {
  const [{ data: liked }, { data: passed }] = await Promise.all([
    supabase.from('hookup_likes').select('liked_id').eq('liker_id', userId),
    supabase.from('// STUB_REMOVED: "hookup_passes"').select('passed_id').eq('passer_id', userId),
  ]);

  const excludeIds = [
    userId,
    ...(liked || []).map((l: any) => l.liked_id),
    ...(passed || []).map((p: any) => p.passed_id),
  ].filter(Boolean);

  let query = supabase
    .from('profiles')
    .select(`
      id, full_name, avatar_url, bio, date_of_birth, gender,
      hookup_preferences(relationship_intent, occupation, city, interests, verified_level)
    `)
    .not('id', 'in', `(${excludeIds.join(',')})`)
    .limit(30);

  const { data, error } = await query;
  if (error) throw error;

  return (data || []).map((p: any) => {
    const prefs = p.hookup_preferences?.[0] || {};
    const age = p.date_of_birth
      ? Math.floor((Date.now() - new Date(p.date_of_birth).getTime()) / 31557600000)
      : 0;
    return {
      id: p.id,
      full_name: p.full_name || 'Unknown',
      avatar_url: p.avatar_url,
      bio: p.bio || 'No bio yet',
      age,
      gender: p.gender || '',
      interests: prefs.interests || [],
      distance_km: Math.floor(Math.random() * 25) + 1,
      verified_level: prefs.verified_level || 0,
      relationship_intent: prefs.relationship_intent || '',
      occupation: prefs.occupation || '',
      city: prefs.city || '',
    };
  });
}

// ===================== LIKES & MATCHES =====================

export async function likeProfile(userId: string, targetId: string, isSuper = false): Promise<boolean> {
  await supabase.from('hookup_likes').insert({
    liker_id: userId,
    liked_id: targetId,
    is_super: isSuper,
  });

  const { data: mutual } = await supabase
    .from('hookup_likes')
    .select('*')
    .eq('liker_id', targetId)
    .eq('liked_id', userId)
    .maybeSingle();

  if (mutual) {
    const [u1, u2] = userId < targetId ? [userId, targetId] : [targetId, userId];
    await supabase.from('hookup_matches').insert({ user1_id: u1, user2_id: u2 });
    return true; // It's a match
  }
  return false;
}

export async function passProfile(userId: string, targetId: string): Promise<void> {
  await supabase.from('// STUB_REMOVED: "hookup_passes"').insert({ passer_id: userId, passed_id: targetId });
}

export async function getMatches(userId: string): Promise<MatchItem[]> {
  const { data: matchRows, error } = await supabase
    .from('hookup_matches')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) throw error;

  const enriched: MatchItem[] = [];
  for (const match of (matchRows || [])) {
    const otherId = match.user1_id === userId ? match.user2_id : match.user1_id;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, hookup_preferences(verified_level)')
      .eq('id', otherId)
      .single();

    const { data: lastMsg } = await supabase
      .from('messages')
      .select('content, created_at')
      .or(`and(sender_id.eq.${userId},recipient_id.eq.${otherId}),and(sender_id.eq.${otherId},recipient_id.eq.${userId})`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { count: unread } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('sender_id', otherId)
      .eq('recipient_id', userId)
      .eq('read', false);

    enriched.push({
      id: otherId,
      match_id: match.id,
      full_name: profile?.full_name || 'Unknown',
      avatar_url: profile?.avatar_url || '',
      last_message: lastMsg?.content || 'Say hello!',
      last_message_at: lastMsg?.created_at || match.created_at,
      unread_count: unread || 0,
      verified_level: profile?.hookup_preferences?.[0]?.verified_level || 0,
    });
  }

  return enriched;
}

export async function getReceivedLikes(userId: string): Promise<LikeItem[]> {
  const { data: received } = await supabase
    .from('hookup_likes')
    .select('liker_id, is_super, created_at')
    .eq('liked_id', userId)
    .order('created_at', { ascending: false });

  const enriched: LikeItem[] = [];
  for (const like of (received || [])) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, date_of_birth, hookup_preferences(city)')
      .eq('id', like.liker_id)
      .single();

    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000)
      : 0;

    const { data: mutual } = await supabase
      .from('hookup_likes')
      .select('id')
      .eq('liker_id', userId)
      .eq('liked_id', like.liker_id)
      .maybeSingle();

    enriched.push({
      id: like.liker_id,
      profile_id: like.liker_id,
      full_name: profile?.full_name || 'Unknown',
      avatar_url: profile?.avatar_url || '',
      age,
      city: profile?.hookup_preferences?.[0]?.city || '',
      is_super: like.is_super || false,
      created_at: like.created_at,
      is_mutual: !!mutual,
    });
  }

  return enriched;
}

export async function getSentLikes(userId: string): Promise<LikeItem[]> {
  const { data: sent } = await supabase
    .from('hookup_likes')
    .select('liked_id, is_super, created_at')
    .eq('liker_id', userId)
    .order('created_at', { ascending: false });

  const enriched: LikeItem[] = [];
  for (const like of (sent || [])) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, date_of_birth, hookup_preferences(city)')
      .eq('id', like.liked_id)
      .single();

    const age = profile?.date_of_birth
      ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / 31557600000)
      : 0;

    enriched.push({
      id: like.liked_id,
      profile_id: like.liked_id,
      full_name: profile?.full_name || 'Unknown',
      avatar_url: profile?.avatar_url || '',
      age,
      city: profile?.hookup_preferences?.[0]?.city || '',
      is_super: like.is_super || false,
      created_at: like.created_at,
      is_mutual: false,
    });
  }

  return enriched;
}

// ===================== PROFILE =====================

export async function getFullProfile(userId: string, targetId: string) {
  const { data: pData, error: pErr } = await supabase
    .from('profiles')
    .select(`
      id, full_name, avatar_url, bio, date_of_birth, gender,
      hookup_preferences(
        relationship_intent, occupation, education, city, country,
        languages, religion, tribe, height, children, wants_children,
        smoker, drinker, interests, verified_level
      )
    `)
    .eq('id', targetId)
    .single();

  if (pErr) throw pErr;

  const prefs = pData.hookup_preferences?.[0] || {};
  const age = pData.date_of_birth
    ? Math.floor((Date.now() - new Date(pData.date_of_birth).getTime()) / 31557600000)
    : 0;

  const [u1, u2] = userId < targetId ? [userId, targetId] : [targetId, userId];
  const { data: matchData } = await supabase
    .from('hookup_matches')
    .select('id')
    .eq('user1_id', u1)
    .eq('user2_id', u2)
    .maybeSingle();

  const { data: likeData } = await supabase
    .from('hookup_likes')
    .select('id')
    .eq('liker_id', userId)
    .eq('liked_id', targetId)
    .maybeSingle();

  const { data: photoData } = await supabase
    .from('hookup_photos')
    .select('url')
    .eq('profile_id', targetId)
    .order('order_index', { ascending: true });

  return {
    id: pData.id,
    full_name: pData.full_name || 'Unknown',
    avatar_url: pData.avatar_url,
    bio: pData.bio || 'No bio yet',
    age,
    gender: pData.gender || '',
    relationship_intent: prefs.relationship_intent || '',
    occupation: prefs.occupation || '',
    education: prefs.education || '',
    city: prefs.city || '',
    country: prefs.country || '',
    languages: prefs.languages || '',
    religion: prefs.religion || '',
    tribe: prefs.tribe || '',
    height: prefs.height || '',
    children: prefs.children || '',
    wants_children: prefs.wants_children || '',
    smoker: prefs.smoker || '',
    drinker: prefs.drinker || '',
    interests: prefs.interests || [],
    verified_level: prefs.verified_level || 0,
    photos: (photoData || []).map((p: any) => p.url),
    is_match: !!matchData,
    has_liked: !!likeData,
  };
}

// ===================== SAFETY =====================

export async function reportProfile(reporterId: string, reportedId: string, reason: string): Promise<void> {
  await supabase.from('hookup_reports').insert({
    reporter_id: reporterId,
    reported_id: reportedId,
    reason,
  });
}

export async function blockUser(blockerId: string, blockedId: string): Promise<void> {
  await supabase.from('hookup_blocks').insert({
    blocker_id: blockerId,
    blocked_id: blockedId,
  });
}

export async function unblockUser(blockerId: string, blockedId: string): Promise<void> {
  await supabase.from('hookup_blocks').delete()
    .eq('blocker_id', blockerId)
    .eq('blocked_id', blockedId);
}

export async function getBlockedUsers(blockerId: string) {
  const { data: blocks } = await supabase
    .from('hookup_blocks')
    .select('blocked_id, created_at')
    .eq('blocker_id', blockerId)
    .order('created_at', { ascending: false });

  const enriched = [];
  for (const b of (blocks || [])) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name, avatar_url')
      .eq('id', b.blocked_id)
      .single();
    enriched.push({
      id: b.blocked_id,
      blocked_id: b.blocked_id,
      full_name: profile?.full_name || 'Unknown',
      avatar_url: profile?.avatar_url || '',
      blocked_at: b.created_at,
    });
  }
  return enriched;
}

export async function getMyReports(userId: string) {
  const { data: reports } = await supabase
    .from('hookup_reports')
    .select('id, reported_id, reason, status, created_at')
    .eq('reporter_id', userId)
    .order('created_at', { ascending: false });

  const enriched = [];
  for (const r of (reports || [])) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', r.reported_id)
      .single();
    enriched.push({
      id: r.id,
      reported_name: profile?.full_name || 'Unknown',
      reason: r.reason,
      status: r.status || 'pending',
      created_at: r.created_at,
    });
  }
  return enriched;
}

// ===================== PREFERENCES =====================

export async function getPreferences(userId: string) {
  const { data } = await supabase
    .from('hookup_preferences')
    .select('*')
    .eq('profile_id', userId)
    .single();
  return data;
}

export async function savePreferences(userId: string, prefs: Record<string, any>): Promise<void> {
  const { error } = await supabase.from('hookup_preferences').upsert({
    profile_id: userId,
    ...prefs,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'profile_id' });

  if (error) throw error;
}

// ===================== DELETE =====================

export async function deleteHookupProfile(userId: string): Promise<void> {
  await Promise.all([
    supabase.from('hookup_preferences').delete().eq('profile_id', userId),
    supabase.from('hookup_likes').delete().eq('liker_id', userId),
    supabase.from('// STUB_REMOVED: "hookup_passes"').delete().eq('passer_id', userId),
    supabase.from('hookup_matches').delete().or(`user1_id.eq.${userId},user2_id.eq.${userId}`),
    supabase.from('hookup_blocks').delete().eq('blocker_id', userId),
    supabase.from('hookup_reports').delete().eq('reporter_id', userId),
    supabase.from('hookup_photos').delete().eq('profile_id', userId),
  ]);
}
