import { useState, useEffect, useCallback } from 'react';
import { teacherDashboardService } from '../services/teacherDashboardService';
import { EducationTeacherDashboard, EducationTeacherActivity } from '../types/education.types';
import { useAuth } from '@/hooks/useAuth';

type DashboardState = {
  dashboard: EducationTeacherDashboard | null;
  activities: EducationTeacherActivity[];
  todayLessons: any[];
  classPerformance: {
    top_performers: any[];
    struggling: any[];
    class_average: number;
  } | null;
  loading: boolean;
  error: string | null;
  refreshing: boolean;
};

export function useTeacherDashboard(teacherId?: string) {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    dashboard: null,
    activities: [],
    todayLessons: [],
    classPerformance: null,
    loading: true,
    error: null,
    refreshing: false,
  });

  const fetchAll = useCallback(async () => {
    if (!teacherId) {
      setState(s => ({ ...s, loading: false, error: 'No teacher ID provided' }));
      return;
    }

    try {
      setState(s => ({ ...s, loading: !s.dashboard, error: null }));

      const [dashboard, activities, todayLessons, performance] = await Promise.all([
        teacherDashboardService.getDashboard(teacherId),
        teacherDashboardService.getActivities(teacherId, { limit: 20 }),
        teacherDashboardService.getTodayLessons(teacherId),
        teacherDashboardService.getClassPerformance(teacherId),
      ]);

      setState(s => ({
        ...s,
        dashboard,
        activities: activities.data,
        todayLessons,
        classPerformance: performance,
        loading: false,
        error: null,
      }));
    } catch (err: any) {
      setState(s => ({ ...s, error: err.message || 'Failed to load dashboard', loading: false }));
    }
  }, [teacherId]);

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, refreshing: true }));
    await fetchAll();
    setState(s => ({ ...s, refreshing: false }));
  }, [fetchAll]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const refreshDashboard = useCallback(async () => {
    if (!teacherId) return;
    await teacherDashboardService.refreshDashboard(teacherId);
    await refresh();
  }, [teacherId, refresh]);

  const markActivityRead = useCallback(async (activityId: string) => {
    await teacherDashboardService.markActivityRead(activityId);
    setState(s => ({
      ...s,
      activities: s.activities.map(a => a.id === activityId ? { ...a, is_read: true } : a),
    }));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!teacherId) return;
    await teacherDashboardService.markAllRead(teacherId);
    setState(s => ({
      ...s,
      activities: s.activities.map(a => ({ ...a, is_read: true })),
    }));
  }, [teacherId]);

  const unreadCount = state.activities.filter(a => !a.is_read).length;

  return {
    ...state,
    refresh,
    refreshDashboard,
    markActivityRead,
    markAllRead,
    unreadCount,
    isOwner: state.dashboard?.teacher?.user_id === user?.id,
  };
}
