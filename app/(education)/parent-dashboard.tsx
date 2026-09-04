// @ts-nocheck
import React, { useState, useEffect } from 'react';

import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';

export default function ParentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getParentConnections, getStudentGrades, getStudentAttendance, getStudentAssignments } = useEducation();
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(null);
  const [grades, setGrades] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    const connections = await getParentConnections(user.id);
    const kids = connections?.map((c: any) => c.student) || [];
    setChildren(kids);
    if (kids.length > 0 && !selectedChild) {
      setSelectedChild(kids[0]);
      await loadChildData(kids[0].id);
    }
  };

  const loadChildData = async (studentId) => {
    const [g, a, as] = await Promise.all([
      getStudentGrades(studentId),
      getStudentAttendance(studentId),
      getStudentAssignments(studentId),
    ]);
    setGrades(g || []);
    setAttendance(a || []);
    setAssignments(as || []);
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const attendanceRate = attendance.length > 0
    ? Math.round((attendance.filter((a: any) => a.status === 'present').length / attendance.length) * 100)
    : 0;

  const pendingAssignments = assignments.filter((a: any) => a.status === 'pending');

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      <LinearGradient colors={['#8b5cf6', '#a78bfa']} style={styles.header}>
        <Text style={styles.headerTitle}>Parent Portal</Text>
        <Text style={styles.headerSubtitle}>{user?.email || 'Parent'}</Text>
      </LinearGradient>

      {/* Child Selector */}
      {children.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childSelector}>
          {children.map((child: any) => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childChip, selectedChild?.id === child.id && styles.childChipActive]}
              onPress={() => { setSelectedChild(child); loadChildData(child.id); }}
            >
              <View style={styles.childAvatar}>
                <Text style={styles.childAvatarText}>{child.full_name?.charAt(0)}</Text>
              </View>
              <Text style={[styles.childName, selectedChild?.id === child.id && styles.childNameActive]}>{child.full_name}</Text>
              <Text style={styles.childClass}>{child.current_class?.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedChild && (
        <>
          {/* Stats */}
          <View style={styles.statsRow}>
            <StatCard icon="school-outline" label="Attendance" value={`${attendanceRate}%`} color="#8b5cf6" />
            <StatCard icon="document-text-outline" label="Pending" value={pendingAssignments.length} color="#f59e0b" />
            <StatCard icon="trophy-outline" label="Avg Grade" value={calculateAvg(grades)} color="#10b981" />
          </View>

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

          {/* Pending Assignments */}
          <Section title="Pending Assignments" icon="alert-circle-outline" action="View All" onAction={() => router.push('/(education as any)/assignments' as any)}>
            {pendingAssignments.length === 0 ? (
              <Text style={styles.emptyText}>All caught up! 🎉</Text>
            ) : (
              pendingAssignments.slice(0, 3).map((a, i) => (
                <View key={i} style={styles.assignmentRow}>
                  <Text style={styles.assignmentTitle}>{a.title}</Text>
                  <Text style={styles.assignmentDue}>Due: {formatDate(a.due_date)}</Text>
                </View>
              ))
            )}
          </Section>

          {/* Attendance Summary */}
          <Section title="Attendance This Term" icon="calendar-outline">
            <View style={styles.attendanceBar}>
              <View style={[styles.attendanceFill, { width: `${attendanceRate}%`, backgroundColor: attendanceRate >= 80 ? '#10b981' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444' }]} />
            </View>
            <Text style={styles.attendanceText}>{attendance.filter((a: any) => a.status === 'present').length} present out of {attendance.length} days</Text>
          </Section>
        </>
      )}

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <QuickAction icon="card-outline" label="Pay Fees" onPress={() => router.push('/(education as any)/fees' as any)} color="#8b5cf6" />
        <QuickAction icon="chatbubble-outline" label="Message Teacher" onPress={() => router.push('/(education as any)/messages' as any)} color="#6366f1" />
        <QuickAction icon="bus-outline" label="Transport" onPress={() => router.push('/(education as any)/transport' as any)} color="#059669" />
        <QuickAction icon="qr-code-outline" label="QR Check-in" onPress={() => router.push('/(education as any)/qr-checkin' as any)} color="#f59e0b" />
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

function QuickAction({ icon, label, onPress, color }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={[styles.quickActionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function calculateAvg(grades) {
  if (!grades?.length) return 'N/A';
  const avg = grades.reduce((sum, g) => sum + (g.score / g.max_score), 0) / grades.length;
  return `${Math.round(avg * 100)}%`;
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

function formatDate(date) {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { padding: 24, paddingTop: 60 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  childSelector: { padding: 16, backgroundColor: '#fff' },
  childChip: { alignItems: 'center', marginRight: 16, padding: 12, borderRadius: 16, backgroundColor: '#f3f4f6' },
  childChipActive: { backgroundColor: '#ede9fe' },
  childAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#ddd6fe', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  childAvatarText: { fontSize: 20, fontWeight: '700', color: '#7c3aed' },
  childName: { fontSize: 14, fontWeight: '600', color: '#374151' },
  childNameActive: { color: '#7c3aed' },
  childClass: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderTopWidth: 3, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  section: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 16, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#111827', marginLeft: 8 },
  sectionAction: { fontSize: 13, color: '#6366f1', fontWeight: '600' },
  emptyText: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 16 },
  gradeRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  gradeSubject: { flex: 1, fontSize: 14, color: '#111827' },
  gradeScore: { fontSize: 16, fontWeight: '700', marginRight: 8 },
  gradeLabel: { fontSize: 12, color: '#6b7280', width: 24, textAlign: 'right' },
  assignmentRow: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  assignmentTitle: { fontSize: 14, fontWeight: '600', color: '#111827' },
  assignmentDue: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  attendanceBar: { height: 12, backgroundColor: '#e5e7eb', borderRadius: 6, overflow: 'hidden', marginBottom: 8 },
  attendanceFill: { height: '100%', borderRadius: 6 },
  attendanceText: { fontSize: 13, color: '#6b7280' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, marginBottom: 32 },
  quickAction: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickActionLabel: { fontSize: 13, fontWeight: '600' },
});

