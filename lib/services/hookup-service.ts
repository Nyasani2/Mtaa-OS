import { supabase } from '@/lib/supabase';

export interface HookupProfile {
  id: string;
  user_id: string;
  display_name: string;
  bio?: string;
  age: number;
  gender: string;
  looking_for: string;
  interests: string[];
  photos: string[];
  location?: string;
  lat?: number;
  lng?: number;
  max_distance_km: number;
  is_verified: boolean;
  is_active: boolean;
  last_active: string;
  created_at: string;
}

export interface Match {
  id: string;
  user_id_1: string;
  user_id_2: string;
  matched_at: string;
  status: 'active' | 'blocked' | 'unmatched';
}

export async function createProfile(params: Omit<HookupProfile, 'id' | 'is_verified' | 'is_active' | 'last_active' | 'created_at'>) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'create_profile', ...params }
  });
  if (error) throw error;
  return data;
}

export async function getMyProfile(user_id: string) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'get_my_profile', user_id }
  });
  if (error) throw error;
  return data;
}

export async function updateProfile(user_id: string, updates: Partial<HookupProfile>) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'update_profile', user_id, updates }
  });
  if (error) throw error;
  return data;
}

export async function discoverProfiles(user_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'discover_profiles', user_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function likeProfile(user_id: string, liked_user_id: string) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'like_profile', user_id, liked_user_id }
  });
  if (error) throw error;
  return data;
}

export async function getMatches(user_id: string, limit = 20) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'get_matches', user_id, limit }
  });
  if (error) throw error;
  return data;
}

export async function blockMatch(match_id: string, user_id: string) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'block_match', match_id, user_id }
  });
  if (error) throw error;
  return data;
}

export async function reportProfile(reported_user_id: string, reporter_id: string, reason: string) {
  const { data, error } = await supabase.functions.invoke('hookup-operations', {
    body: { action: 'report_profile', reported_user_id, reporter_id, reason }
  });
  if (error) throw error;
  return data;
}
