import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export interface Assignment {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  description: string;
  type: string;
  instructions: string;
  attachments: any;
  max_score: number;
  due_date: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  attachments: any;
  submitted_at: string;
  graded_at: string | null;
  score: number | null;
  feedback: string;
  graded_by: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export async function getAssignments(filters?: {
  class_id?: string;
  subject_id?: string;
  teacher_id?: string;
  type?: string;
  due_after?: string;
  due_before?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_assignments')
      .select('*')
      .order('due_date', { ascending: true });

    if (filters?.class_id) query = query.eq('class_id', filters.class_id);
    if (filters?.subject_id) query = query.eq('subject_id', filters.subject_id);
    if (filters?.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
    if (filters?.type) query = query.eq('type', filters.type);
    if (filters?.due_after) query = query.gte('due_date', filters.due_after);
    if (filters?.due_before) query = query.lte('due_date', filters.due_before);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as Assignment[], error: null };
  } catch (error: any) {
    console.error('getAssignments error:', error);
    return { data: [], error };
  }
}

export async function getAssignmentById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_assignments')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as Assignment, error: null };
  } catch (error: any) {
    console.error('getAssignmentById error:', error);
    return { data: null, error };
  }
}

export async function createAssignment(assignment: Partial<Assignment>) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: teacher } = await supabase
      .from('education_teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('education_assignments')
      .insert([{ ...assignment, teacher_id: teacher?.id || assignment.teacher_id }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Assignment, error: null };
  } catch (error: any) {
    console.error('createAssignment error:', error);
    return { data: null, error };
  }
}

export async function updateAssignment(id: string, updates: Partial<Assignment>) {
  try {
    const { data, error } = await supabase
      .from('education_assignments')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Assignment, error: null };
  } catch (error: any) {
    console.error('updateAssignment error:', error);
    return { data: null, error };
  }
}

export async function deleteAssignment(id: string) {
  try {
    const { error } = await supabase
      .from('education_assignments')
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { success: true, error: null };
  } catch (error: any) {
    console.error('deleteAssignment error:', error);
    return { success: false, error };
  }
}

// Submissions
export async function getSubmissions(filters?: {
  assignment_id?: string;
  student_id?: string;
  status?: string;
  limit?: number;
  offset?: number;
}) {
  try {
    let query = supabase
      .from('education_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (filters?.assignment_id) query = query.eq('assignment_id', filters.assignment_id);
    if (filters?.student_id) query = query.eq('student_id', filters.student_id);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return { data: (data || []) as Submission[], error: null };
  } catch (error: any) {
    console.error('getSubmissions error:', error);
    return { data: [], error };
  }
}

export async function getSubmissionById(id: string) {
  try {
    const { data, error } = await supabase
      .from('education_submissions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data: data as Submission, error: null };
  } catch (error: any) {
    console.error('getSubmissionById error:', error);
    return { data: null, error };
  }
}

export async function submitAssignment(submission: Partial<Submission>) {
  try {
    const { data, error } = await supabase
      .from('education_submissions')
      .insert([{
        ...submission,
        status: 'submitted',
        submitted_at: new Date().toISOString(),
      }])
      .select()
      .single();
    if (error) throw error;
    return { data: data as Submission, error: null };
  } catch (error: any) {
    console.error('submitAssignment error:', error);
    return { data: null, error };
  }
}

export async function gradeSubmission(id: string, score: number, feedback: string) {
  try {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('Not authenticated');

    const { data: teacher } = await supabase
      .from('education_teachers')
      .select('id')
      .eq('user_id', userId)
      .single();

    const { data, error } = await supabase
      .from('education_submissions')
      .update({
        score,
        feedback,
        status: 'graded',
        graded_by: teacher?.id,
        graded_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data: data as Submission, error: null };
  } catch (error: any) {
    console.error('gradeSubmission error:', error);
    return { data: null, error };
  }
}
