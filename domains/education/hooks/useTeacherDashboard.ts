import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface TeacherStats {
  total_students: number;
  total_classes_today: number;
  attendance_taken_today: number;
  class_avg: number;
}

export function useTeacherDashboard() {
  const { user } = useAuth();
  const [todayClasses, setTodayClasses] = useState<any[]>([]);
  const [pendingGrading, setPendingGrading] = useState<any[]>([]);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [attendancePending, setAttendancePending] = useState<any[]>([]);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) { setLoading(false); return; }

      const { data: teacher } = await supabase
        .from('education_teachers')
        .select('id, institution_id')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!teacher) { setLoading(false); return; }

      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();

      const [
        { data: timetable },
        { data: submissions },
        { data: attendanceToday },
        { data: messages },
        { data: allStudents },
        { data: grades },
      ] = await Promise.all([
        supabase.from('education_timetable_entries').select(`
          id, start_time, end_time, room,
          subject:subject_id(name),
          class:class_id(id, name, grade_level)
        `)
          .eq('teacher_id', teacher.id)
          .eq('day_of_week', dayOfWeek)
          .order('start_time'),

        supabase.from('education_submissions').select(`
          id, submitted_at, status,
          assignment:assignment_id(title, due_date),
          student:student_id(full_name)
        `)
          .eq('status', 'submitted')
          .in('assignment_id', supabase.from('education_assignments').select('id').eq('teacher_id', teacher.id))
          .order('submitted_at', { ascending: false })
          .limit(10),

        supabase.from('education_attendance').select('timetable_entry_id')
          .eq('teacher_id', teacher.id)
          .eq('date', today),

        supabase.from('education_messages').select('id', { count: 'exact' })
          .eq('recipient_id', userId)
          .eq('read', false),

        supabase.from('education_students').select('id')
          .eq('institution_id', teacher.institution_id)
          .eq('enrollment_status', 'active'),

        supabase.from('education_grades').select('score')
          .eq('teacher_id', teacher.id)
          .order('created_at', { ascending: false })
          .limit(50),
      ]);

      // Map classes with attendance status
      const takenIds = new Set((attendanceToday || []).map((a: any) => a.timetable_entry_id));
      const mappedClasses = (timetable || []).map((t: any) => {
        const [sh, sm] = (t.start_time || '00:00').split(':').map(Number);
        const [eh, em] = (t.end_time || '00:00').split(':').map(Number);
        const duration = (eh * 60 + em) - (sh * 60 + sm);
        return {
          id: t.id,
          start_time: t.start_time,
          duration,
          subject_name: t.subject?.name || 'Subject',
          class_name: t.class?.name || 'Class',
          student_count: 0, // Would need class enrollment count
          attendance_taken: takenIds.has(t.id),
        };
      });
      setTodayClasses(mappedClasses);

      // Pending grading
      const mappedGrading = (submissions || []).map((s: any) => ({
        id: s.id,
        student_name: s.student?.full_name || 'Student',
        assignment_title: s.assignment?.title || 'Assignment',
        submitted_at: s.submitted_at,
        days_overdue: Math.max(0, Math.floor((Date.now() - new Date(s.assignment?.due_date || Date.now()).getTime()) / 86400000)),
      }));
      setPendingGrading(mappedGrading);

      // Attendance pending
      const pending = mappedClasses.filter((c: any) => !c.attendance_taken);
      setAttendancePending(pending);

      // Stats
      const scores = (grades || []).map((g: any) => g.score).filter((s: number) => typeof s === 'number');
      const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

      setStats({
        total_students: allStudents?.length || 0,
        total_classes_today: mappedClasses.length,
        attendance_taken_today: mappedClasses.length - pending.length,
        class_avg: avg,
      });

      setUnreadMessages(messages?.length || 0);
    } catch (e) {
      console.error('useTeacherDashboard error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    todayClasses, pendingGrading, unreadMessages,
    attendancePending, stats,
    loading, refreshing, refresh,
  };
}
