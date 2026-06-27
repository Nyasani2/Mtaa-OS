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

interface Class {
  id: string; name: string; grade: string; student_count: number;
}
interface PendingWork {
  id: string; title: string; type: string; count: number; due_date: string;
}

export default function TeacherDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [classes, setClasses] = useState<Class[]>([]);
  const [pending, setPending] = useState<PendingWork[]>([]);
  const [stats, setStats] = useState({ students: 0, classes: 0, assignments: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: teacher } = await supabase
        .from('education_teachers')
        .select('id, institution_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacher) {
        setLoading(false);
        return;
      }

      const { data: cls } = await supabase
        .from('education_classes')
        .select('id, name, grade')
        .eq('teacher_id', teacher.id)
        .limit(5);

      if (cls) {
        const enriched = await Promise.all(
          cls.map(async (c) => {
            const { count } = await supabase
              .from('education_students')
              .select('*', { count: 'exact', head: true })
              .eq('class_id', c.id);
            return { ...c, student_count: count || 0 };
          })
        );
        setClasses(enriched);
        setStats(s => ({ ...s, classes: cls.length }));
      }

      const { data: pend } = await supabase
        .from('education_submissions')
        .select('id, assignment_id, created_at')
        .eq('status', 'submitted')
        .order('created_at', { ascending: false })
        .limit(5);

      if (pend) {
        const enriched = await Promise.all(
          pend.map(async (p) => {
            const { data: a } = await supabase
              .from('education_assignments')
              .select('title, due_date')
              .eq('id', p.assignment_id)
              .maybeSingle();
            return {
              id: p.id,
              title: a?.title || 'Untitled',
              type: 'Submission',
              count: 1,
              due_date: a?.due_date || p.created_at,
            };
          })
        );
        setPending(enriched);
      }

      const { count: stCount } = await supabase
        .from('education_students')
        .select('*', { count: 'exact', head: true })
        .eq('institution_id', teacher.institution_id);
      setStats(s => ({ ...s, students: stCount || 0 }));

    } catch (err) {
      console.error('Teacher dashboard error:', err);
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
        <Text style={styles.headerTitle}>Teacher Portal</Text>
        <Text style={styles.headerSub}>Manage your classes and students</Text>
      </View>

      <View style={styles.statsRow}>
        <StatBox number={stats.students} label="Students" icon="people-outline" />
        <StatBox number={stats.classes} label="Classes" icon="grid-outline" />
        <StatBox number={pending.length} label="To Grade" icon="checkbox-outline" />
      </View>

      <View style={styles.quickRow}>
        <QuickAction icon="add-circle-outline" label="Create Course" onPress={() => router.push('/education/courses/create')} />
        <QuickAction icon="create-outline" label="Assignment" onPress={() => router.push('/education/assignments/create')} />
        <QuickAction icon="clipboard-outline" label="Exam" onPress={() => router.push('/education/exams/create')} />
        <QuickAction icon="checkbox-outline" label="Attendance" onPress={() => router.push('/education/attendance')} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Classes</Text>
        {classes.length === 0 ? (
          <Text style={styles.emptyText}>No classes assigned yet</Text>
        ) : (
          classes.map(c => (
            <TouchableOpacity key={c.id} style={styles.classCard} onPress={() => router.push(`/education/courses/${c.id}`)}>
              <View style={styles.classIcon}>
                <Ionicons name="school" size={24} color="#00d4ff" />
              </View>
              <View style={styles.classInfo}>
                <Text style={styles.className}>{c.name}</Text>
                <Text style={styles.classMeta}>Grade {c.grade} · {c.student_count} students</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#888" />
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Pending to Grade</Text>
        {pending.length === 0 ? (
          <Text style={styles.emptyText}>All caught up!</Text>
        ) : (
          pending.map(p => (
            <TouchableOpacity key={p.id} style={styles.pendingCard} onPress={() => router.push('/education/grades')}>
              <Ionicons name="alert-circle" size={20} color="#ffaa00" />
              <View style={styles.pendingInfo}>
                <Text style={styles.pendingTitle}>{p.title}</Text>
                <Text style={styles.pendingMeta}>{p.type} · Due {new Date(p.due_date).toLocaleDateString()}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ number, label, icon }: { number: number; label: string; icon: string }) {
  return (
    <View style={styles.statBox}>
      <Ionicons name={icon as any} size={24} color="#00d4ff" />
      <Text style={styles.statNumber}>{number}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
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
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#111', marginBottom: 8 },
  statBox: { alignItems: 'center', padding: 12 },
  statNumber: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, backgroundColor: '#111', marginBottom: 8 },
  quickBtn: { alignItems: 'center', padding: 12 },
  quickLabel: { color: '#ccc', fontSize: 12, marginTop: 6 },
  section: { padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  classCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  classIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' },
  classInfo: { flex: 1, marginLeft: 12 },
  className: { color: '#fff', fontSize: 16, fontWeight: '600' },
  classMeta: { color: '#888', fontSize: 13, marginTop: 2 },
  pendingCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  pendingInfo: { marginLeft: 12, flex: 1 },
  pendingTitle: { color: '#fff', fontSize: 15, fontWeight: '500' },
  pendingMeta: { color: '#888', fontSize: 12, marginTop: 2 },
});
