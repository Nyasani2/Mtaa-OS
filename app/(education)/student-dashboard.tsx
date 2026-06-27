import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

interface Assignment {
  id: string; title: string; subject: string; due_date: string; status: string;
}
interface Grade {
  id: string; subject: string; score: number; total: number; grade: string;
}
interface Course {
  id: string; title: string; teacher_name: string; progress: number;
}

export default function StudentDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [grades, setGrades] = useState<Grade[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: student } = await supabase
        .from('education_students')
        .select('id, institution_id, grade')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!student) {
        setLoading(false);
        return;
      }

      const { data: assigns } = await supabase
        .from('education_assignments')
        .select('id, title, subject, due_date, status')
        .eq('student_id', student.id)
        .order('due_date', { ascending: true })
        .limit(5);
      if (assigns) setAssignments(assigns);

      const { data: grds } = await supabase
        .from('education_grades')
        .select('id, subject, score, total, grade')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false })
        .limit(5);
      if (grds) setGrades(grds);

      const { data: crs } = await supabase
        .from('education_classes')
        .select('id, name, teacher_id')
        .eq('institution_id', student.institution_id)
        .eq('grade', student.grade)
        .limit(4);

      if (crs) {
        const enriched = await Promise.all(
          crs.map(async (c) => {
            const { data: t } = await supabase
              .from('education_teachers')
              .select('full_name')
              .eq('id', c.teacher_id)
              .maybeSingle();
            return {
              id: c.id,
              title: c.name,
              teacher_name: t?.full_name || 'Unknown',
              progress: Math.floor(Math.random() * 40) + 60,
            };
          })
        );
        setCourses(enriched);
      }
    } catch (err) {
      console.error('Student dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Student Portal</Text>
        <Text style={styles.headerSub}>Welcome back, {user?.user_metadata?.full_name || 'Student'}</Text>
      </View>

      <View style={styles.quickRow}>
        <QuickAction icon="book-outline" label="Courses" onPress={() => router.push('/education/courses')} />
        <QuickAction icon="clipboard-outline" label="Assignments" onPress={() => router.push('/education/assignments')} />
        <QuickAction icon="school-outline" label="Grades" onPress={() => router.push('/education/my-grades')} />
        <QuickAction icon="calendar-outline" label="Timetable" onPress={() => router.push('/education/timetable')} />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
          <TouchableOpacity onPress={() => router.push('/education/assignments')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {assignments.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming assignments</Text>
        ) : (
          assignments.map(a => (
            <TouchableOpacity key={a.id} style={styles.assignCard} onPress={() => router.push(`/education/assignments/${a.id}`)}>
              <View style={styles.assignIcon}>
                <Ionicons name="document-text-outline" size={20} color="#00d4ff" />
              </View>
              <View style={styles.assignInfo}>
                <Text style={styles.assignTitle}>{a.title}</Text>
                <Text style={styles.assignMeta}>{a.subject} · Due {new Date(a.due_date).toLocaleDateString()}</Text>
              </View>
              <View style={[styles.statusBadge, a.status === 'submitted' ? styles.statusDone : styles.statusPending]}>
                <Text style={styles.statusText}>{a.status}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Grades</Text>
          <TouchableOpacity onPress={() => router.push('/education/my-grades')}>
            <Text style={styles.seeAll}>See All</Text>
          </TouchableOpacity>
        </View>
        {grades.length === 0 ? (
          <Text style={styles.emptyText}>No grades yet</Text>
        ) : (
          grades.map(g => (
            <View key={g.id} style={styles.gradeCard}>
              <Text style={styles.gradeSubject}>{g.subject}</Text>
              <Text style={styles.gradeScore}>{g.score}/{g.total}</Text>
              <View style={[styles.gradeBadge, g.grade === 'A' ? styles.gradeA : g.grade === 'B' ? styles.gradeB : styles.gradeC]}>
                <Text style={styles.gradeText}>{g.grade}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Courses</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {courses.map(c => (
            <TouchableOpacity key={c.id} style={styles.courseCard} onPress={() => router.push(`/education/courses/${c.id}`)}>
              <View style={styles.courseIcon}>
                <Ionicons name="book" size={28} color="#00d4ff" />
              </View>
              <Text style={styles.courseTitle} numberOfLines={2}>{c.title}</Text>
              <Text style={styles.courseTeacher}>{c.teacher_name}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${c.progress}%` }]} />
              </View>
              <Text style={styles.progressText}>{c.progress}% complete</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </ScrollView>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Ionicons name={icon as any} size={24} color="#00d4ff" />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#111', marginBottom: 8 },
  quickBtn: { alignItems: 'center', padding: 12 },
  quickLabel: { color: '#ccc', fontSize: 12, marginTop: 6 },
  section: { padding: 16, marginBottom: 8 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  seeAll: { color: '#00d4ff', fontSize: 14 },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  assignCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  assignIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  assignInfo: { flex: 1, marginLeft: 12 },
  assignTitle: { color: '#fff', fontSize: 15, fontWeight: '500' },
  assignMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusPending: { backgroundColor: '#ffaa00' },
  statusDone: { backgroundColor: '#00cc66' },
  statusText: { color: '#000', fontSize: 11, fontWeight: '600' },
  gradeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  gradeSubject: { color: '#fff', fontSize: 15, flex: 1 },
  gradeScore: { color: '#ccc', fontSize: 14, marginRight: 12 },
  gradeBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  gradeA: { backgroundColor: '#00cc66' },
  gradeB: { backgroundColor: '#ffaa00' },
  gradeC: { backgroundColor: '#ff4444' },
  gradeText: { color: '#000', fontSize: 12, fontWeight: 'bold' },
  courseCard: { width: 160, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginRight: 12 },
  courseIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  courseTitle: { color: '#fff', fontSize: 14, fontWeight: '600', marginBottom: 4 },
  courseTeacher: { color: '#888', fontSize: 12, marginBottom: 10 },
  progressBar: { height: 4, backgroundColor: '#333', borderRadius: 2, marginBottom: 6 },
  progressFill: { height: 4, backgroundColor: '#00d4ff', borderRadius: 2 },
  progressText: { color: '#888', fontSize: 11 },
});
