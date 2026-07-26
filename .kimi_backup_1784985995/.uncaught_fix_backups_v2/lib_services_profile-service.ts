/**
 * MTAA OS V10 — Profile Service
 * Tables: creator_earnings, user_friendships, user_blocks, user_2fa, user_themes, user_streaming_sessions
 */
import { supabase } from '@/lib/supabase/client';

export interface CreatorEarning {
  id: string;
  user_id: string;
  source: string;
  amount: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  description: string | null;
  created_at: string;
}

export interface UserFriendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: 'pending' | 'accepted' | 'blocked';
  created_at: string;
  updated_at: string;
}

// ── EARNINGS ──────────────────────────────────────────────

export async function fetchCreatorEarnings(userId: string, options: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = options;
  const { data, error } = await supabase
    .from('creator_earnings')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) throw error;
  return (data ?? []) as CreatorEarning[];
}

export async function fetchCreatorEarningsSummary(userId: string) {
  const { data, error } = await supabase
    .from('creator_earnings')
    .select('amount, status')
    .eq('user_id', userId);
  if (error) throw error;

  const all = data ?? [];
  return {
    totalEarned: all.filter((e: any) => e.status === 'paid').reduce((s: number, e: any) => s + e.amount, 0),
    totalPending: all.filter((e: any) => e.status === 'pending').reduce((s: number, e: any) => s + e.amount, 0),
    totalFailed: all.filter((e: any) => e.status === 'failed').reduce((s: number, e: any) => s + e.amount, 0),
    count: all.length,
  };
}

// ── FRIENDS ───────────────────────────────────────────────

export async function fetchFriends(userId: string) {
  const { data, error } = await supabase
    .from('user_friendships')
    .select('*')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .eq('status', 'accepted');
  if (error) throw error;
  return (data ?? []) as UserFriendship[];
}

export async function fetchFriendRequests(userId: string) {
  const { data, error } = await supabase
    .from('user_friendships')
    .select('*')
    .eq('addressee_id', userId)
    .eq('status', 'pending');
  if (error) throw error;
  return (data ?? []) as UserFriendship[];
}

export async function sendFriendRequest(requesterId: string, addresseeId: string) {
  const { data, error } = await supabase
    .from('user_friendships')
    .insert({ requester_id: requesterId, addressee_id: addresseeId, status: 'pending' })
    .select()
    .single();
  if (error) throw error;
  return data as UserFriendship;
}

export async function respondToFriendRequest(requestId: string, accept: boolean) {
  const { data, error } = await supabase
    .from('user_friendships')
    .update({ status: accept ? 'accepted' : 'blocked', updated_at: new Date().toISOString() })
    .eq('id', requestId)
    .select()
    .single();
  if (error) throw error;
  return data as UserFriendship;
}

export async function unfriend(userId: string, friendId: string) {
  const { error } = await supabase
    .from('user_friendships')
    .delete()
    .or(`and(requester_id.eq.${userId},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${userId})`);
  if (error) throw error;
}

// ── 2FA ───────────────────────────────────────────────────

export async function fetch2FAStatus(userId: string) {
  const { data, error } = await supabase.from('user_2fa').select('*').eq('user_id', userId).single();
  if (error) return null;
  return data;
}

export async function enable2FA(userId: string, method: string, secret: string) {
  const { data, error } = await supabase
    .from('user_2fa')
    .upsert({ user_id: userId, method, secret, enabled: true, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function disable2FA(userId: string) {
  const { error } = await supabase.from('user_2fa').delete().eq('user_id', userId);
  if (error) throw error;
}

// ── THEME ─────────────────────────────────────────────────

export async function fetchUserTheme(userId: string) {
  const { data, error } = await supabase.from('user_themes').select('*').eq('user_id', userId).single();
  if (error) return null;
  return data;
}

export async function updateUserTheme(userId: string, theme: any) {
  const { data, error } = await supabase
    .from('user_themes')
    .upsert({ user_id: userId, ...theme, updated_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// ── STREAMING ───────────────────────────────────────────────

export async function startStreamingSession(userId: string, title: string) {
  const { data, error } = await supabase
    .from('user_streaming_sessions')
    .insert({ user_id: userId, title, status: 'live', started_at: new Date().toISOString() })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function endStreamingSession(sessionId: string) {
  const { data, error } = await supabase
    .from('user_streaming_sessions')
    .update({ status: 'ended', ended_at: new Date().toISOString() })
    .eq('id', sessionId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
