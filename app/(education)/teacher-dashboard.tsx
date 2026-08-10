import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/lib/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { LinearGradient } from 'expo-linear-gradient';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getTeacherByUserId, getTeacherClasses, getTeacherAssignments, getPendingSubmissions } = useEducation();
  const [teacher, setTeacher] = useState(null);
  const [classes, setClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!user?.id) return;
    const t = await getTeacherByUserId(user.id);
    setTeacher(t);
    if (t) {
      const [c, a, s] = await Promise.all([
        getTeacherClasses(t.id),
        getTeacherAssignments(t.id),
        getPendingSubmissions(t.id),
      ]);
      setClasses(c || []);
      setAssignments(a || []);
      setSubmissions(s || []);
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const pendingCount = submissions.filter(s => s.status === 'submitted').length;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
      <LinearGradient colors={['#059669', '#10b981']} style={styles.header}>
        <Text style={styles.headerTitle}>Teacher Portal</Text>
        <Text style={styles.headerSubtitle}>{teacher?.full_name || 'Loading...'}</Text>
        <Text style={styles.headerClass}>{teacher?.institution?.name || ''} • {teacher?.subjects?.join(', ') || ''}</Text>
      </LinearGradient>

      <View style={styles.statsRow}>
        <StatCard icon="people-outline" label="My Classes" value={classes.length} color="#059669" />
        <StatCard icon="document-text-outline" label="Assignments" value={assignments.length} color="#6366f1" />
        <StatCard icon="mail-unread-outline" label="To Grade" value={pendingCount} color="#f59e0b" />
      </View>

      <Section title="My Classes" icon="school-outline" action="Manage" onAction={() => router.push('/(education)/classes')}>
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>No classes assigned yet</Text>
        ) : (
          classes.map((cls, i) => (
            <TouchableOpacity key={i} style={styles.classRow} onPress={() => router.push(`/(education)/class/${cls.id}`)}>
              <View style={styles.classIcon}>
                <Text style={styles.classIconText}>{cls.name?.charAt(0)}</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{cls.name}</Text>
                <Text style={styles.classMeta}>{cls.student_count || 0} students • {cls.stream || ''}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          ))
        )}
      </Section>

      <Section title="Pending Submissions" icon="alert-circle-outline" action="Grade All" onAction={() => router.push('/(education)/assignments')}>
        {submissions.length === 0 ? (
          <Text style={styles.emptyText}>All caught up! 🎉</Text>
        ) : (
          submissions.slice(0, 5).map((sub, i) => (
            <View key={i} style={styles.submissionRow}>
              <View>
                <Text style={styles.subStudent}>{sub.student?.full_name}</Text>
                <Text style={styles.subAssignment}>{sub.assignment?.title}</Text>
              </View>
              <Text style={styles.subDate}>{formatDate(sub.submitted_at)}</Text>
            </View>
          ))
        )}
      </Section>

      <View style={styles.quickActions}>
        <QuickAction icon="add-circle-outline" label="Create Assignment" onPress={() => router.push('/(education)/assignments/create')} color="#6366f1" />
        <QuickAction icon="checkbox-outline" label="Mark Attendance" onPress={() => router.push('/(education)/attendance')} color="#059669" />
        <QuickAction icon="calendar-outline" label="Timetable" onPress={() => router.push('/(education)/timetable')} color="#f59e0b" />
        <QuickAction icon="chatbubble-outline" label="Messages" onPress={() => router.push('/(education)/messages')} color="#8b5cf6" />
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

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
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
  classRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  classIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#e0e7ff', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  classIconText: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  classInfo: { flex: 1 },
  className: { fontSize: 15, fontWeight: '600', color: '#111827' },
  classMeta: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  submissionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  subStudent: { fontSize: 14, fontWeight: '600', color: '#111827' },
  subAssignment: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  subDate: { fontSize: 12, color: '#9ca3af' },
  quickActions: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, marginBottom: 32 },
  quickAction: { width: '47%', backgroundColor: '#fff', borderRadius: 16, padding: 16, alignItems: 'center', flexDirection: 'row', gap: 12, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  quickActionLabel: { fontSize: 13, fontWeight: '600' },
});
