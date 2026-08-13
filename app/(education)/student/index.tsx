// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function StudentHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    loadStudentData(user.id);
  }, [user?.id]);

  const loadStudentData = async (uid: string) => {
    setLoading(true);
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const today = dayNames[new Date().getDay()];

    const [{ data: enr }, { data: asn }, { data: grd }, { data: tt }] = await Promise.all([
      supabase.from('education_enrollments').select('id, class:class_id (name, subject:subject_id (name))').eq('student_profile_id', uid),
      supabase.from('education_assignments').select('id, title, due_date, class:class_id (name)').eq('status', 'published').order('due_date', { ascending: true }).limit(5),
      supabase.from('education_grades').select('id, score, total_marks, grade_label, assessment:assessment_id (title)').eq('student_profile_id', uid).order('created_at', { ascending: false }).limit(5),
      supabase.from('education_timetable').select('id, start_time, end_time, subject:subject_id (name), class:class_id (name)').eq('day', today).order('start_time', { ascending: true }).limit(5),
    ]);

    setEnrollments(enr || []);
    setAssignments(asn || []);
    setGrades(grd || []);
    setTodayClasses(tt || []);
    setLoading(false);
  };

  const QuickBtn = ({ icon, label, color, onPress }: any) => (
    <TouchableOpacity style={[styles.qBtn, { backgroundColor: color + '20' }]} onPress={onPress}>
      <Ionicons name={icon} size={22} color={color} />
      <Text style={[styles.qLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading your student workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Student Home</Text>
        <Text style={styles.headerSub}>{enrollments.length} Enrolled Classes</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          <QuickBtn icon="book-outline" label="My Courses" color="#3b82f6" onPress={() => router.push('/(education as any)/courses' as any)} />
          <QuickBtn icon="clipboard-outline" label="Assignments" color="#f59e0b" onPress={() => router.push('/(education as any)/assignments' as any)} />
          <QuickBtn icon="trophy-outline" label="Grades" color="#10b981" onPress={() => router.push('/(education as any)/results' as any)} />
          <QuickBtn icon="qr-code-outline" label="My QR" color="#8b5cf6" onPress={() => router.push('/(education as any)/student/qr-display' as any)} />
          <QuickBtn icon="time-outline" label="Timetable" color="#6366f1" onPress={() => router.push('/(education as any)/timetable' as any)} />
          <QuickBtn icon="bus-outline" label="Transport" color="#0ea5e9" onPress={() => router.push('/(education as any)/transport/track' as any)} />
          <QuickBtn icon="videocam-outline" label="Live" color="#ef4444" onPress={() => router.push('/(education as any)/live-class' as any)} />
          <QuickBtn icon="library-outline" label="Library" color="#8b5cf6" onPress={() => router.push('/(education as any)/library' as any)} />
        </ScrollView>

        <Text style={styles.sectionTitle}>Today's Classes</Text>
        {todayClasses.length === 0 ? (
          <Text style={styles.emptyText}>No classes scheduled for today.</Text>
        ) : todayClasses.map((c: any) => (
          <View key={c.id} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: '#3b82f620' }]}>
                <Ionicons name="time-outline" size={18} color="#3b82f6" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.cardTitle}>{c.subject?.name || 'Subject'}</Text>
                <Text style={styles.cardMeta}>{c.class?.name} · {c.start_time?.slice(0,5)} - {c.end_time?.slice(0,5)}</Text>
              </View>
            </View>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Assignments Due</Text>
        {assignments.length === 0 ? (
          <Text style={styles.emptyText}>No upcoming assignments.</Text>
        ) : assignments.map((a: any) => (
          <TouchableOpacity key={a.id} style={styles.card} onPress={() => router.push(`/(education as any)/assignments/${a.id}` as any)}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={[styles.iconCircle, { backgroundColor: '#f59e0b20' }]}>
                <Ionicons name="clipboard-outline" size={18} color="#f59e0b" />
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardMeta}>{a.class?.name} · Due {new Date(a.due_date).toLocaleDateString()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </View>
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionTitle}>Recent Grades</Text>
        {grades.length === 0 ? (
          <Text style={styles.emptyText}>No grades yet.</Text>
        ) : grades.map((g: any) => (
          <View key={g.id} style={styles.card}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{g.assessment?.title || 'Assessment'}</Text>
              </View>
              <Text style={{ fontWeight: 'bold', color: g.score >= (g.total_marks * 0.6) ? '#10b981' : '#ef4444' }}>
                {g.score}/{g.total_marks} {g.grade_label}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#1e3a5f', paddingTop: 50, paddingHorizontal: 16, paddingBottom: 20 },
  backBtn: { marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  qBtn: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, marginRight: 10, minWidth: 72 },
  qLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  iconCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  emptyText: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
});
