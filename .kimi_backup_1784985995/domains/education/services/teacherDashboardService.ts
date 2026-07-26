import { supabase } from '@/lib/supabase';
import { EducationTeacherDashboard, EducationTeacherActivity } from '../types/education.types';

export const teacherDashboardService = {
  /**
   * Get teacher dashboard data
   */
  async getDashboard(teacherId: string): Promise<EducationTeacherDashboard | null> {
    const { data, error } = await supabase
      .from('education_teacher_dashboards')
      .select(`
        *,
        teacher:teacher_id (
          id, full_name, subjects_taught, classes_assigned,
          institution:institution_id (id, name, logo_url)
        )
      `)
      .eq('teacher_id', teacherId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw new Error(error.message);
    }
    return data as EducationTeacherDashboard;
  },

  /**
   * Refresh dashboard (trigger recalculation)
   */
  async refreshDashboard(teacherId: string): Promise<void> {
    const { error } = await supabase.rpc('refresh_teacher_dashboard', {
      p_teacher_id: teacherId,
    });
    if (error) throw new Error(error.message);
  },

  /**
   * Get teacher activities
   */
  async getActivities(teacherId: string, options?: {
    limit?: number;
    offset?: number;
    unreadOnly?: boolean;
  }): Promise<{ data: EducationTeacherActivity[]; count: number }> {
    let query = supabase
      .from('education_teacher_activities')
      .select('*', { count: 'exact' })
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false });

    if (options?.unreadOnly) query = query.eq('is_read', false);
    if (options?.limit) {
      query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    }

    const { data, error, count } = await query;
    if (error) throw new Error(error.message);
    return { data: (data || []) as EducationTeacherActivity[], count: count || 0 };
  },

  /**
   * Mark activity as read
   */
  async markActivityRead(activityId: string): Promise<void> {
    const { error } = await supabase
      .from('education_teacher_activities')
      .update({ is_read: true })
      .eq('id', activityId);

    if (error) throw new Error(error.message);
  },

  /**
   * Mark all activities as read
   */
  async markAllRead(teacherId: string): Promise<void> {
    const { error } = await supabase
      .from('education_teacher_activities')
      .update({ is_read: true })
      .eq('teacher_id', teacherId)
      .eq('is_read', false);

    if (error) throw new Error(error.message);
  },

  /**
   * Log an activity
   */
  async logActivity(payload: Partial<EducationTeacherActivity>): Promise<EducationTeacherActivity> {
    const { data, error } = await supabase
      .from('education_teacher_activities')
      .insert(payload)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data as EducationTeacherActivity;
  },

  /**
   * Get today's lessons for a teacher
   */
  async getTodayLessons(teacherId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('education_lessons')
      .select(`
        id, title, scheduled_at, duration_minutes, status, room,
        subject:subject_id (id, name),
        class:class_id (id, name, level)
      `)
      .eq('teacher_id', teacherId)
      .gte('scheduled_at', `${today}T00:00:00`)
      .lte('scheduled_at', `${today}T23:59:59`)
      .order('scheduled_at', { ascending: true });

    if (error) throw new Error(error.message);
    return data || [];
  },

  /**
   * Get pending grading count
   */
  async getPendingGrading(teacherId: string): Promise<number> {
    const { count, error } = await supabase
      .from('education_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted')
      .is('graded_at', null)
      .in('assignment_id', (
        supabase.from('education_assignments').select('id').eq('teacher_id', teacherId)
      ));

    if (error) throw new Error(error.message);
    return count || 0;
  },

  /**
   * Get class performance summary
   */
  async getClassPerformance(teacherId: string): Promise<{
    top_performers: any[];
    struggling: any[];
    class_average: number;
  }> {
    // Get teacher's classes
    const { data: classes } = await supabase
      .from('education_classes')
      .select('id')
      .eq('class_teacher_id', teacherId);

    const classIds = (classes || []).map((c: any) => c.id);
    if (classIds.length === 0) return { top_performers: [], struggling: [], class_average: 0 };

    // Get recent grades
    const { data: grades } = await supabase
      .from('education_grades')
      .select(`
        score,
        student:student_id (id, full_name)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (!grades || grades.length === 0) return { top_performers: [], struggling: [], class_average: 0 };

    // Calculate averages per student
    const studentScores: Record<string, { name: string; scores: number[] }> = {};
    grades.forEach((g: any) => {
      const sid = g.student?.id;
      if (!sid) return;
      if (!studentScores[sid]) studentScores[sid] = { name: g.student.full_name, scores: [] };
      studentScores[sid].scores.push(g.score);
    });

    const averages = Object.entries(studentScores).map(([id, info]) => ({
      student_id: id,
      name: info.name,
      average: info.scores.reduce((a, b) => a + b, 0) / info.scores.length,
    })).sort((a, b) => b.average - a.average);

    const classAverage = averages.reduce((sum, s) => sum + s.average, 0) / averages.length;

    return {
      top_performers: averages.slice(0, 5),
      struggling: averages.filter(s => s.average < 50).slice(0, 5),
      class_average: classAverage,
    };
  },
};
