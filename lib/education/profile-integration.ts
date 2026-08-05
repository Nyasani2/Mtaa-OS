import { supabase } from '@/lib/supabase';

export async function getEducationProfile(userId: string) {
  // FIXED: profiles -> user_profiles, .eq('id') -> .eq('user_id')
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data;
}
