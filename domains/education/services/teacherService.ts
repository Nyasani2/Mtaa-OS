import { supabase } from '@/lib/supabase/client';

// teacherService.ts - Education Teacher Service
// FIXED: import path corrected from @/lib/supabase to @/lib/supabase/client

export interface Teacher {
  id: string;
  user_id: string;
  institution_id?: string;
  full_name: string;
  phone?: string;
  email?: string;
  id_number?: string;
  tsc_number?: string;
  qualification?: string;
  specialization?: string;
  subjects_taught?: string[];
  grade_levels?: string[];
  employment_type?: 'permanent' | 'contract' | 'intern' | 'ptt';
  date_of_appointment?: string;
  salary_grade?: string;
  status: 'active' | 'on_leave' | 'suspended' | 'terminated';
  photo_url?: string;
  bio?: string;
  performance_rating?: number;
  created_at: string;
  updated_at: string;
}

export async function getTeachers(filters?: {
  institution_id?: string;
  specialization?: string;
  status?: string;
  search?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('education_teachers').select('*', { count: 'exact' });

  if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
  if (filters?.specialization) query = query.eq('specialization', filters.specialization);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.search) {
    query = query.or(`full_name.ilike.%${filters.search}%,tsc_number.ilike.%${filters.search}%`);
  }

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1).order('full_name');

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Teacher[], count };
}

export async function getTeacherById(id: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function getTeacherByUserId(userId: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('user_id', userId)
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function createTeacher(teacher: Omit<Teacher, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('education_teachers')
    .insert(teacher)
    .select()
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function updateTeacher(id: string, updates: Partial<Teacher>) {
  const { data, error } = await supabase
    .from('education_teachers')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Teacher;
}

export async function deleteTeacher(id: string) {
  const { error } = await supabase.from('education_teachers').delete().eq('id', id);
  if (error) throw error;
}

export async function getTeachersByInstitution(institutionId: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('institution_id', institutionId)
    .order('full_name');
  if (error) throw error;
  return data as Teacher[];
}

export async function getTeachersBySubject(subject: string) {
  const { data, error } = await supabase
    .from('education_teachers')
    .select('*')
    .contains('subjects_taught', [subject])
    .order('full_name');
  if (error) throw error;
  return data as Teacher[];
}
