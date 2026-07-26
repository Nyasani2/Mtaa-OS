// ============================================================
// MTAA OS V10 - Tribes Service
// 28 tables: tribes, tribe_members, tribe_posts, tribe_events, etc.
// ============================================================

import { supabase } from '@/lib/supabase';

// ─── Types ───
export interface Tribe {
  id: string; name: string; description?: string; category?: string; location?: string;
  founder_id?: string; member_count?: number; avatar_url?: string; cover_url?: string;
  status: 'active' | 'inactive' | 'banned'; created_at?: string;
}

export interface TribeMember {
  id: string; tribe_id: string; user_id: string; role: 'founder' | 'admin' | 'moderator' | 'member';
  joined_at?: string; status?: string;
}

export interface TribePost {
  id: string; tribe_id: string; author_id: string; title?: string; content: string;
  media_url?: string; likes_count?: number; comments_count?: number; status?: string; created_at?: string;
}

export interface TribeEvent {
  id: string; tribe_id: string; organizer_id: string; title: string; description?: string;
  event_date?: string; location?: string; max_attendees?: number; status?: string; created_at?: string;
}

export interface TribeEventAttendee {
  id: string; event_id: string; user_id: string; status: 'going' | 'maybe' | 'not_going' | 'cancelled';
  registered_at?: string;
}

export interface TribeDonation {
  id: string; tribe_id: string; donor_id: string; amount: number; message?: string;
  status?: string; created_at?: string;
}

export interface TribeJoinPaid {
  id: string; tribe_id: string; user_id: string; amount: number; payment_status?: string;
  joined_at?: string;
}

export interface TribeLineage {
  id: string; tribe_id: string; person_id: string; parent_id?: string; generation?: number;
  lineage_data?: any; created_at?: string;
}

export interface TribeMuseum {
  id: string; tribe_id: string; name: string; description?: string; artifact_url?: string;
  category?: string; created_at?: string;
}

export interface TribeLanguage {
  id: string; tribe_id: string; word: string; meaning: string; pronunciation?: string;
  category?: string; created_at?: string;
}

export interface TribeCulture {
  id: string; tribe_id: string; title: string; description?: string; media_url?: string;
  category?: string; created_at?: string;
}

export interface TribeAnnouncement {
  id: string; tribe_id: string; author_id: string; title: string; content: string;
  priority?: string; status?: string; created_at?: string;
}

export interface TribePoll {
  id: string; tribe_id: string; author_id: string; question: string; options?: any;
  votes?: any; status?: string; expires_at?: string; created_at?: string;
}

export interface TribeResource {
  id: string; tribe_id: string; title: string; description?: string; url?: string;
  type?: string; created_at?: string;
}

export interface TribeGallery {
  id: string; tribe_id: string; uploader_id: string; title?: string; image_url: string;
  description?: string; created_at?: string;
}

export interface TribeMessage {
  id: string; tribe_id: string; sender_id: string; content: string; media_url?: string;
  created_at?: string;
}

export interface TribeRule {
  id: string; tribe_id: string; title: string; description?: string; priority?: number;
  created_at?: string;
}

export interface TribeBadge {
  id: string; tribe_id: string; name: string; description?: string; icon_url?: string;
  criteria?: string; created_at?: string;
}

export interface TribeMemberBadge {
  id: string; member_id: string; badge_id: string; awarded_at?: string;
}

export interface TribeMarketplace {
  id: string; tribe_id: string; seller_id: string; item_name: string; description?: string;
  price: number; image_url?: string; status?: string; created_at?: string;
}

export interface TribeHistory {
  id: string; tribe_id: string; title: string; description?: string; event_date?: string;
  significance?: string; created_at?: string;
}

export interface TribeLeader {
  id: string; tribe_id: string; user_id: string; title: string; tenure_start?: string;
  tenure_end?: string; status?: string; created_at?: string;
}

export interface TribeTerritory {
  id: string; tribe_id: string; name: string; boundaries?: any; area_sq_km?: number;
  status?: string; created_at?: string;
}

export interface TribeConflict {
  id: string; tribe_id: string; opposing_tribe_id?: string; description?: string;
  conflict_date?: string; resolution?: string; status?: string; created_at?: string;
}

export interface TribeAlliance {
  id: string; tribe_a_id: string; tribe_b_id: string; alliance_type?: string;
  established_at?: string; status?: string; created_at?: string;
}

export interface TribeRitual {
  id: string; tribe_id: string; name: string; description?: string; frequency?: string;
  next_date?: string; status?: string; created_at?: string;
}

export interface TribeRecipe {
  id: string; tribe_id: string; name: string; ingredients?: any; instructions?: string;
  image_url?: string; created_at?: string;
}

export interface TribeMusic {
  id: string; tribe_id: string; title: string; artist?: string; genre?: string;
  audio_url?: string; lyrics?: string; created_at?: string;
}

// ─── Helper ───
function handleError(err: any, fallback: any = null) {
  console.error('[TribesService]', err?.message || err);
  return fallback;
}

// ─── TRIBES ───
export async function getTribes(): Promise<Tribe[]> {
  const { data, error } = await supabase.from('tribes').select('*').eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function getTribeById(id: string): Promise<Tribe | null> {
  const { data, error } = await supabase.from('tribes').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getTribesByCategory(category: string): Promise<Tribe[]> {
  const { data, error } = await supabase.from('tribes').select('*').eq('category', category).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function searchTribes(query: string): Promise<Tribe[]> {
  const { data, error } = await supabase.from('tribes').select('*').ilike('name', `%${query}%`).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createTribe(data: Partial<Tribe>): Promise<Tribe | null> {
  const { data: result, error } = await supabase.from('tribes').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribe(id: string, data: Partial<Tribe>): Promise<Tribe | null> {
  const { data: result, error } = await supabase.from('tribes').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribe(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribes').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE MEMBERS ───
export async function getTribeMembers(tribeId: string): Promise<TribeMember[]> {
  const { data, error } = await supabase.from('tribe_members').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function getTribeMemberById(id: string): Promise<TribeMember | null> {
  const { data, error } = await supabase.from('tribe_members').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function getUserTribes(userId: string): Promise<TribeMember[]> {
  const { data, error } = await supabase.from('tribe_members').select('*').eq('user_id', userId);
  if (error) return handleError(error, []); return data || [];
}
export async function joinTribe(tribeId: string, userId: string, role: string = 'member'): Promise<TribeMember | null> {
  const { data: result, error } = await supabase.from('tribe_members').insert({ tribe_id: tribeId, user_id: userId, role }).select().single();
  if (error) return handleError(error, null); return result;
}
export async function leaveTribe(tribeId: string, userId: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_members').delete().eq('tribe_id', tribeId).eq('user_id', userId);
  if (error) return handleError(error, false); return true;
}
export async function updateTribeMember(id: string, data: Partial<TribeMember>): Promise<TribeMember | null> {
  const { data: result, error } = await supabase.from('tribe_members').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeMember(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_members').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE POSTS ───
export async function getTribePosts(tribeId: string): Promise<TribePost[]> {
  const { data, error } = await supabase.from('tribe_posts').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getTribePostById(id: string): Promise<TribePost | null> {
  const { data, error } = await supabase.from('tribe_posts').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTribePost(data: Partial<TribePost>): Promise<TribePost | null> {
  const { data: result, error } = await supabase.from('tribe_posts').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribePost(id: string, data: Partial<TribePost>): Promise<TribePost | null> {
  const { data: result, error } = await supabase.from('tribe_posts').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribePost(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_posts').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE EVENTS ───
export async function getTribeEvents(tribeId: string): Promise<TribeEvent[]> {
  const { data, error } = await supabase.from('tribe_events').select('*').eq('tribe_id', tribeId).order('event_date', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function getTribeEventById(id: string): Promise<TribeEvent | null> {
  const { data, error } = await supabase.from('tribe_events').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTribeEvent(data: Partial<TribeEvent>): Promise<TribeEvent | null> {
  const { data: result, error } = await supabase.from('tribe_events').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeEvent(id: string, data: Partial<TribeEvent>): Promise<TribeEvent | null> {
  const { data: result, error } = await supabase.from('tribe_events').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeEvent(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_events').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE EVENT ATTENDEES ───
export async function getTribeEventAttendees(eventId: string): Promise<TribeEventAttendee[]> {
  const { data, error } = await supabase.from('tribe_event_attendees').select('*').eq('event_id', eventId);
  if (error) return handleError(error, []); return data || [];
}
export async function registerForTribeEvent(eventId: string, userId: string, status: string = 'going'): Promise<TribeEventAttendee | null> {
  const { data: result, error } = await supabase.from('tribe_event_attendees').insert({ event_id: eventId, user_id: userId, status }).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeEventAttendee(id: string, data: Partial<TribeEventAttendee>): Promise<TribeEventAttendee | null> {
  const { data: result, error } = await supabase.from('tribe_event_attendees').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeEventAttendee(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_event_attendees').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE DONATIONS ───
export async function getTribeDonations(tribeId: string): Promise<TribeDonation[]> {
  const { data, error } = await supabase.from('tribe_donations').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function getTribeDonationById(id: string): Promise<TribeDonation | null> {
  const { data, error } = await supabase.from('tribe_donations').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function donateToTribe(data: Partial<TribeDonation>): Promise<TribeDonation | null> {
  const { data: result, error } = await supabase.from('tribe_donations').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeDonation(id: string, data: Partial<TribeDonation>): Promise<TribeDonation | null> {
  const { data: result, error } = await supabase.from('tribe_donations').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeDonation(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_donations').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE JOIN PAID ───
export async function getTribeJoinPaids(tribeId: string): Promise<TribeJoinPaid[]> {
  const { data, error } = await supabase.from('tribe_join_paid').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeJoinPaid(data: Partial<TribeJoinPaid>): Promise<TribeJoinPaid | null> {
  const { data: result, error } = await supabase.from('tribe_join_paid').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeJoinPaid(id: string, data: Partial<TribeJoinPaid>): Promise<TribeJoinPaid | null> {
  const { data: result, error } = await supabase.from('tribe_join_paid').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeJoinPaid(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_join_paid').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE LINEAGE ───
export async function getTribeLineage(tribeId: string): Promise<TribeLineage[]> {
  const { data, error } = await supabase.from('tribe_lineage').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function getTribeLineageById(id: string): Promise<TribeLineage | null> {
  const { data, error } = await supabase.from('tribe_lineage').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTribeLineage(data: Partial<TribeLineage>): Promise<TribeLineage | null> {
  const { data: result, error } = await supabase.from('tribe_lineage').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeLineage(id: string, data: Partial<TribeLineage>): Promise<TribeLineage | null> {
  const { data: result, error } = await supabase.from('tribe_lineage').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeLineage(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_lineage').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE MUSEUM ───
export async function getTribeMuseumItems(tribeId: string): Promise<TribeMuseum[]> {
  const { data, error } = await supabase.from('tribe_museum').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function getTribeMuseumItemById(id: string): Promise<TribeMuseum | null> {
  const { data, error } = await supabase.from('tribe_museum').select('*').eq('id', id).single();
  if (error) return handleError(error, null); return data;
}
export async function createTribeMuseumItem(data: Partial<TribeMuseum>): Promise<TribeMuseum | null> {
  const { data: result, error } = await supabase.from('tribe_museum').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeMuseumItem(id: string, data: Partial<TribeMuseum>): Promise<TribeMuseum | null> {
  const { data: result, error } = await supabase.from('tribe_museum').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeMuseumItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_museum').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE LANGUAGE ───
export async function getTribeLanguage(tribeId: string): Promise<TribeLanguage[]> {
  const { data, error } = await supabase.from('tribe_language').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeLanguage(data: Partial<TribeLanguage>): Promise<TribeLanguage | null> {
  const { data: result, error } = await supabase.from('tribe_language').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeLanguage(id: string, data: Partial<TribeLanguage>): Promise<TribeLanguage | null> {
  const { data: result, error } = await supabase.from('tribe_language').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeLanguage(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_language').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE CULTURE ───
export async function getTribeCulture(tribeId: string): Promise<TribeCulture[]> {
  const { data, error } = await supabase.from('tribe_culture').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeCulture(data: Partial<TribeCulture>): Promise<TribeCulture | null> {
  const { data: result, error } = await supabase.from('tribe_culture').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeCulture(id: string, data: Partial<TribeCulture>): Promise<TribeCulture | null> {
  const { data: result, error } = await supabase.from('tribe_culture').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeCulture(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_culture').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE ANNOUNCEMENTS ───
export async function getTribeAnnouncements(tribeId: string): Promise<TribeAnnouncement[]> {
  const { data, error } = await supabase.from('tribe_announcements').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeAnnouncement(data: Partial<TribeAnnouncement>): Promise<TribeAnnouncement | null> {
  const { data: result, error } = await supabase.from('tribe_announcements').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeAnnouncement(id: string, data: Partial<TribeAnnouncement>): Promise<TribeAnnouncement | null> {
  const { data: result, error } = await supabase.from('tribe_announcements').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeAnnouncement(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_announcements').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE POLLS ───
export async function getTribePolls(tribeId: string): Promise<TribePoll[]> {
  const { data, error } = await supabase.from('tribe_polls').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribePoll(data: Partial<TribePoll>): Promise<TribePoll | null> {
  const { data: result, error } = await supabase.from('tribe_polls').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribePoll(id: string, data: Partial<TribePoll>): Promise<TribePoll | null> {
  const { data: result, error } = await supabase.from('tribe_polls').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribePoll(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_polls').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE RESOURCES ───
export async function getTribeResources(tribeId: string): Promise<TribeResource[]> {
  const { data, error } = await supabase.from('tribe_resources').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeResource(data: Partial<TribeResource>): Promise<TribeResource | null> {
  const { data: result, error } = await supabase.from('tribe_resources').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeResource(id: string, data: Partial<TribeResource>): Promise<TribeResource | null> {
  const { data: result, error } = await supabase.from('tribe_resources').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeResource(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_resources').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE GALLERY ───
export async function getTribeGallery(tribeId: string): Promise<TribeGallery[]> {
  const { data, error } = await supabase.from('tribe_gallery').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeGalleryItem(data: Partial<TribeGallery>): Promise<TribeGallery | null> {
  const { data: result, error } = await supabase.from('tribe_gallery').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeGalleryItem(id: string, data: Partial<TribeGallery>): Promise<TribeGallery | null> {
  const { data: result, error } = await supabase.from('tribe_gallery').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeGalleryItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_gallery').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE MESSAGES ───
export async function getTribeMessages(tribeId: string): Promise<TribeMessage[]> {
  const { data, error } = await supabase.from('tribe_messages').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: true });
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeMessage(data: Partial<TribeMessage>): Promise<TribeMessage | null> {
  const { data: result, error } = await supabase.from('tribe_messages').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeMessage(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_messages').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE RULES ───
export async function getTribeRules(tribeId: string): Promise<TribeRule[]> {
  const { data, error } = await supabase.from('tribe_rules').select('*').eq('tribe_id', tribeId).order('priority');
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeRule(data: Partial<TribeRule>): Promise<TribeRule | null> {
  const { data: result, error } = await supabase.from('tribe_rules').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeRule(id: string, data: Partial<TribeRule>): Promise<TribeRule | null> {
  const { data: result, error } = await supabase.from('tribe_rules').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeRule(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_rules').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE BADGES ───
export async function getTribeBadges(tribeId: string): Promise<TribeBadge[]> {
  const { data, error } = await supabase.from('tribe_badges').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeBadge(data: Partial<TribeBadge>): Promise<TribeBadge | null> {
  const { data: result, error } = await supabase.from('tribe_badges').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeBadge(id: string, data: Partial<TribeBadge>): Promise<TribeBadge | null> {
  const { data: result, error } = await supabase.from('tribe_badges').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeBadge(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_badges').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE MEMBER BADGES ───
export async function getTribeMemberBadges(memberId: string): Promise<TribeMemberBadge[]> {
  const { data, error } = await supabase.from('tribe_member_badges').select('*').eq('member_id', memberId);
  if (error) return handleError(error, []); return data || [];
}
export async function awardTribeMemberBadge(data: Partial<TribeMemberBadge>): Promise<TribeMemberBadge | null> {
  const { data: result, error } = await supabase.from('tribe_member_badges').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}

// ─── TRIBE MARKETPLACE ───
export async function getTribeMarketplace(tribeId: string): Promise<TribeMarketplace[]> {
  const { data, error } = await supabase.from('tribe_marketplace').select('*').eq('tribe_id', tribeId).eq('status', 'active');
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeMarketplaceItem(data: Partial<TribeMarketplace>): Promise<TribeMarketplace | null> {
  const { data: result, error } = await supabase.from('tribe_marketplace').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeMarketplaceItem(id: string, data: Partial<TribeMarketplace>): Promise<TribeMarketplace | null> {
  const { data: result, error } = await supabase.from('tribe_marketplace').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeMarketplaceItem(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_marketplace').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE HISTORY ───
export async function getTribeHistory(tribeId: string): Promise<TribeHistory[]> {
  const { data, error } = await supabase.from('tribe_history').select('*').eq('tribe_id', tribeId).order('event_date', { ascending: false });
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeHistory(data: Partial<TribeHistory>): Promise<TribeHistory | null> {
  const { data: result, error } = await supabase.from('tribe_history').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeHistory(id: string, data: Partial<TribeHistory>): Promise<TribeHistory | null> {
  const { data: result, error } = await supabase.from('tribe_history').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeHistory(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_history').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE LEADERS ───
export async function getTribeLeaders(tribeId: string): Promise<TribeLeader[]> {
  const { data, error } = await supabase.from('tribe_leaders').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeLeader(data: Partial<TribeLeader>): Promise<TribeLeader | null> {
  const { data: result, error } = await supabase.from('tribe_leaders').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeLeader(id: string, data: Partial<TribeLeader>): Promise<TribeLeader | null> {
  const { data: result, error } = await supabase.from('tribe_leaders').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeLeader(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_leaders').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE TERRITORY ───
export async function getTribeTerritories(tribeId: string): Promise<TribeTerritory[]> {
  const { data, error } = await supabase.from('tribe_territory').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeTerritory(data: Partial<TribeTerritory>): Promise<TribeTerritory | null> {
  const { data: result, error } = await supabase.from('tribe_territory').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeTerritory(id: string, data: Partial<TribeTerritory>): Promise<TribeTerritory | null> {
  const { data: result, error } = await supabase.from('tribe_territory').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeTerritory(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_territory').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE CONFLICTS ───
export async function getTribeConflicts(tribeId: string): Promise<TribeConflict[]> {
  const { data, error } = await supabase.from('tribe_conflicts').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeConflict(data: Partial<TribeConflict>): Promise<TribeConflict | null> {
  const { data: result, error } = await supabase.from('tribe_conflicts').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeConflict(id: string, data: Partial<TribeConflict>): Promise<TribeConflict | null> {
  const { data: result, error } = await supabase.from('tribe_conflicts').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeConflict(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_conflicts').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE ALLIANCES ───
export async function getTribeAlliances(tribeId: string): Promise<TribeAlliance[]> {
  const { data, error } = await supabase.from('tribe_alliances').select('*').or(`tribe_a_id.eq.${tribeId},tribe_b_id.eq.${tribeId}`);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeAlliance(data: Partial<TribeAlliance>): Promise<TribeAlliance | null> {
  const { data: result, error } = await supabase.from('tribe_alliances').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeAlliance(id: string, data: Partial<TribeAlliance>): Promise<TribeAlliance | null> {
  const { data: result, error } = await supabase.from('tribe_alliances').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeAlliance(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_alliances').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE RITUALS ───
export async function getTribeRituals(tribeId: string): Promise<TribeRitual[]> {
  const { data, error } = await supabase.from('tribe_rituals').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeRitual(data: Partial<TribeRitual>): Promise<TribeRitual | null> {
  const { data: result, error } = await supabase.from('tribe_rituals').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeRitual(id: string, data: Partial<TribeRitual>): Promise<TribeRitual | null> {
  const { data: result, error } = await supabase.from('tribe_rituals').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeRitual(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_rituals').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE RECIPES ───
export async function getTribeRecipes(tribeId: string): Promise<TribeRecipe[]> {
  const { data, error } = await supabase.from('tribe_recipes').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeRecipe(data: Partial<TribeRecipe>): Promise<TribeRecipe | null> {
  const { data: result, error } = await supabase.from('tribe_recipes').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeRecipe(id: string, data: Partial<TribeRecipe>): Promise<TribeRecipe | null> {
  const { data: result, error } = await supabase.from('tribe_recipes').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeRecipe(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_recipes').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBE MUSIC ───
export async function getTribeMusic(tribeId: string): Promise<TribeMusic[]> {
  const { data, error } = await supabase.from('tribe_music').select('*').eq('tribe_id', tribeId);
  if (error) return handleError(error, []); return data || [];
}
export async function createTribeMusic(data: Partial<TribeMusic>): Promise<TribeMusic | null> {
  const { data: result, error } = await supabase.from('tribe_music').insert(data).select().single();
  if (error) return handleError(error, null); return result;
}
export async function updateTribeMusic(id: string, data: Partial<TribeMusic>): Promise<TribeMusic | null> {
  const { data: result, error } = await supabase.from('tribe_music').update(data).eq('id', id).select().single();
  if (error) return handleError(error, null); return result;
}
export async function deleteTribeMusic(id: string): Promise<boolean> {
  const { error } = await supabase.from('tribe_music').delete().eq('id', id);
  if (error) return handleError(error, false); return true;
}

// ─── TRIBES OPERATIONS ───
export async function tribeOperation(type: string, data?: any): Promise<any> {
  try {
    const { data: result, error } = await supabase.functions.invoke('tribe-operations', { body: { type, data } });
    if (error) throw error;
    return result;
  } catch (err) {
    return handleError(err, null);
  }
}

// ─── STATS ───
export async function getTribesStats(): Promise<any> {
  const { count: tribes } = await supabase.from('tribes').select('*', { count: 'exact', head: true });
  const { count: members } = await supabase.from('tribe_members').select('*', { count: 'exact', head: true });
  const { count: posts } = await supabase.from('tribe_posts').select('*', { count: 'exact', head: true });
  const { count: events } = await supabase.from('tribe_events').select('*', { count: 'exact', head: true });
  return { tribes, members, posts, events };
}

// === AUTO-MERGED: tribes-service-additions.ts ===
// Add these methods to lib/services/tribes-service.ts
// after the existing exports (around line 80+)

/* ─────────── CATEGORIES ─────────── */

export async function getCategories(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('tribes')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('[tribes-service] getCategories error:', error);
      return [];
    }

    const categories = [...new Set((data || []).map((t) => t.category).filter(Boolean))];
    return categories;
  } catch (e) {
    console.error('[tribes-service] getCategories exception:', e);
    return [];
  }
}

/* ─────────── EVENTS ─────────── */

export async function getEvents(tribeId: string): Promise<TribeEvent[]> {
  try {
    const { data, error } = await supabase
      .from('tribe_events')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('event_date', { ascending: true });

    if (error) {
      console.error('[tribes-service] getEvents error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('[tribes-service] getEvents exception:', e);
    return [];
  }
}

export async function getTribe(tribeId: string): Promise<Tribe | null> {
  try {
    const { data, error } = await supabase
      .from('tribes')
      .select('*')
      .eq('id', tribeId)
      .single();

    if (error) {
      console.error('[tribes-service] getTribe error:', error);
      return null;
    }

    return data;
  } catch (e) {
    console.error('[tribes-service] getTribe exception:', e);
    return null;
  }
}

export async function getPosts(tribeId: string): Promise<TribePost[]> {
  try {
    const { data, error } = await supabase
      .from('tribe_posts')
      .select('*')
      .eq('tribe_id', tribeId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[tribes-service] getPosts error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('[tribes-service] getPosts exception:', e);
    return [];
  }
}

export async function getMembers(tribeId: string): Promise<TribeMember[]> {
  try {
    const { data, error } = await supabase
      .from('tribe_members')
      .select('*')
      .eq('tribe_id', tribeId)
      .eq('status', 'active');

    if (error) {
      console.error('[tribes-service] getMembers error:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('[tribes-service] getMembers exception:', e);
    return [];
  }
}
