import { supabase } from '@/lib/supabase';

export async function getStreetsProfile(profileId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, avatar_url, is_verified, follower_count, following_count, mtaa_id')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
