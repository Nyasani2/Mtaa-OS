import { supabase } from '@/lib/supabase';

export async function getMarketplaceProfile(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, is_verified, trust_score')
    .eq('id', profileId)
    .single();
  if (error) throw error;
  return data;
}
