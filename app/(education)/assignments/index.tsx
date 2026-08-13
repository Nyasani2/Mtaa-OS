// @ts-nocheck

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEducation } from '@/domains/education/hooks/useEducation';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudentAssignments() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { getStudentByUserId, getStudentAssignments, submitAssignment } = useEducation();
  const [student, setStudent] = useState<any>(null);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, submitted, graded

  const loadData = async () => {
    if (!user?.id) return;
    const s = await getStudentByUserId(user.id);
    setStudent(s);
    if (s) {
      const a = await getStudentAssignments(s.id);
      setAssignments(a || []);
    }
  };

  useEffect(() => { loadData(); }, [user?.id]);

  const filtered = assignments.filter((a: any) => {
    if (filter === 'pending') return a.status === 'pending';
    if (filter === 'submitted') return a.status === 'submitted';
    if (filter === 'graded') return a.status === 'graded';
    return true;
  });

  const handleSubmit = async (assignmentId) => {
    // Navigate to submission screen
    router.push(`/(education as any)/assignments/${assignmentId}/submit` as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assignments</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.filterRow}>
        {['all','pending','submitted','graded'].map((f: any) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterBtnActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}>
        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No {filter} assignments</Text>
          </View>
        ) : (
          filtered.map((a: any) => (
            <TouchableOpacity key={a.id} style={styles.card} onPress={() => router.push(`/(education as any)/assignments/${a.id}` as any)}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <StatusBadge status={a.status} />
              </View>
              <Text style={styles.cardSubject}>{a.subject?.name} • {a.teacher?.full_name}</Text>
              <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.dueDate, isOverdue(a.due_date) && styles.overdue]}>
                  <Ionicons name="time-outline" size={12} /> Due: {formatDate(a.due_date)}
                </Text>
                {a.status === 'pending' && (
                  <TouchableOpacity style={styles.submitBtn} onPress={() => handleSubmit(a.id)}>
                    <Text style={styles.submitBtnText}>Submit</Text>
                  </TouchableOpacity>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function StatusBadge({ status }) {
  const colors = {
    pending: { bg: '#fef3c7', text: '#d97706' },
    submitted: { bg: '#dbeafe', text: '#2563eb' },
    graded: { bg: '#d1fae5', text: '#059669' },
    late: { bg: '#fee2e2', text: '#dc2626' },
  };
  const c = colors[status] || colors.pending;
  return (
    <View style={[styles.badge, { backgroundColor: c.bg }]}>
      <Text style={[styles.badgeText, { color: c.text }]}>{status?.toUpperCase()}</Text>
    </View>
  );
}

function isOverdue(date) {
  return date && new Date(date) < new Date();
}

function formatDate(date) {
  if (!date) return 'No date';
  return new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#fff' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#111827' },
  filterRow: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#f3f4f6' },
  filterBtnActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 12, borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827', flex: 1 },
  cardSubject: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  cardDesc: { fontSize: 14, color: '#374151', lineHeight: 20, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueDate: { fontSize: 12, color: '#6b7280' },
  overdue: { color: '#ef4444', fontWeight: '600' },
  submitBtn: { backgroundColor: '#6366f1', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  submitBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#9ca3af', marginTop: 16, fontSize: 16 },
});

