import { supabase } from '@/lib/supabase';

export async function getJobsProfile(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, username, avatar_url, profession, skills, experience_years, is_verified')
    .eq('id', profileId)
    .single();
  if (error) throw error;
  return data;
}
