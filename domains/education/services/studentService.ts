
import { supabase } from '@/lib/supabase';
import { Student } from '../types/education.types';

export async function getStudents(institutionId: string, classId?: string) {
  let query = supabase
    .from('education_students')
    .select('*')
    .eq('institution_id', institutionId)
    .eq('enrollment_status', 'active');
  if (classId) query = query.eq('current_class_id', classId);
  const { data, error } = await query;
  if (error) throw error;
  return data as Student[];
}

export async function getStudent(id: string) {
  const { data, error } = await supabase
    .from('education_students')
    .select('*, class:education_classes(*), institution:education_institutions(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function enrollStudent(student: Partial<Student>) {
  const { data, error } = await supabase
    .from('education_students')
    .insert(student)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStudentClass(studentId: string, classId: string) {
  const { data, error } = await supabase
    .from('education_students')
    .update({ current_class_id: classId })
    .eq('id', studentId)
    .select()
    .single();
  if (error) throw error;
  return data;
}
