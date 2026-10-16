import { supabase } from '@/lib/supabase';

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
