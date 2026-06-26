import { supabase } from '@/lib/supabase';

export async function getHealthProfile(profileId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, phone, date_of_birth, gender')
    .eq('id', profileId)
    .single();
  if (error) throw error;
  return data;
}
