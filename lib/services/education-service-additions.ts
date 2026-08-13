// @ts-nocheck
import { supabase } from '@/lib/supabase/client';

export async function getTeacherByUserId(userId: string) {
  const { data: teacher, error } = await supabase
    .from('education_teachers')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return teacher;
}

export async function getInstitutionByTeacher(teacherId: string) {
  const { data: inst } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('head_teacher_id', teacherId)
    .maybeSingle();
  return inst;
}

export async function getStudentByUserId(userId: string) {
  const { data: student, error } = await supabase
    .from('education_students')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return student;
}

export async function getInstitutionByStudent(studentId: string) {
  const { data: inst } = await supabase
    .from('education_institutions')
    .select('*')
    .eq('id', studentId)
    .maybeSingle();
  return inst;
}

export async function getClassById(classId: string) {
  const { data: cls } = await supabase
    .from('education_classes')
    .select('*')
    .eq('id', classId)
    .maybeSingle();
  return cls;
}
