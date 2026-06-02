// lib/streets/services/settingsService.ts
// MTAA Streets — Settings Service (wired to user_settings table)

import { supabase } from '@/lib/supabase';

export interface StreetSettings {
  privacy_profile: 'public' | 'friends' | 'private';
  privacy_posts: 'public' | 'friends' | 'private';
  privacy_location: boolean;
  allow_messages_from: 'everyone' | 'friends' | 'nobody';
  allow_tagging: boolean;
  allow_mentions: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
  dark_mode: 'system' | 'dark' | 'light';
  language: string;
  autoplay_videos: boolean;
  show_activity_status: boolean;
  data_saver: boolean;
}

const DEFAULT_SETTINGS: StreetSettings = {
  privacy_profile: 'public',
  privacy_posts: 'public',
  privacy_location: true,
  allow_messages_from: 'everyone',
  allow_tagging: true,
  allow_mentions: true,
  push_notifications: true,
  email_notifications: true,
  sms_notifications: false,
  dark_mode: 'system',
  language: 'en',
  autoplay_videos: true,
  show_activity_status: true,
  data_saver: false,
};

export async function fetchSettings(userId: string): Promise<StreetSettings> {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !data) {
    return DEFAULT_SETTINGS;
  }

  return { ...DEFAULT_SETTINGS, ...data.settings };
}

export async function updateSettings(userId: string, settings: Partial<StreetSettings>): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, settings, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function resetSettings(userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_settings')
    .upsert(
      { user_id: userId, settings: DEFAULT_SETTINGS, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    );
  if (error) throw error;
}

export async function blockUser(userId: string, blockedUserId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_blocks')
    .insert({ user_id: userId, blocked_user_id: blockedUserId });
  if (error) throw error;
}

export async function unblockUser(userId: string, blockedUserId: string): Promise<void> {
  const { error } = await supabase
    .from('streets_blocks')
    .delete()
    .eq('user_id', userId)
    .eq('blocked_user_id', blockedUserId);
  if (error) throw error;
}

export async function fetchBlockedUsers(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('streets_blocks')
    .select('blocked_user_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data || []).map((row) => row.blocked_user_id);
}
