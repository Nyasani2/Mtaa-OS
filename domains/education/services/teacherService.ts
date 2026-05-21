
import { supabase } from '@/lib/supabase';
import { Teacher } from '../types/education.types';

export async function getTeachers(institutionId: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('is_active', true);
  if (error) throw error;
  return data as Teacher[];
}

export async function getTeacher(id: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*, institution:education_institutions(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function registerTeacher(teacher: Partial<Teacher>) {
  const { data, error } = await supabase
    .from('education_teachers')
    .insert(teacher)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTeacherKyc(id: string, kycData: { documents: string[] }) {
  const { data, error } = await supabase
    .from('education_teachers')
    .update({ kyc_status: 'pending', kyc_documents: kycData.documents })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function verifyTeacherKyc(id: string, verifiedBy: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .update({ kyc_status: 'verified', kyc_verified_at: new Date().toISOString(), kyc_verified_by: verifiedBy })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}
