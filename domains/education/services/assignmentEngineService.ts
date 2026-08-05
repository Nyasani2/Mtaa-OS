import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types
export interface Assignment {
  id: string;
  institution_id: string;
  class_id: string | null;
  subject_id: string | null;
  teacher_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  assignment_type: 'homework' | 'quiz' | 'project' | 'essay' | 'lab_report' | 'presentation' | 'reading' | 'extra_credit';
  max_score: number;
  passing_score: number;
  due_date: string | null;
  allow_late_submission: boolean;
  late_penalty_percent: number;
  attachments: Array<{name: string; url: string; type: string}>;
  rubric: Record<string, unknown>;
  status: 'draft' | 'published' | 'closed' | 'archived';
  publish_at: string | null;
  auto_grade: boolean;
  answer_key: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  class?: { id: string; name: string; grade_level: number } | null;
  subject?: { id: string; name: string; code: string } | null;
  teacher?: { id: string; full_name: string } | null;
  submission_count?: number;
  graded_count?: number;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  submission_text: string | null;
  attachments: Array<{name: string; url: string; type: string}>;
  submitted_at: string;
  is_late: boolean;
  status: 'draft' | 'submitted' | 'graded' | 'returned' | 'late';
  graded_at: string | null;
  graded_by: string | null;
  score: number | null;
  feedback: string | null;
  rubric_scores: Record<string, number>;
  plagiarism_score: number | null;
  attempt_number: number;
  created_at: string;
  updated_at: string;
  // Joined
  student?: { id: string; full_name: string; student_number: string } | null;
  grader?: { id: string; full_name: string } | null;
  assignment?: { id: string; title: string; max_score: number; due_date: string } | null;
}

export interface Grade {
  id: string;
  student_id: string;
  class_id: string | null;
  subject_id: string | null;
  assignment_id: string | null;
  teacher_id: string | null;
  grade_type: string;
  score: number;
  max_score: number;
  percentage: number;
  letter_grade: string;
  feedback: string | null;
  term: string;
  academic_year: string;
  is_finalized: boolean;
  created_at: string;
  // Joined
  student?: { id: string; full_name: string } | null;
  assignment?: { id: string; title: string } | null;
  subject?: { id: string; name: string } | null;
}

export interface CreateAssignmentInput {
  institution_id: string;
  class_id?: string;
  subject_id?: string;
  teacher_id: string;
  title: string;
  description?: string;
  instructions?: string;
  assignment_type?: string;
  max_score?: number;
  passing_score?: number;
  due_date?: string;
  allow_late_submission?: boolean;
  late_penalty_percent?: number;
  attachments?: Array<{name: string; url: string; type: string}>;
  rubric?: Record<string, unknown>;
  publish_at?: string;
  auto_grade?: boolean;
  answer_key?: Record<string, unknown>;
}

export interface CreateSubmissionInput {
  assignment_id: string;
  student_id: string;
  submission_text?: string;
  attachments?: Array<{name: string; url: string; type: string}>;
}

export interface GradeSubmissionInput {
  submission_id: string;
  score: number;
  feedback?: string;
  rubric_scores?: Record<string, number>;
  graded_by: string;
}

// Error helper
const handleError = (error: PostgrestError | null): string => {
  if (!error) return '';
  if (error.code === '23505') return 'Duplicate submission detected.';
  if (error.code === '23503') return 'Referenced record not found.';
  if (error.code === '42501') return 'Permission denied.';
  return error.message;
};

// ============================================
// ASSIGNMENT CRUD
// ============================================

export const getAssignments = async (filters: { teacher_id?: string; class_id?: string; status?: string; institution_id?: string }): Promise<{ data: Assignment[] | null; error: string }> => {
  let query = supabase
    .from('education_assignments')
    .select('*, class:education_classes_v2(id, name, grade_level), subject:education_subjects(id, name, code), teacher:education_teachers(id, full_name)')
    .order('created_at', { ascending: false });

  if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
  if (filters.class_id) query = query.eq('class_id', filters.class_id);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);

  const { data, error } = await query;
  return { data: data as Assignment[] | null, error: handleError(error) };
};

export const getAssignmentById = async (id: string): Promise<{ data: Assignment | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignments')
    .select('*, class:education_classes_v2(id, name, grade_level), subject:education_subjects(id, name, code), teacher:education_teachers(id, full_name)')
    .eq('id', id)
    .single();
  return { data: data as Assignment | null, error: handleError(error) };
};

export const createAssignment = async (input: CreateAssignmentInput): Promise<{ data: Assignment | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignments')
    .insert({
      institution_id: input.institution_id,
      class_id: input.class_id || null,
      subject_id: input.subject_id || null,
      teacher_id: input.teacher_id,
      title: input.title,
      description: input.description || null,
      instructions: input.instructions || null,
      type: input.assignment_type || 'homework',
      max_score: input.max_score || 100,
      passing_score: input.passing_score || 50,
      due_date: input.due_date || null,
      allow_late_submission: input.allow_late_submission ?? false,
      late_penalty_percent: input.late_penalty_percent || 0,
      attachments: input.attachments || [],
      rubric: input.rubric || {},
      publish_at: input.publish_at || null,
      auto_grade: input.auto_grade ?? false,
      answer_key: input.answer_key || {},
      status: input.publish_at ? 'draft' : 'published',
    })
    .select()
    .single();
  return { data: data as Assignment | null, error: handleError(error) };
};

export const updateAssignment = async (id: string, updates: Partial<CreateAssignmentInput>): Promise<{ data: Assignment | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignments')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data: data as Assignment | null, error: handleError(error) };
};

export const publishAssignment = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_assignments').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const closeAssignment = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_assignments').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const deleteAssignment = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_assignments').delete().eq('id', id);
  return { success: !error, error: handleError(error) };
};

// ============================================
// SUBMISSIONS
// ============================================

export const getSubmissions = async (filters: { assignment_id?: string; student_id?: string; status?: string }): Promise<{ data: AssignmentSubmission[] | null; error: string }> => {
  let query = supabase
    .from('education_assignment_submissions')
    .select('*, student:education_students(id, full_name, student_number), grader:education_teachers!graded_by(id, full_name), assignment:education_assignments(id, title, max_score, due_date)')
    .order('submitted_at', { ascending: false });

  if (filters.assignment_id) query = query.eq('assignment_id', filters.assignment_id);
  if (filters.student_id) query = query.eq('student_id', filters.student_id);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  return { data: data as AssignmentSubmission[] | null, error: handleError(error) };
};

export const getSubmissionById = async (id: string): Promise<{ data: AssignmentSubmission | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignment_submissions')
    .select('*, student:education_students(id, full_name, student_number), grader:education_teachers!graded_by(id, full_name), assignment:education_assignments(id, title, max_score, due_date)')
    .eq('id', id)
    .single();
  return { data: data as AssignmentSubmission | null, error: handleError(error) };
};

export const submitAssignment = async (input: CreateSubmissionInput): Promise<{ data: AssignmentSubmission | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignment_submissions')
    .insert({
      assignment_id: input.assignment_id,
      student_id: input.student_id,
      submission_text: input.submission_text || null,
      attachments: input.attachments || [],
      status: 'submitted',
    })
    .select()
    .single();
  return { data: data as AssignmentSubmission | null, error: handleError(error) };
};

export const gradeSubmission = async (input: GradeSubmissionInput): Promise<{ data: AssignmentSubmission | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignment_submissions')
    .update({
      score: input.score,
      feedback: input.feedback || null,
      rubric_scores: input.rubric_scores || {},
      graded_by: input.graded_by,
      graded_at: new Date().toISOString(),
      status: 'graded',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.submission_id)
    .select()
    .single();
  return { data: data as AssignmentSubmission | null, error: handleError(error) };
};

export const returnSubmission = async (submissionId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_assignment_submissions').update({ status: 'returned', updated_at: new Date().toISOString() }).eq('id', submissionId);
  return { success: !error, error: handleError(error) };
};

export const getStudentSubmission = async (assignmentId: string, studentId: string): Promise<{ data: AssignmentSubmission | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignment_submissions')
    .select('*, assignment:education_assignments(id, title, max_score, due_date)')
    .eq('assignment_id', assignmentId)
    .eq('student_id', studentId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { data: data as AssignmentSubmission | null, error: handleError(error) };
};

// ============================================
// GRADES
// ============================================

export const getStudentGrades = async (studentId: string, filters?: { term?: string; academic_year?: string; class_id?: string }): Promise<{ data: Grade[] | null; error: string }> => {
  let query = supabase
    .from('education_grades')
    .select('*, student:education_students(id, full_name), assignment:education_assignments(id, title), subject:education_subjects(id, name)')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false });

  if (filters?.term) query = query.eq('term', filters.term);
  if (filters?.academic_year) query = query.eq('academic_year', filters.academic_year);
  if (filters?.class_id) query = query.eq('class_id', filters.class_id);

  const { data, error } = await query;
  return { data: data as Grade[] | null, error: handleError(error) };
};

export const getClassGradebook = async (classId: string): Promise<{ data: Grade[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_grades')
    .select('*, student:education_students(id, full_name), assignment:education_assignments(id, title), subject:education_subjects(id, name)')
    .eq('class_id', classId)
    .order('student_id', { ascending: true })
    .order('created_at', { ascending: false });
  return { data: data as Grade[] | null, error: handleError(error) };
};

export const getGradeStats = async (studentId: string): Promise<{ data: { average: number; highest: number; lowest: number; total: number; letter_distribution: Record<string, number> } | null; error: string }> => {
  const { data, error } = await supabase.from('education_grades').select('score, max_score, letter_grade').eq('student_id', studentId);
  if (error) return { data: null, error: handleError(error) };

  const grades = data || [];
  if (grades.length === 0) return { data: { average: 0, highest: 0, lowest: 0, total: 0, letter_distribution: {} }, error: '' };

  const percentages = grades.map(g => (g.max_score > 0 ? (g.score / g.max_score) * 100 : 0));
  const distribution: Record<string, number> = {};
  grades.forEach(g => { distribution[g.letter_grade] = (distribution[g.letter_grade] || 0) + 1; });

  return {
    data: {
      average: Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length),
      highest: Math.round(Math.max(...percentages)),
      lowest: Math.round(Math.min(...percentages)),
      total: grades.length,
      letter_distribution: distribution,
    },
    error: '',
  };
};

// ============================================
// STATS
// ============================================

export const getAssignmentStats = async (assignmentId: string): Promise<{ data: { total_submissions: number; graded: number; pending: number; late: number; average_score: number; highest_score: number; lowest_score: number } | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_assignment_submissions')
    .select('status, score, is_late')
    .eq('assignment_id', assignmentId);

  if (error) return { data: null, error: handleError(error) };

  const subs = data || [];
  const graded = subs.filter(s => s.status === 'graded');
  const scores = graded.map(s => s.score).filter((s): s is number => s !== null);

  return {
    data: {
      total_submissions: subs.length,
      graded: graded.length,
      pending: subs.filter(s => s.status === 'submitted').length,
      late: subs.filter(s => s.is_late).length,
      average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      highest_score: scores.length > 0 ? Math.max(...scores) : 0,
      lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
    },
    error: '',
  };
};
