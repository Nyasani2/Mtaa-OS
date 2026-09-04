// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getStudentByUserId, getStudentAssignments, getStudentGrades, getStudentAttendance, getStudentTimetable } = useEducation();
  const [student, setStudent] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const s = await getStudentByUserId(user.id);
      setStudent(s);
      if (s) {
        const [a, g, att, tt] = await Promise.all([
          getStudentAssignments(s.id),
          getStudentGrades(s.id),
          getStudentAttendance(s.id),
          getStudentTimetable(s.current_class_id),
        ]);
        setAssignments(a || []);
        setGrades(g || []);
        setAttendance(att || []);
        setTimetable(tt || []);
      }
    } catch (e) {
      console.error('Student load error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const todayTimetable = timetable.filter((l: any) => {
    const d = new Date().getDay();
    const days = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
    return l.day_of_week?.toLowerCase() === days[d];
  });

  const pendingAssignments = assignments.filter((a: any) => a.status === 'pending');
  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100)
    : 0;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      {/* Header */}
      <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
        <Text style={styles.headerTitle}>Student Portal</Text>
        <Text style={styles.headerSubtitle}>{student?.full_name || 'Loading...'}</Text>
        <Text style={styles.headerClass}>{student?.current_class?.name || ''} • {student?.institution?.name || ''}</Text>
      </LinearGradient>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard icon="book-outline" label="Assignments" value={assignments.length} color="#6366f1" />
        <StatCard icon="school-outline" label="Grades" value={grades.length} color="#10b981" />
        <StatCard icon="calendar-outline" label="Attendance" value={`${attendanceRate}%`} color="#f59e0b" />
      </View>

      {/* Today's Classes */}
      <Section title="Today's Classes" icon="time-outline" action="View Full" onAction={() => router.push('/(education as any)/timetable' as any)}>
        {todayTimetable.length === 0 ? (
          <Text style={styles.emptyText}>No classes scheduled today</Text>
        ) : (
          todayTimetable.map((lesson, i) => (
            <View key={i} style={styles.lessonRow}>
              <Text style={styles.lessonTime}>{lesson.start_time?.slice(0,5)} - {lesson.end_time?.slice(0,5)}</Text>
              <Text style={styles.lessonSubject}>{lesson.subject?.name}</Text>
              <Text style={styles.lessonTeacher}>{lesson.teacher?.full_name}</Text>
            </View>
          ))
        )}
      </Section>

      {/* Pending Assignments */}
      <Section title="Pending Assignments" icon="document-text-outline" action="View All" onAction={() => router.push('/(education as any)/assignments' as any)}>
        {pendingAssignments.length === 0 ? (
          <Text style={styles.emptyText}>No pending assignments 🎉</Text>
        ) : (
          pendingAssignments.slice(0, 3).map((a, i) => (
            <TouchableOpacity key={i} style={styles.assignmentCard} onPress={() => router.push(`/(education as any)/assignments/${a.id}` as any)}>
              <View style={styles.assignmentLeft}>
                <Text style={styles.assignmentTitle}>{a.title}</Text>
                <Text style={styles.assignmentSubject}>{a.subject?.name} • {a.teacher?.full_name}</Text>
              </View>
              <View style={[styles.dueBadge, isOverdue(a.due_date) && styles.overdueBadge]}>
                <Text style={styles.dueText}>{formatDue(a.due_date)}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </Section>

      {/* Recent Grades */}
      <Section title="Recent Grades" icon="trophy-outline" action="View All" onAction={() => router.push('/(education as any)/grades' as any)}>
        {grades.length === 0 ? (
          <Text style={styles.emptyText}>No grades yet</Text>
        ) : (
          grades.slice(0, 3).map((g, i) => (
            <View key={i} style={styles.gradeRow}>
              <Text style={styles.gradeSubject}>{g.subject?.name}</Text>
              <Text style={[styles.gradeScore, getGradeColor(g.score)]}>{g.score}/{g.max_score}</Text>
              <Text style={styles.gradeLabel}>{g.grade_label || getGradeLabel(g.score, g.max_score)}</Text>
            </View>
          ))
        )}
      </Section>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickAction icon="library-outline" label="Library" onPress={() => router.push('/(education as any)/library' as any)} />
        <QuickAction icon="chatbubble-outline" label="Messages" onPress={() => router.push('/(education as any)/messages' as any)} />
        <QuickAction icon="qr-code-outline" label="Check In" onPress={() => router.push('/(education as any)/qr-checkin' as any)} />
        <QuickAction icon="bus-outline" label="Transport" onPress={() => router.push('/(education as any)/transport' as any)} />
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, icon, action, onAction, children }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={18} color="#374151" />
        <Text style={styles.sectionTitle}>{title}</Text>
        {action && <TouchableOpacity onPress={onAction}><Text style={styles.sectionAction}>{action}</Text></TouchableOpacity>}
      </View>
      {children}
    </View>
  );
}

function QuickAction({ icon, label, onPress }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={24} color="#6366f1" />
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function isOverdue(date) {
  return date && new Date(date) < new Date();
}

function formatDue(date) {
  if (!date) return 'No due';
  const d = new Date(date);
  const diff = Math.ceil((d - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return `${Math.abs(diff)}d overdue`;
  if (diff === 0) return 'Due today';
  return `${diff}d left`;
}

function getGradeColor(score) {
  if (score >= 80) return { color: '#10b981' };
  if (score >= 60) return { color: '#f59e0b' };
  return { color: '#ef4444' };
}

function getGradeLabel(score, max) {
  const pct = (score / max) * 100;
  if (pct >= 80) return 'A';
  if (pct >= 70) return 'B';
  if (pct >= 60) return 'C';
  if (pct >= 50) return 'D';
  return 'E';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 18, color: 'rgba(255,255,255,0.9)', marginTop: 4 },
  headerClass: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 8 },
  sectionAction: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  lessonRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  lessonTime: { width: 80, fontSize: 13, color: '#6b7280', fontWeight: '600' },
  lessonSubject: { flex: 1, fontSize: 14, color: '#111827', fontWeight: '600' },
  lessonTeacher: { fontSize: 12, color: '#6b7280' },
  assignmentCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  assignmentLeft: { flex: 1 },
  assignmentTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  assignmentSubject: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  dueBadge: { backgroundColor: '#e0e7ff', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  overdueBadge: { backgroundColor: '#fee2e2' },
  dueText: { fontSize: 11, color: '#6366f1', fontWeight: '600' },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  gradeSubject: { flex: 1, fontSize: 14, color: '#111827' },
  gradeScore: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  gradeLabel: { fontSize: 12, color: '#6b7280', width: 24, textAlign: 'right' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, marginBottom: 32 },
  quickAction: { width: '22%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickActionLabel: { fontSize: 11, color: '#374151', marginTop: 8, textAlign: 'center' },
});

