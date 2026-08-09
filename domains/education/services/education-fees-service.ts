import { supabase } from '@/lib/supabase';

export async function getFees(filters?: { institution_id?: string; student_id?: string }) {
  try {
    let q = supabase.from('education_fees').select('*').order('created_at', { ascending: false });
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    if (filters?.student_id) q = q.eq('student_id', filters.student_id);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[EducationFees] getFees error:', e);
    return [];
  }
}

export async function getFeePayments(filters?: { institution_id?: string; student_id?: string }) {
  try {
    let q = supabase.from('education_fee_payments').select('*').order('created_at', { ascending: false });
    if (filters?.institution_id) q = q.eq('institution_id', filters.institution_id);
    if (filters?.student_id) q = q.eq('student_id', filters.student_id);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('[EducationFees] getFeePayments error:', e);
    return [];
  }
}

export async function createFee(payload: Record<string, any>) {
  try {
    const { data, error } = await supabase.from('education_fee_payments').insert(payload).select().single();
    if (error) throw error;
    return data;
  } catch (e) {
    console.error('[EducationFees] createFee error:', e);
    throw e;
  }
}
