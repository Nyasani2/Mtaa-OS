import { supabase } from '@/lib/supabase';

export async function command(query: string) {
  const { data, error } = await supabase.from('commands').select('*');
  if (error) throw error;
  return data || [];
}
