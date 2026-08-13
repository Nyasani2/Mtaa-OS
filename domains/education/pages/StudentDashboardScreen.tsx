import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, FlatList, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface TodayClass {
  id: string;
  subject_name: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  room: string;
  status: 'upcoming' | 'ongoing' | 'completed';
}

interface PendingTask {
  id: string;
  title: string;
  type: 'homework' | 'assignment' | 'quiz';
  subject_name: string;
  due_date: string;
  priority: 'high' | 'medium' | 'low';
}

interface Stats {
  attendance_rate: number;
  avg_grade: number;
  pending_count: number;
  rank: number;
}

const QUICK_ACTIONS = [
  { icon: 'book-open-variant', label: 'Homework', route: '/(education)/homework', color: '#3b82f6' },
  { icon: 'calendar-check', label: 'Attendance', route: '/(education)/attendance', color: '#22c55e' },
  { icon: 'file-document', label: 'Grades', route: '/(education)/report-card', color: '#f59e0b' },
  { icon: 'message-text', label: 'Messages', route: '/(education)/messages', color: '#8b5cf6' },
  { icon: 'qrcode', label: 'My ID', route: '/(education)/qr-identity', color: '#ec4899' },
  { icon: 'bus', label: 'My Bus', route: '/(education)/transport-map', color: '#06b6d4' },
  { icon: 'school', label: 'My School', route: '/(education)/school-feed', color: '#6366f1' },
  { icon: 'compass', label: 'Explore', route: '/(education)/african-feed', color: '#14b8a6' },
];

export default function StudentDashboardScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [classes, setClasses] = useState<TodayClass[]>([]);
  const [tasks, setTasks] = useState<PendingTask[]>([]);
  const [stats, setStats] = useState<Stats>({ attendance_rate: 0, avg_grade: 0, pending_count: 0, rank: 0 });
  const [studentName, setStudentName] = useState('Student');

  const fetchDashboard = useCallback(async () => {
    try {
      const userId = user?.id;
      if (!userId) return;

      // Get student record
      const { data: student } = await supabase
        .from('education_students')
        .select('id, full_name, institution_id, class_id, current_level')
        .eq('user_id', userId)
        .eq('enrollment_status', 'active')
        .single();

      if (!student) return;
      setStudentName(student.full_name || 'Student');

      const today = new Date().toISOString().split('T')[0];

      // Parallel data fetch
      const [
        { data: timetable },
        { data: homework },
        { data: assignments },
        { data: attendance },
        { data: grades },
      ] = await Promise.all([
        // Today's classes from timetable
        supabase
          .from('education_timetable_entries')
          .select(`
            id, start_time, end_time, room,
            subject:subject_id (name),
            teacher:teacher_id (full_name)
          `)
          .eq('class_id', student.class_id)
          .eq('day_of_week', new Date().getDay())
          .order('start_time', { ascending: true }),

        // Pending homework
        supabase
          .from('education_assignments')
          .select('id, title, due_date, subject:subject_id(name)')
          .eq('class_id', student.class_id)
          .gte('due_date', today)
          .order('due_date', { ascending: true })
          .limit(5),

        // Pending assignments (submissions not done)
        supabase
          .from('education_submissions')
          .select('assignment_id, status')
          .eq('student_id', student.id)
          .eq('status', 'pending'),

        // Attendance this term
        supabase
          .from('education_attendance')
          .select('status')
          .eq('student_id', student.id)
          .gte('date', new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0]),

        // Recent grades
        supabase
          .from('education_grades')
          .select('score')
          .eq('student_id', student.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      // Map classes
      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const mappedClasses: TodayClass[] = (timetable || []).map((t: any) => {
        const [sh, sm] = t.start_time.split(':').map(Number);
        const [eh, em] = t.end_time.split(':').map(Number);
        const startMins = sh * 60 + sm;
        const endMins = eh * 60 + em;
        let status: 'upcoming' | 'ongoing' | 'completed' = 'upcoming';
        if (currentTime >= startMins && currentTime <= endMins) status = 'ongoing';
        else if (currentTime > endMins) status = 'completed';
        return {
          id: t.id,
          subject_name: t.subject?.name || 'Subject',
          teacher_name: t.teacher?.full_name || 'Teacher',
          start_time: t.start_time,
          end_time: t.end_time,
          room: t.room || 'TBD',
          status,
        };
      });
      setClasses(mappedClasses);

      // Map tasks
      const mappedTasks: PendingTask[] = (homework || []).map((h: any) => ({
        id: h.id,
        title: h.title,
        type: 'homework',
        subject_name: h.subject?.name || 'Subject',
        due_date: h.due_date,
        priority: new Date(h.due_date).getTime() - Date.now() < 86400000 * 2 ? 'high' : 'medium',
      }));
      setTasks(mappedTasks);

      // Calculate stats
      const totalAttendance = attendance?.length || 0;
      const presentCount = attendance?.filter((a: any) => a.status === 'present').length || 0;
      const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

      const gradeScores = (grades || []).map((g: any) => g.score).filter((s: number) => typeof s === 'number');
      const avgGrade = gradeScores.length > 0
        ? Math.round(gradeScores.reduce((a: number, b: number) => a + b, 0) / gradeScores.length)
        : 0;

      setStats({
        attendance_rate: attendanceRate,
        avg_grade: avgGrade,
        pending_count: mappedTasks.length + (assignments?.length || 0),
        rank: 0, // Would need class ranking query
      });
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboard();
  }, [fetchDashboard]);

  const getPriorityColor = (p: string) => {
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  const getStatusColor = (s: string) => {
    if (s === 'ongoing') return '#22c55e';
    if (s === 'completed') return '#64748b';
    return '#3b82f6';
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}</Text>
          <Text style={[styles.name, { color: colors.text }]}>{studentName}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(education)/notifications' as any)} style={styles.notifBtn}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
          {stats.pending_count > 0 && (
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>{stats.pending_count}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats Cards */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#22c55e20' }]}>
            <Ionicons name="calendar" size={20} color="#22c55e" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.attendance_rate}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#f59e0b20' }]}>
            <Ionicons name="trophy" size={20} color="#f59e0b" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.avg_grade}%</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg Grade</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.statIcon, { backgroundColor: '#ef444420' }]}>
            <Ionicons name="alert-circle" size={20} color="#ef4444" />
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>{stats.pending_count}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </ScrollView>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
        <View style={styles.quickGrid}>
          {QUICK_ACTIONS.map((action, i) => (
            <TouchableOpacity
              key={i}
              style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(action.route as any)}
            >
              <View style={[styles.quickIcon, { backgroundColor: action.color + '20' }]}>
                <MaterialCommunityIcons name={action.icon as any} size={22} color={action.color} />
              </View>
              <Text style={[styles.quickLabel, { color: colors.text }]}>{action.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Today's Classes */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Today's Classes</Text>
          <TouchableOpacity onPress={() => router.push('/(education)/student-classes' as any)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {classes.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="calendar-outline" size={32} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No classes scheduled today</Text>
          </View>
        ) : (
          classes.map((cls: any) => (
            <View key={cls.id} style={[styles.classCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(cls.status) }]} />
              <View style={styles.classInfo}>
                <Text style={[styles.classSubject, { color: colors.text }]}>{cls.subject_name}</Text>
                <Text style={[styles.classMeta, { color: colors.textSecondary }]}>{cls.teacher_name} · Room {cls.room}</Text>
              </View>
              <View style={styles.classTime}>
                <Text style={[styles.timeText, { color: getStatusColor(cls.status) }]}>
                  {cls.start_time.slice(0, 5)} - {cls.end_time.slice(0, 5)}
                </Text>
                {cls.status === 'ongoing' && (
                  <View style={[styles.ongoingBadge, { backgroundColor: '#22c55e20' }]}>
                    <Text style={{ color: '#22c55e', fontSize: 10, fontWeight: '700' }}>NOW</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Pending Tasks */}
      <View style={[styles.section, { paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Due Soon</Text>
          <TouchableOpacity onPress={() => router.push('/(education)/homework' as any)}>
            <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
          </TouchableOpacity>
        </View>
        {tasks.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="checkmark-circle-outline" size={32} color="#22c55e" />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>All caught up! No pending tasks.</Text>
          </View>
        ) : (
          tasks.map((task: any) => (
            <TouchableOpacity
              key={task.id}
              style={[styles.taskCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push(`/(education)/assignment-detail?id=${task.id}` as any)}
            >
              <View style={[styles.taskPriority, { backgroundColor: getPriorityColor(task.priority) + '20' }]}>
                <Ionicons
                  name={task.type === 'quiz' ? 'help-circle' : task.type === 'assignment' ? 'document-text' : 'book'}
                  size={18}
                  color={getPriorityColor(task.priority)}
                />
              </View>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: colors.text }]} numberOfLines={1}>{task.title}</Text>
                <Text style={[styles.taskMeta, { color: colors.textSecondary }]}>{task.subject_name}</Text>
              </View>
              <View style={styles.taskDue}>
                <Text style={[styles.dueText, { color: getPriorityColor(task.priority) }]}>
                  {new Date(task.due_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  greeting: { fontSize: 14 },
  name: { fontSize: 22, fontWeight: '800', marginTop: 2 },
  notifBtn: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 6, right: 6, backgroundColor: '#ef4444', borderRadius: 10, minWidth: 18, height: 18, justifyContent: 'center', alignItems: 'center' },
  notifBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statsRow: { paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  statCard: { width: width * 0.32, borderRadius: 16, padding: 14, borderWidth: 1, alignItems: 'center' },
  statIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  statValue: { fontSize: 20, fontWeight: '800' },
  statLabel: { fontSize: 11, marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  seeAll: { fontSize: 13, fontWeight: '600' },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  quickBtn: { width: (width - 52) / 4, borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1 },
  quickIcon: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  quickLabel: { fontSize: 11, fontWeight: '600', textAlign: 'center' },
  classCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 12 },
  classInfo: { flex: 1 },
  classSubject: { fontSize: 15, fontWeight: '700' },
  classMeta: { fontSize: 12, marginTop: 2 },
  classTime: { alignItems: 'flex-end' },
  timeText: { fontSize: 13, fontWeight: '600' },
  ongoingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginTop: 4 },
  taskCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1 },
  taskPriority: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 14, fontWeight: '600' },
  taskMeta: { fontSize: 12, marginTop: 2 },
  taskDue: { alignItems: 'flex-end' },
  dueText: { fontSize: 12, fontWeight: '700' },
  emptyCard: { borderRadius: 16, padding: 24, alignItems: 'center', borderWidth: 1 },
  emptyText: { marginTop: 10, fontSize: 13, textAlign: 'center' },
});
