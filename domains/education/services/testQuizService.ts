import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types
export interface Test {
  id: string;
  institution_id: string;
  class_id: string | null;
  subject_id: string | null;
  teacher_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  test_type: 'quiz' | 'exam' | 'midterm' | 'final' | 'practice' | 'diagnostic';
  duration_minutes: number;
  max_attempts: number;
  shuffle_questions: boolean;
  shuffle_options: boolean;
  show_results_immediately: boolean;
  passing_score: number;
  total_points: number;
  start_time: string | null;
  end_time: string | null;
  status: 'draft' | 'published' | 'active' | 'closed' | 'archived';
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined
  class?: { id: string; name: string; grade_level: number } | null;
  subject?: { id: string; name: string; code: string } | null;
  teacher?: { id: string; full_name: string } | null;
  question_count?: number;
}

export interface TestQuestion {
  id: string;
  test_id: string;
  question_text: string;
  question_type: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay' | 'matching' | 'fill_blank' | 'ordering';
  options: Array<{id: string; text: string}>;
  correct_answer: unknown;
  explanation: string | null;
  points: number;
  order_index: number;
  media_url: string | null;
  hint: string | null;
  created_at: string;
}

export interface TestAttempt {
  id: string;
  test_id: string;
  student_id: string;
  started_at: string;
  submitted_at: string | null;
  time_spent_seconds: number;
  score: number | null;
  percentage: number | null;
  status: 'in_progress' | 'submitted' | 'graded' | 'abandoned';
  attempt_number: number;
  ip_address: string | null;
  device_info: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  test?: { id: string; title: string; duration_minutes: number; total_points: number } | null;
  student?: { id: string; full_name: string } | null;
}

export interface TestAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer: unknown;
  is_correct: boolean | null;
  points_earned: number;
  feedback: string | null;
  answered_at: string;
  time_spent_seconds: number;
  // Joined
  question?: TestQuestion | null;
}

export interface CreateTestInput {
  institution_id: string;
  class_id?: string;
  subject_id?: string;
  teacher_id: string;
  title: string;
  description?: string;
  instructions?: string;
  test_type?: string;
  duration_minutes?: number;
  max_attempts?: number;
  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  show_results_immediately?: boolean;
  passing_score?: number;
  total_points?: number;
  start_time?: string;
  end_time?: string;
  settings?: Record<string, unknown>;
}

export interface CreateQuestionInput {
  test_id: string;
  question_text: string;
  question_type: string;
  options?: Array<{id: string; text: string}>;
  correct_answer?: unknown;
  explanation?: string;
  points?: number;
  order_index?: number;
  media_url?: string;
  hint?: string;
}

export interface SubmitAnswerInput {
  attempt_id: string;
  question_id: string;
  answer: unknown;
  time_spent_seconds?: number;
}

// Error helper
const handleError = (error: PostgrestError | null): string => {
  if (!error) return '';
  if (error.code === '23505') return 'Duplicate entry detected.';
  if (error.code === '42501') return 'Permission denied.';
  return error.message;
};

// ============================================
// TEST CRUD
// ============================================

export const getTests = async (filters: { teacher_id?: string; class_id?: string; status?: string; institution_id?: string }): Promise<{ data: Test[] | null; error: string }> => {
  let query = supabase
    .from('education_tests')
    .select('*, class:education_classes_v2(id, name, grade_level), subject:education_subjects(id, name, code), teacher:education_teachers(id, full_name)')
    .order('created_at', { ascending: false });

  if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
  if (filters.class_id) query = query.eq('class_id', filters.class_id);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.institution_id) query = query.eq('institution_id', filters.institution_id);

  const { data, error } = await query;
  return { data: data as Test[] | null, error: handleError(error) };
};

export const getTestById = async (id: string): Promise<{ data: Test | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_tests')
    .select('*, class:education_classes_v2(id, name, grade_level), subject:education_subjects(id, name, code), teacher:education_teachers(id, full_name)')
    .eq('id', id)
    .single();
  return { data: data as Test | null, error: handleError(error) };
};

export const createTest = async (input: CreateTestInput): Promise<{ data: Test | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_tests')
    .insert({
      institution_id: input.institution_id,
      class_id: input.class_id || null,
      subject_id: input.subject_id || null,
      teacher_id: input.teacher_id,
      title: input.title,
      description: input.description || null,
      instructions: input.instructions || null,
      test_type: input.test_type || 'quiz',
      duration_minutes: input.duration_minutes || 30,
      max_attempts: input.max_attempts || 1,
      shuffle_questions: input.shuffle_questions ?? false,
      shuffle_options: input.shuffle_options ?? false,
      show_results_immediately: input.show_results_immediately ?? true,
      passing_score: input.passing_score || 50,
      total_points: input.total_points || 100,
      start_time: input.start_time || null,
      end_time: input.end_time || null,
      settings: input.settings || {},
    })
    .select()
    .single();
  return { data: data as Test | null, error: handleError(error) };
};

export const updateTest = async (id: string, updates: Partial<CreateTestInput>): Promise<{ data: Test | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_tests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  return { data: data as Test | null, error: handleError(error) };
};

export const publishTest = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_tests').update({ status: 'published', updated_at: new Date().toISOString() }).eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const activateTest = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_tests').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const closeTest = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_tests').update({ status: 'closed', updated_at: new Date().toISOString() }).eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const deleteTest = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_tests').delete().eq('id', id);
  return { success: !error, error: handleError(error) };
};

// ============================================
// QUESTIONS
// ============================================

export const getQuestions = async (testId: string): Promise<{ data: TestQuestion[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_questions')
    .select('*')
    .eq('test_id', testId)
    .order('order_index', { ascending: true });
  return { data: data as TestQuestion[] | null, error: handleError(error) };
};

export const addQuestion = async (input: CreateQuestionInput): Promise<{ data: TestQuestion | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_questions')
    .insert({
      test_id: input.test_id,
      question_text: input.question_text,
      question_type: input.question_type,
      options: input.options || [],
      correct_answer: input.correct_answer || null,
      explanation: input.explanation || null,
      points: input.points || 1,
      order_index: input.order_index || 0,
      media_url: input.media_url || null,
      hint: input.hint || null,
    })
    .select()
    .single();
  return { data: data as TestQuestion | null, error: handleError(error) };
};

export const updateQuestion = async (id: string, updates: Partial<CreateQuestionInput>): Promise<{ data: TestQuestion | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  return { data: data as TestQuestion | null, error: handleError(error) };
};

export const deleteQuestion = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_test_questions').delete().eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const reorderQuestions = async (testId: string, questionIds: string[]): Promise<{ success: boolean; error: string }> => {
  const updates = questionIds.map((id, idx) =>
    supabase.from('education_test_questions').update({ order_index: idx }).eq('id', id)
  );
  await Promise.all(updates);
  return { success: true, error: '' };
};

// ============================================
// ATTEMPTS
// ============================================

export const startAttempt = async (testId: string, studentId: string): Promise<{ data: TestAttempt | null; error: string }> => {
  // Check existing attempts
  const { data: existing } = await supabase
    .from('education_test_attempts')
    .select('attempt_number')
    .eq('test_id', testId)
    .eq('student_id', studentId)
    .order('attempt_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextAttempt = (existing?.attempt_number || 0) + 1;

  const { data, error } = await supabase
    .from('education_test_attempts')
    .insert({ test_id: testId, student_id: studentId, attempt_number: nextAttempt, status: 'in_progress' })
    .select('*, test:education_tests(id, title, duration_minutes, total_points), student:education_students(id, full_name)')
    .single();
  return { data: data as TestAttempt | null, error: handleError(error) };
};

export const getAttempts = async (filters: { test_id?: string; student_id?: string }): Promise<{ data: TestAttempt[] | null; error: string }> => {
  let query = supabase
    .from('education_test_attempts')
    .select('*, test:education_tests(id, title, duration_minutes, total_points), student:education_students(id, full_name)')
    .order('created_at', { ascending: false });

  if (filters.test_id) query = query.eq('test_id', filters.test_id);
  if (filters.student_id) query = query.eq('student_id', filters.student_id);

  const { data, error } = await query;
  return { data: data as TestAttempt[] | null, error: handleError(error) };
};

export const getAttemptById = async (id: string): Promise<{ data: TestAttempt | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_attempts')
    .select('*, test:education_tests(id, title, duration_minutes, total_points), student:education_students(id, full_name)')
    .eq('id', id)
    .single();
  return { data: data as TestAttempt | null, error: handleError(error) };
};

export const submitAttempt = async (attemptId: string, timeSpent: number): Promise<{ data: TestAttempt | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_attempts')
    .update({ status: 'submitted', submitted_at: new Date().toISOString(), time_spent_seconds: timeSpent, updated_at: new Date().toISOString() })
    .eq('id', attemptId)
    .select('*, test:education_tests(id, title, duration_minutes, total_points), student:education_students(id, full_name)')
    .single();
  return { data: data as TestAttempt | null, error: handleError(error) };
};

export const abandonAttempt = async (attemptId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase.from('education_test_attempts').update({ status: 'abandoned', updated_at: new Date().toISOString() }).eq('id', attemptId);
  return { success: !error, error: handleError(error) };
};

// ============================================
// ANSWERS
// ============================================

export const submitAnswer = async (input: SubmitAnswerInput): Promise<{ data: TestAnswer | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_answers')
    .upsert({
      attempt_id: input.attempt_id,
      question_id: input.question_id,
      answer: input.answer,
      time_spent_seconds: input.time_spent_seconds || 0,
    }, { onConflict: 'attempt_id,question_id' })
    .select()
    .single();
  return { data: data as TestAnswer | null, error: handleError(error) };
};

export const getAnswers = async (attemptId: string): Promise<{ data: TestAnswer[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_answers')
    .select('*, question:education_test_questions(*)')
    .eq('attempt_id', attemptId)
    .order('answered_at', { ascending: true });
  return { data: data as TestAnswer[] | null, error: handleError(error) };
};

// ============================================
// STATS
// ============================================

export const getTestStats = async (testId: string): Promise<{ data: { total_attempts: number; completed: number; average_score: number; highest_score: number; lowest_score: number; pass_rate: number } | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_attempts')
    .select('status, score, percentage')
    .eq('test_id', testId)
    .not('score', 'is', null);

  if (error) return { data: null, error: handleError(error) };

  const attempts = data || [];
  const scores = attempts.map(a => a.score).filter((s): s is number => s !== null);
  const test = await getTestById(testId);

  return {
    data: {
      total_attempts: attempts.length,
      completed: attempts.filter(a => a.status === 'submitted' || a.status === 'graded').length,
      average_score: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0,
      highest_score: scores.length > 0 ? Math.max(...scores) : 0,
      lowest_score: scores.length > 0 ? Math.min(...scores) : 0,
      pass_rate: scores.length > 0 && test.data
        ? Math.round((scores.filter(s => (s / (test.data?.total_points || 1)) * 100 >= (test.data?.passing_score || 50)).length / scores.length) * 100)
        : 0,
    },
    error: '',
  };
};

export const getStudentTestResults = async (studentId: string): Promise<{ data: TestAttempt[] | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_test_attempts')
    .select('*, test:education_tests(id, title, test_type, total_points, passing_score), student:education_students(id, full_name)')
    .eq('student_id', studentId)
    .in('status', ['submitted', 'graded'])
    .order('submitted_at', { ascending: false });
  return { data: data as TestAttempt[] | null, error: handleError(error) };
};
