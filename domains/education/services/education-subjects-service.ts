import { supabase } from '@/lib/supabase';

export async function getSubjects(filters?: { institution_id?: string }) {
  try {
    let q = supabase.from('education_subjects').select('*').order('name');
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[EducationSubjects] getSubjects error:', e);
    return [];
  }
}

export async function createSubject(payload: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('education_subjects').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[EducationSubjects] createSubject error:', e);
    throw e;
  }
}
