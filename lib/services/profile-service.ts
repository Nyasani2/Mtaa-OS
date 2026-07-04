// lib/services/profile-service.ts
// MTAA OS V10 — Profile Service (Production Ready)

import { supabase } from '@/lib/supabase';

export interface ProfileData {
  id: string;
  user_id: string;
  full_name?: string;
  display_name?: string;
  username?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  avatar_url?: string;
  is_verified?: boolean;
  trust_score?: number;
  followers_count?: number;
  following_count?: number;
  creator_earnings?: number;
  creator_balance?: number;
  creator_pending?: number;
}

export async function getProfile(userId: string): Promise<{ data?: ProfileData; error?: string }> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateProfile(userId: string, updates: Partial<ProfileData>): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('user_id', userId);
  if (error) return { error: error.message };
  return {};
}

export async function followUser(followerId: string, followingId: string): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('streets_follows')
    .insert({ follower_id: followerId, following_id: followingId });
  if (error) return { error: error.message };
  return {};
}
