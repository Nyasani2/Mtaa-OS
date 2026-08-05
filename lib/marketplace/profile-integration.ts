import { supabase } from '@/lib/supabase';

export async function getMarketplaceProfile(profileId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, display_name, username, avatar_url, is_verified, trust_score')
    .eq('id', profileId)
    .maybeSingle();
  if (error) throw error;
  return data;
}
