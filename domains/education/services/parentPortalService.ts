import { supabase } from '@/lib/supabase';
import { PostgrestError } from '@supabase/supabase-js';

// Types
export interface ParentConnection {
  id: string;
  guardian_id: string;
  student_id: string;
  relationship_type: 'parent' | 'guardian' | 'step_parent' | 'grandparent' | 'sibling' | 'other';
  is_primary_contact: boolean;
  can_pickup: boolean;
  can_view_grades: boolean;
  can_view_attendance: boolean;
  can_view_health: boolean;
  can_make_payments: boolean;
  can_message_teacher: boolean;
  emergency_contact: boolean;
  emergency_priority: number;
  verified_at: string | null;
  verification_method: string | null;
  status: 'pending' | 'verified' | 'rejected' | 'revoked';
  created_at: string;
  updated_at: string;
  // Joined
  student?: { id: string; full_name: string; student_number: string; grade_level: number } | null;
  guardian?: { id: string; full_name: string; phone: string; email: string } | null;
}

export interface ParentNotification {
  id: string;
  institution_id: string;
  guardian_id: string;
  student_id: string | null;
  notification_type: 'attendance_alert' | 'grade_posted' | 'assignment_due' | 'behavior_incident' | 'fee_reminder' | 'event_notice' | 'emergency' | 'general' | 'transport_delay' | 'safety_alert';
  title: string;
  message: string;
  action_url: string | null;
  action_label: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  is_read: boolean;
  read_at: string | null;
  sent_via: string[];
  metadata: Record<string, unknown>;
  created_at: string;
  // Joined
  student?: { id: string; full_name: string } | null;
}

export interface ParentFeedback {
  id: string;
  institution_id: string;
  guardian_id: string;
  student_id: string;
  teacher_id: string | null;
  category: 'academic' | 'behavior' | 'attendance' | 'health' | 'transport' | 'fee' | 'general' | 'complaint' | 'compliment';
  subject: string;
  message: string;
  is_anonymous: boolean;
  status: 'open' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  response: string | null;
  responded_by: string | null;
  responded_at: string | null;
  is_urgent: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  student?: { id: string; full_name: string } | null;
  teacher?: { id: string; full_name: string } | null;
  responder?: { id: string; full_name: string } | null;
}

export interface CreateConnectionInput {
  guardian_id: string;
  student_id: string;
  relationship_type?: string;
  is_primary_contact?: boolean;
  can_pickup?: boolean;
  can_view_grades?: boolean;
  can_view_attendance?: boolean;
  can_view_health?: boolean;
  can_make_payments?: boolean;
  can_message_teacher?: boolean;
  emergency_contact?: boolean;
  emergency_priority?: number;
}

export interface CreateFeedbackInput {
  institution_id: string;
  guardian_id: string;
  student_id: string;
  teacher_id?: string;
  category: string;
  subject: string;
  message: string;
  is_anonymous?: boolean;
  is_urgent?: boolean;
}

// Error helper
const handleError = (error: PostgrestError | null): string => {
  if (!error) return '';
  if (error.code === '23505') return 'Connection already exists.';
  if (error.code === '42501') return 'Permission denied.';
  return error.message;
};

// ============================================
// CONNECTIONS
// ============================================

export const getConnections = async (guardianId?: string, studentId?: string): Promise<{ data: ParentConnection[] | null; error: string }> => {
  let query = supabase
    .from('education_parent_connections')
    .select('*, student:education_students(id, full_name, student_number, grade_level), guardian:education_guardians(id, full_name, phone, email)')
    .order('created_at', { ascending: false });

  if (guardianId) query = query.eq('guardian_id', guardianId);
  if (studentId) query = query.eq('student_id', studentId);

  const { data, error } = await query;
  return { data: data as ParentConnection[] | null, error: handleError(error) };
};

export const createConnection = async (input: CreateConnectionInput): Promise<{ data: ParentConnection | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_parent_connections')
    .insert({
      guardian_id: input.guardian_id,
      student_id: input.student_id,
      relationship_type: input.relationship_type || 'parent',
      is_primary_contact: input.is_primary_contact ?? false,
      can_pickup: input.can_pickup ?? true,
      can_view_grades: input.can_view_grades ?? true,
      can_view_attendance: input.can_view_attendance ?? true,
      can_view_health: input.can_view_health ?? false,
      can_make_payments: input.can_make_payments ?? true,
      can_message_teacher: input.can_message_teacher ?? true,
      emergency_contact: input.emergency_contact ?? false,
      emergency_priority: input.emergency_priority || 1,
    })
    .select()
    .single();
  return { data: data as ParentConnection | null, error: handleError(error) };
};

export const verifyConnection = async (id: string, method: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_parent_connections')
    .update({ status: 'verified', verified_at: new Date().toISOString(), verification_method: method, updated_at: new Date().toISOString() })
    .eq('id', id);
  return { success: !error, error: handleError(error) };
};

export const revokeConnection = async (id: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_parent_connections')
    .update({ status: 'revoked', updated_at: new Date().toISOString() })
    .eq('id', id);
  return { success: !error, error: handleError(error) };
};

// ============================================
// NOTIFICATIONS
// ============================================

export const getNotifications = async (guardianId: string, filters?: { is_read?: boolean; type?: string; limit?: number }): Promise<{ data: ParentNotification[] | null; error: string }> => {
  let query = supabase
    .from('education_parent_notifications')
    .select('*, student:education_students(id, full_name)')
    .eq('guardian_id', guardianId)
    .order('created_at', { ascending: false });

  if (filters?.is_read !== undefined) query = query.eq('is_read', filters.is_read);
  if (filters?.type) query = query.eq('notification_type', filters.type);
  if (filters?.limit) query = query.limit(filters.limit);

  const { data, error } = await query;
  return { data: data as ParentNotification[] | null, error: handleError(error) };
};

export const markAsRead = async (notificationId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_parent_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);
  return { success: !error, error: handleError(error) };
};

export const markAllAsRead = async (guardianId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_parent_notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('guardian_id', guardianId)
    .eq('is_read', false);
  return { success: !error, error: handleError(error) };
};

export const getUnreadCount = async (guardianId: string): Promise<{ count: number; error: string }> => {
  const { count, error } = await supabase
    .from('education_parent_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('guardian_id', guardianId)
    .eq('is_read', false);
  return { count: count || 0, error: handleError(error) };
};

// ============================================
// FEEDBACK
// ============================================

export const getFeedback = async (filters: { guardian_id?: string; student_id?: string; teacher_id?: string; status?: string }): Promise<{ data: ParentFeedback[] | null; error: string }> => {
  let query = supabase
    .from('education_parent_feedback')
    .select('*, student:education_students(id, full_name), teacher:education_teachers!teacher_id(id, full_name), responder:education_teachers!responded_by(id, full_name)')
    .order('created_at', { ascending: false });

  if (filters.guardian_id) query = query.eq('guardian_id', filters.guardian_id);
  if (filters.student_id) query = query.eq('student_id', filters.student_id);
  if (filters.teacher_id) query = query.eq('teacher_id', filters.teacher_id);
  if (filters.status) query = query.eq('status', filters.status);

  const { data, error } = await query;
  return { data: data as ParentFeedback[] | null, error: handleError(error) };
};

export const createFeedback = async (input: CreateFeedbackInput): Promise<{ data: ParentFeedback | null; error: string }> => {
  const { data, error } = await supabase
    .from('education_parent_feedback')
    .insert({
      institution_id: input.institution_id,
      guardian_id: input.guardian_id,
      student_id: input.student_id,
      teacher_id: input.teacher_id || null,
      category: input.category,
      subject: input.subject,
      message: input.message,
      is_anonymous: input.is_anonymous ?? false,
      is_urgent: input.is_urgent ?? false,
    })
    .select()
    .single();
  return { data: data as ParentFeedback | null, error: handleError(error) };
};

export const respondToFeedback = async (feedbackId: string, response: string, teacherId: string): Promise<{ success: boolean; error: string }> => {
  const { error } = await supabase
    .from('education_parent_feedback')
    .update({
      response,
      responded_by: teacherId,
      responded_at: new Date().toISOString(),
      status: 'resolved',
      updated_at: new Date().toISOString(),
    })
    .eq('id', feedbackId);
  return { success: !error, error: handleError(error) };
};

// ============================================
// PARENT DASHBOARD DATA
// ============================================

export const getParentDashboard = async (guardianId: string): Promise<{ data: { children: ParentConnection[]; unread_count: number; recent_notifications: ParentNotification[]; open_feedback: ParentFeedback[] } | null; error: string }> => {
  const [{ data: children, error: cErr }, { data: notifications, error: nErr }, { data: feedback, error: fErr }, { count }] = await Promise.all([
    getConnections(guardianId),
    getNotifications(guardianId, { limit: 5 }),
    getFeedback({ guardian_id: guardianId, status: 'open' }),
    getUnreadCount(guardianId),
  ]);

  const error = cErr || nErr || fErr;
  if (error) return { data: null, error };

  return {
    data: {
      children: children || [],
      unread_count: count || 0,
      recent_notifications: notifications || [],
      open_feedback: feedback || [],
    },
    error: '',
  };
};
