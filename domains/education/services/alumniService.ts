import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

export interface Alumni {
  id: string;
  user_id: string;
  institution_id: string;
  graduation_year: number;
  final_level: string;
  current_occupation?: string;
  current_employer?: string;
  current_city?: string;
  is_donor: boolean;
  total_donated: number;
  is_mentor: boolean;
  mentorship_areas: string[];
  is_active: boolean;
  created_at: string;
  user?: { full_name: string; avatar_url: string } | null;
}

const handleError = (error: PostgrestError | null): string => {
  if (!error) return '';
  if (error.code === '23505') return 'Alumni record already exists.';
  return error.message;
};

export const getAlumni = async (institutionId: string, filters?: { graduation_year?: number; is_mentor?: boolean }): Promise<{ data: Alumni[] | null; error: string }> => {
  let query = supabase
    .from('education_alumni')
    .select('*, user:user_id(full_name, avatar_url)')
    .eq('institution_id', institutionId)
    .eq('is_active', true)
    .order('graduation_year', { ascending: false });

  if (filters?.graduation_year) query = query.eq('graduation_year', filters.graduation_year);
  if (filters?.is_mentor) query = query.eq('is_mentor', true);

  const { data, error } = await query;
  return { data: data as Alumni[] | null, error: handleError(error) };
};

export const registerAlumni = async (payload: Partial<Alumni>): Promise<{ data: Alumni | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_alumni')
    .upsert(payload, { onConflict: 'user_id,institution_id' })
    .select()
    .single();
  return { data: data as Alumni | null, error: handleError(error) };
};

export const getAlumniStats = async (institutionId: string) => {
  const { data, error } = await supabase
    .from('education_alumni')
    .select('is_donor, is_mentor, total_donated')
    .eq('institution_id', institutionId)
    .eq('is_active', true);
  
  if (error) return { data: null, error: handleError(error) };
  
  const alumni = data || [];
  return {
    data: {
      total: alumni.length,
      donors: alumni.filter(a => a.is_donor).length,
      mentors: alumni.filter(a => a.is_mentor).length,
      total_donated: alumni.reduce((sum, a) => sum + (a.total_donated || 0), 0),
    },
    error: '',
  };
};
