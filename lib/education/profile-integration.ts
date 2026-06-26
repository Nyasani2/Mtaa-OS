import { supabase } from '@/lib/supabase';

export async function getEducationProfile(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, profession, skills, is_verified')
    .eq('id', profileId)
    .single();
  if (error) throw error;
  return data;
}
