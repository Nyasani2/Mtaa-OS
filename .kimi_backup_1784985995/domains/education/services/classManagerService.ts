import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types
export interface ClassV2 {
  id: string;
  institution_id: string;
  name: string;
  code: string | null;
  grade_level: number;
  stream: string | null;
  academic_year: string;
  term: string;
  capacity: number;
  current_enrollment: number;
  teacher_id: string | null;
  assistant_teacher_id: string | null;
  room: string | null;
  building: string | null;
  schedule: Array<{day: number; start_time: string; end_time: string; subject_id: string}>;
  status: 'active' | 'archived' | 'suspended';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  teacher?: { id: string; full_name: string; email: string } | null;
  assistant_teacher?: { id: string; full_name: string } | null;
  institution?: { id: string; name: string } | null;
}

export interface ClassEnrollment {
  id: string;
  class_id: string;
  student_id: string;
  enrollment_date: string;
  status: 'enrolled' | 'transferred' | 'withdrawn' | 'graduated' | 'suspended';
  academic_year: string;
  term: string;
  previous_class_id: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  student?: { id: string; full_name: string; student_number: string; user_id: string } | null;
  previous_class?: { id: string; name: string } | null;
}

export interface ClassSchedule {
  id: string;
  class_id: string;
  subject_id: string | null;
  teacher_id: string | null;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room: string | null;
  lesson_type: 'regular' | 'lab' | 'sports' | 'exam' | 'revision' | 'extra';
  recurring: boolean;
  created_at: string;
  // Joined
  subject?: { id: string; name: string; code: string } | null;
  teacher?: { id: string; full_name: string } | null;
}

export interface CreateClassInput {
  institution_id: string;
  name: string;
  code?: string;
  grade_level: number;
  stream?: string;
  academic_year: string;
  term?: string;
  capacity?: number;
  teacher_id?: string;
  assistant_teacher_id?: string;
  room?: string;
  building?: string;
}

export interface EnrollStudentInput {
  class_id: string;
  student_id: string;
  academic_year: string;
  term: string;
  previous_class_id?: string;
  notes?: string;
}

export interface CreateScheduleInput {
  class_id: string;
  subject_id?: string;
  teacher_id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  room?: string;
  lesson_type?: string;
}

// Error helper
const handleError = (error: PostgrestError | null): string => {
  if (!error) return '';
  if (error.code === '23505') return 'A class with this code already exists.';
  if (error.code === '23503') return 'Referenced record does not exist.';
  if (error.code === '42501') return 'Permission denied. Check your access level.';
  return error.message;
};

// ============================================
// CLASS CRUD
// ============================================

export const getClasses = async (institutionId: string, filters?: { status?: string; grade_level?: number; academic_year?: string }): Promise<{ data: ClassV2[] | null; error: string }> => {
  let query = supabase
    .from('education_classes_v2')
    .select('*, teacher:education_teachers(id, full_name, email), assistant_teacher:education_teachers!assistant_teacher_id(id, full_name), institution:education_institutions(id, name)')
    .eq('institution_id', institutionId)
    .order('grade_level', { ascending: true })
    .order('name', { ascending: true });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.grade_level) query = query.eq('grade_level', filters.grade_level);
  if (filters?.academic_year) query = query.eq('academic_year', filters.academic_year);

  const { data, error } = await query;
  return { data: data as ClassV2[] | null, error: handleError(error) };
};

export const getClassById = async (classId: string): Promise<{ data: ClassV2 | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_classes_v2')
    .select('*, teacher:education_teachers!teacher_id(id, full_name, email), assistant_teacher:education_teachers!assistant_teacher_id(id, full_name), institution:education_institutions(id, name)')
    .eq('id', classId)
    .single();
  return { data: data as ClassV2 | null, error: handleError(error) };
};

export const createClass = async (input: CreateClassInput): Promise<{ data: ClassV2 | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_classes_v2')
    .insert({
      institution_id: input.institution_id,
      name: input.name,
      code: input.code || null,
      grade_level: input.grade_level,
      stream: input.stream || null,
      academic_year: input.academic_year,
      term: input.term || 'Term 1',
      capacity: input.capacity || 40,
      teacher_id: input.teacher_id || null,
      assistant_teacher_id: input.assistant_teacher_id || null,
      room: input.room || null,
      building: input.building || null,
    })
    .select()
    .single();
  return { data: data as ClassV2 | null, error: handleError(error) };
};

export const updateClass = async (classId: string, updates: Partial<CreateClassInput>): Promise<{ data: ClassV2 | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_classes_v2')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', classId)
    .select()
    .single();
  return { data: data as ClassV2 | null, error: handleError(error) };
};

export const archiveClass = async (classId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_classes_v2')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', classId);
  return { success: !error, error: handleError(error) };
};

// ============================================
// ENROLLMENTS
// ============================================

export const getClassEnrollments = async (classId: string, filters?: { status?: string; academic_year?: string; term?: string }): Promise<{ data: ClassEnrollment[] | null; error: string }> => {
  let query = supabase
    .from('education_class_enrollments')
    .select('*, student:education_students(id, full_name, student_number, user_id), previous_class:education_classes_v2!previous_class_id(id, name)')
    .eq('class_id', classId)
    .order('enrollment_date', { ascending: false });

  if (filters?.status) query = query.eq('status', filters.status);
  if (filters?.academic_year) query = query.eq('academic_year', filters.academic_year);
  if (filters?.term) query = query.eq('term', filters.term);

  const { data, error } = await query;
  return { data: data as ClassEnrollment[] | null, error: handleError(error) };
};

export const enrollStudent = async (input: EnrollStudentInput): Promise<{ data: ClassEnrollment | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_class_enrollments')
    .insert({
      class_id: input.class_id,
      student_id: input.student_id,
      academic_year: input.academic_year,
      term: input.term,
      previous_class_id: input.previous_class_id || null,
      notes: input.notes || null,
    })
    .select()
    .single();
  return { data: data as ClassEnrollment | null, error: handleError(error) };
};

export const updateEnrollmentStatus = async (enrollmentId: string, status: ClassEnrollment['status']): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_class_enrollments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', enrollmentId);
  return { success: !error, error: handleError(error) };
};

export const transferStudent = async (enrollmentId: string, newClassId: string, notes?: string): Promise<{ data: ClassEnrollment | null; error: string }> => {
  // Get current enrollment
  const { data: current } = await supabase
    .from('education_class_enrollments')
    .select('*')
    .eq('id', enrollmentId)
    .single();

  if (!current) return { data: null, error: 'Enrollment not found' };

  // Mark old as transferred
  await supabase.from('education_class_enrollments').update({ status: 'transferred' }).eq('id', enrollmentId);

  // Create new enrollment
  const { data, error } = await supabase
    .from('education_class_enrollments')
    .insert({
      class_id: newClassId,
      student_id: current.student_id,
      academic_year: current.academic_year,
      term: current.term,
      previous_class_id: current.class_id,
      notes: notes || `Transferred from class ${current.class_id}`,
    })
    .select()
    .single();

  return { data: data as ClassEnrollment | null, error: handleError(error) };
};

export const getStudentClasses = async (studentId: string): Promise<{ data: ClassV2[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_class_enrollments')
    .select('class:education_classes_v2(*)')
    .eq('student_id', studentId)
    .eq('status', 'enrolled')
    .order('enrollment_date', { ascending: false });

  const classes = data?.map((row: any) => row.class as ClassV2) || null;
  return { data: classes, error: handleError(error) };
};

// ============================================
// SCHEDULES
// ============================================

export const getClassSchedule = async (classId: string): Promise<{ data: ClassSchedule[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_class_schedules')
    .select('*, subject:education_subjects(id, name, code), teacher:education_teachers(id, full_name)')
    .eq('class_id', classId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  return { data: data as ClassSchedule[] | null, error: handleError(error) };
};

export const createScheduleSlot = async (input: CreateScheduleInput): Promise<{ data: ClassSchedule | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_class_schedules')
    .insert({
      class_id: input.class_id,
      subject_id: input.subject_id || null,
      teacher_id: input.teacher_id || null,
      day_of_week: input.day_of_week,
      start_time: input.start_time,
      end_time: input.end_time,
      room: input.room || null,
      lesson_type: input.lesson_type || 'regular',
    })
    .select()
    .single();
  return { data: data as ClassSchedule | null, error: handleError(error) };
};

export const deleteScheduleSlot = async (slotId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_class_schedules').delete().eq('id', slotId);
  return { success: !error, error: handleError(error) };
};

export const getTeacherSchedule = async (teacherId: string, weekStart?: string): Promise<{ data: ClassSchedule[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_class_schedules')
    .select('*, class:education_classes_v2(id, name, grade_level), subject:education_subjects(id, name, code)')
    .eq('teacher_id', teacherId)
    .order('day_of_week', { ascending: true })
    .order('start_time', { ascending: true });
  return { data: data as ClassSchedule[] | null, error: handleError(error) };
};

// ============================================
// STATS
// ============================================

export const getClassStats = async (classId: string): Promise<{ data: { total: number; enrolled: number; withdrawn: number; suspended: number; capacity: number; fill_rate: number } | null; error: string }> => {
  const { data: enrollments, error } = await supabase
    .from('education_class_enrollments')
    .select('status')
    .eq('class_id', classId);

  if (error) return { data: null, error: handleError(error) };

  const { data: cls } = await supabase.from('education_classes_v2').select('capacity, current_enrollment').eq('id', classId).single();

  const stats = {
    total: enrollments?.length || 0,
    enrolled: enrollments?.filter(e => e.status === 'enrolled').length || 0,
    withdrawn: enrollments?.filter(e => e.status === 'withdrawn').length || 0,
    suspended: enrollments?.filter(e => e.status === 'suspended').length || 0,
    capacity: cls?.capacity || 0,
    fill_rate: cls?.capacity ? Math.round(((cls.current_enrollment || 0) / cls.capacity) * 100) : 0,
  };

  return { data: stats, error: '' };
};

export const getInstitutionClassSummary = async (institutionId: string): Promise<{ data: { total_classes: number; total_students: number; avg_fill_rate: number; active_teachers: number } | null; error: string }> => {
  const { data: classes, error } = await supabase
    .from('education_classes_v2')
    .select('capacity, current_enrollment')
    .eq('institution_id', institutionId)
    .eq('status', 'active');

  if (error) return { data: null, error: handleError(error) };

  const totalClasses = classes?.length || 0;
  const totalStudents = classes?.reduce((sum, c) => sum + (c.current_enrollment || 0), 0) || 0;
  const avgFill = totalClasses > 0
    ? Math.round(classes.reduce((sum, c) => sum + ((c.current_enrollment || 0) / (c.capacity || 1)) * 100, 0) / totalClasses)
    : 0;

  const { data: teachers } = await supabase.from('education_teachers').select('id').eq('institution_id', institutionId).eq('status', 'active');

  return {
    data: {
      total_classes: totalClasses,
      total_students: totalStudents,
      avg_fill_rate: avgFill,
      active_teachers: teachers?.length || 0,
    },
    error: '',
  };
};
