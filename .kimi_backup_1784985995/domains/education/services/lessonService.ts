import { supabase } from '@/lib/supabase';

// lessonService.ts - Education Lesson Service
// FIXED: import path corrected from @/lib/supabase to @/lib/supabase/client

export interface Lesson {
  id: string;
  institution_id: string;
  teacher_id: string;
  subject: string;
  grade_level: string;
  title: string;
  description?: string;
  content?: string;
  materials?: string[];
  scheduled_date?: string;
  start_time?: string;
  end_time?: string;
  room?: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  attendance_required: boolean;
  created_at: string;
  updated_at: string;
}

export async function getLessons(filters?: {
  institution_id?: string;
  teacher_id?: string;
  grade_level?: string;
  subject?: string;
  status?: string;
  scheduled_date?: string;
  limit?: number;
  offset?: number;
}) {
  let query = supabase.from('education_lessons').select('*', { count: 'exact' });

  if (filters?.institution_id) query = query.eq('institution_id', filters.institution_id);
  if (filters?.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
  if (filters?.grade_level) query = query.eq('grade_level', filters.grade_level);
  if (filters?.subject) query = query.eq('subject', filters.subject);
  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.scheduled_date) query = query.eq('scheduled_date', filters.scheduled_date);

  const limit = filters?.limit ?? 20;
  const offset = filters?.offset ?? 0;
  query = query.range(offset, offset + limit - 1).order('scheduled_date', { ascending: false });

  const { data, error, count } = await query;
  if (error) throw error;
  return { data: data as Lesson[], count };
}

export async function getLessonById(id: string) {
  const { data, error } = await supabase
    .from('education_lessons')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data as Lesson;
}

export async function createLesson(lesson: Omit<Lesson, 'id' | 'created_at' | 'updated_at'>) {
  const { data, error } = await supabase
    .from('education_lessons')
    .insert(lesson)
    .select()
    .single();
  if (error) throw error;
  return data as Lesson;
}

export async function updateLesson(id: string, updates: Partial<Lesson>) {
  const { data, error } = await supabase
    .from('education_lessons')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data as Lesson;
}

export async function deleteLesson(id: string) {
  const { error } = await supabase.from('education_lessons').delete().eq('id', id);
  if (error) throw error;
}

export async function getLessonsByTeacher(teacherId: string) {
  const { data, error } = await supabase
    .from('education_lessons')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data as Lesson[];
}

export async function getLessonsByInstitution(institutionId: string) {
  const { data, error } = await supabase
    .from('education_lessons')
    .select('*')
    .eq('institution_id', institutionId)
    .order('scheduled_date', { ascending: false });
  if (error) throw error;
  return data as Lesson[];
}
