import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface DashboardStats {
  attendance_rate: number;
  avg_grade: number;
  pending_count: number;
  completed_count: number;
  rank: number;
  total_students: number;
}

export interface TodayClass {
  id: string;
  subject_name: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

export interface PendingTask {
  id: string;
  title: string;
  type: 'homework' | 'assignment' | 'quiz';
  subject_name: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
}

export function useStudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [studentName, setStudentName] = useState('Student');
  const [institutionName, setInstitutionName] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const userId = user?.id;
      if (!userId) { setLoading(false); return; }

      const { data: student } = await supabase
        .from('education_students')
        .select('id, full_name, institution_id, class_id, current_level, institution:institution_id(name)')
        .eq('user_id', userId)
        .eq('enrollment_status', 'active')
        .single();

      if (!student) { setLoading(false); return; }
      setStudentName(student.full_name || 'Student');
      setInstitutionName(student.institution?.name || '');

      const today = new Date().toISOString().split('T')[0];
      const dayOfWeek = new Date().getDay();

      const [
        { data: timetable },
        { data: homework },
        { data: submissions },
        { data: attendance },
        { data: grades },
        { data: classStudents },
      ] = await Promise.all([
        supabase.from('education_timetable_entries').select(`
          id, start_time, end_time, room,
          subject:subject_id (name),
          teacher:teacher_id (full_name)
        `).eq('class_id', student.class_id).eq('day_of_week', dayOfWeek).order('start_time'),

        supabase.from('education_assignments').select('id, title, due_date, subject:subject_id(name)')
          .eq('class_id', student.class_id).gte('due_date', today).order('due_date').limit(5),

        supabase.from('education_submissions').select('assignment_id, status')
          .eq('student_id', student.id).in('status', ['pending', 'submitted']),

        supabase.from('education_attendance').select('status')
          .eq('student_id', student.id)
          .gte('date', new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]),

        supabase.from('education_grades').select('score')
          .eq('student_id', student.id).order('created_at', { ascending: false }).limit(20),

        supabase.from('education_students').select('id').eq('class_id', student.class_id),
      ]);

      // Map classes with status
      const now = new Date();
      const currentMins = now.getHours() * 60 + now.getMinutes();
      const mappedClasses = (timetable || []).map((t: any) => {
        const [sh, sm] = t.start_time.split(':').map(Number);
        const [eh, em] = t.end_time.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
        if (currentMins >= startMins && currentMins <= endMins) status = 'ongoing';
        else if (currentMins > endMins) status = 'completed';
        return {
          id: t.id, subject_name: t.subject?.name || 'Subject',
          teacher_name: t.teacher?.full_name || 'Teacher',
          start_time: t.start_time, end_time: t.end_time,
          room: t.room || 'TBD', status,
        };
      });
      setClasses(mappedClasses);

      // Map tasks
      const mappedTasks = (homework || []).map((h: any) => ({
        id: h.id, title: h.title, type: 'homework' as const,
        subject_name: h.subject?.name || 'Subject', due_date: h.due_date,
        priority: new Date(h.due_date).getTime() - Date.now() < 86400000 * 2 ? 'high' as const : 'medium' as const,
      }));
      setTasks(mappedTasks);

      // Stats
      const totalAtt = attendance?.length || 0;
      const present = attendance?.filter((a: any) => a.status === 'present').length || 0;
      const attRate = totalAtt > 0 ? Math.round((present / totalAtt) * 100) : 0;

      const scores = (grades || []).map((g: any) => g.score).filter((s: number) => typeof s === 'number');
      const avg = scores.length > 0 ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length) : 0;

      const completed = (submissions || []).filter((s: any) => s.status === 'submitted').length;
      const pending = mappedTasks.length + (submissions?.filter((s: any) => s.status === 'pending').length || 0);

      setStats({
        attendance_rate: attRate, avg_grade: avg,
        pending_count: pending, completed_count: completed,
        rank: 0, total_students: classStudents?.length || 0,
      });
    } catch (e) {
      console.error('useStudentDashboard error:', e);
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

  return { stats, classes, tasks, loading, refreshing, refresh, studentName, institutionName };
}
