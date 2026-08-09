import { supabase } from '@/lib/supabase';

export async function getExams(filters?: { class_id?: string; subject_id?: string }) {
  try {
    let q = supabase.from('education_exams').select('*').order('exam_date', { ascending: false });
    if (filters?.class_id) q = q.eq('class_id', filters.class_id);
    if (filters?.subject_id) q = q.eq('subject_id', filters.subject_id);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[EducationExams] getExams error:', e);
    return [];
  }
}

export async function createExam(payload: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('education_exams').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[EducationExams] createExam error:', e);
    throw e;
  }
}
