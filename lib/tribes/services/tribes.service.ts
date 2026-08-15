// @ts-nocheck
import { supabase } from '@/lib/supabase';

export async function getTribes(filter?: { category?: string; q?: string }) {
  let q = supabase.from('tribes').select('*').order('created_at', { ascending: false }).limit(50);
  if (filter?.category) q = q.eq('category', filter.category);
  if (filter?.q) q = q.ilike('name', `%${filter.q}%`);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function getTribe(id: string) {
  const { data, error } = await supabase.from('tribes').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}
export async function getMyTribes(userId: string) {
  const { data, error } = await supabase.from('tribe_members').select('role, tribes(*)').eq('user_id', userId).eq('status', 'active');
  if (error) throw error;
  return (data || []).map((m: any) => ({ ...m.tribes, my_role: m.role }));
}
export async function createTribe(input: any) {
  const { data, error } = await supabase.from('tribes').insert(input).select().single();
  if (error) throw error;
  return data;
}
export async function joinTribe(tribeId: string, userId: string) {
  const { error } = await supabase.from('tribe_members').upsert({ tribe_id: tribeId, user_id: userId, role: 'member', status: 'active' }, { onConflict: 'tribe_id,user_id' });
  if (error) throw error;
  await notify(tribeId, userId, 'joined the tribe');
}
export async function leaveTribe(tribeId: string, userId: string) {
  const { error } = await supabase.from('tribe_members').delete().eq('tribe_id', tribeId).eq('user_id', userId);
  if (error) throw error;
}
export async function getMembers(tribeId: string) {
  const { data, error } = await supabase.from('tribe_members').select('role, status, user_id, user_profiles:user_profiles(user_id, full_name, avatar_url, username)').eq('tribe_id', tribeId).eq('status', 'active').limit(200);
  if (error) throw error;
  return data || [];
}
export async function setMemberRole(tribeId: string, targetId: string, role: string, actorId: string) {
  const { data: actor } = await supabase.from('tribe_members').select('role').eq('tribe_id', tribeId).eq('user_id', actorId).maybeSingle();
  if (!actor || !['creator', 'admin'].includes(actor.role)) throw new Error('Not authorized');
  const { error } = await supabase.from('tribe_members').update({ role }).eq('tribe_id', tribeId).eq('user_id', targetId);
  if (error) throw error;
}
export async function getPosts(tribeId: string) {
  const { data, error } = await supabase.from('tribe_posts').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false }).limit(50);
  if (error) throw error;
  return data || [];
}
export async function createPost(input: any) {
  const { data, error } = await supabase.from('tribe_posts').insert(input).select().single();
  if (error) throw error;
  return data;
}
export async function shareToStreets(post: any, userId: string) {
  const { data, error } = await supabase.from('streets_posts').insert({
    creator_id: userId, content: post.content || post.title || 'Shared from Tribe',
    caption: post.caption, media_url: post.media_url, thumbnail_url: post.thumbnail_url,
    media_type: post.media_type, hashtags: ['tribe'], is_public: true,
  }).select().single();
  if (error) throw error;
  return data;
}
export async function getKnowledge(tribeId: string, kind?: string) {
  let q = supabase.from('tribe_knowledge_entries').select('*').eq('tribe_id', tribeId).eq('status', 'approved').order('created_at', { ascending: false });
  if (kind) q = q.eq('kind', kind);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}
export async function addKnowledge(entry: any) {
  const { data, error } = await supabase.from('tribe_knowledge_entries').insert(entry).select().single();
  if (error) throw error;
  return data;
}
export async function verifyKnowledge(id: string, verification: string) {
  const { error } = await supabase.from('tribe_knowledge_entries').update({ verification }).eq('id', id);
  if (error) throw error;
}
export async function getArtifacts(tribeId: string) {
  const { data, error } = await supabase.from('tribe_artifacts').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addArtifact(a: any) {
  const { data, error } = await supabase.from('tribe_artifacts').insert(a).select().single();
  if (error) throw error;
  return data;
}
export async function getInterviews(tribeId: string) {
  const { data, error } = await supabase.from('tribe_interviews').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function addInterview(i: any) {
  const { data, error } = await supabase.from('tribe_interviews').insert(i).select().single();
  if (error) throw error;
  return data;
}
export async function getEvents(tribeId: string) {
  const { data, error } = await supabase.from('tribe_events').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function getElections(tribeId: string) {
  const { data, error } = await supabase.from('tribe_elections').select('*').eq('tribe_id', tribeId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}
export async function memberCount(tribeId: string) {
  const { data, error } = await supabase.rpc('tribe_member_count', { t: tribeId });
  if (error) throw error;
  return data as number;
}
export async function myRole(tribeId: string, userId: string) {
  const { data, error } = await supabase.rpc('tribe_role_of', { t: tribeId, u: userId });
  if (error) throw error;
  return data as string;
}
export async function canGovern(tribeId: string, userId: string) {
  const { data, error } = await supabase.rpc('tribe_can_govern', { t: tribeId, u: userId });
  if (error) throw error;
  return !!data;
}
export async function createElection(tribeId: string, title: string, type: string, closesAt?: string) {
  const { data, error } = await supabase.rpc('tribe_create_election', { t: tribeId, title, etype: type, closes_at: closesAt || null });
  if (error) throw new Error(error.message);
  return data;
}
export async function castVote(electionId: string, candidateId?: string, option?: string) {
  const { error } = await supabase.rpc('tribe_cast_vote', { eid: electionId, candidate: candidateId || null, opt: option || null });
  if (error) throw new Error(error.message);
}
export async function getVotes(electionId: string) {
  const { data, error } = await supabase.from('tribe_votes').select('*').eq('election_id', electionId);
  if (error) throw error;
  return data || [];
}
async function notify(tribeId: string, userId: string, action: string) {
  try {
    await supabase.from('notifications').insert({ user_id: userId, type: 'tribe', title: 'Tribe activity', body: `A member ${action}.`, metadata: { tribe_id: tribeId } });
  } catch (e) { /* notifications table optional */ }
}

// ── Discovery + categories (consumed by app/(os)/tribes.tsx) ──
export async function discoverTribes(filter?: { category?: string; search?: string; paid_only?: boolean }) {
  try {
    let q = supabase.from('tribes').select('*').order('created_at', { ascending: false }).limit(100);
    if (filter?.category && filter.category !== 'all') q = q.eq('category', filter.category);
    if (filter?.search) q = q.ilike('name', `%${filter.search}%`);
    const { data, error } = await q;
    if (error) return [];
    let rows = data || [];
    if (filter?.paid_only) rows = rows.filter((t: any) => t.membership_type === 'paid' || t.paid === true);
    return rows;
  } catch { return []; }
}
export async function getCategories() {
  try {
    const { data } = await supabase.from('tribes').select('category');
    const set = Array.from(new Set((data || []).map((d: any) => d?.category).filter(Boolean))) as string[];
    return set.length ? set : ['cultural', 'interest', 'professional', 'knowledge', 'civic', 'brand', 'sports', 'technology'];
  } catch { return ['cultural', 'interest', 'professional', 'knowledge', 'civic', 'brand']; }
}
export const listCategories = getCategories;
export const fetchTribes = getTribes;
export const getTribeById = getTribe;
export const fetchTribe = getTribe;

const tribesService = {
  getTribes, getTribe, getMyTribes, createTribe, joinTribe, leaveTribe, getMembers, setMemberRole,
  getPosts, createPost, shareToStreets, getKnowledge, addKnowledge, verifyKnowledge, getArtifacts,
  addArtifact, getInterviews, addInterview, getEvents, getElections, memberCount, myRole, canGovern,
  createElection, castVote, getVotes, discoverTribes, getCategories, listCategories, fetchTribes,
  getTribeById, fetchTribe,
};
export default tribesService;
