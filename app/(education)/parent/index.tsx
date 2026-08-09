import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function ParentHome() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<any>(null);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [grades, setGrades] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    loadChildren(user.id);
  }, [user?.id]);

  const loadChildren = async (uid: string) => {
    setLoading(true);
    const { data: links } = await supabase
      .from('education_parents')
      .select('id, student_profile_id, child:student_profile_id (id, full_name, avatar_url)')
      .eq('parent_profile_id', uid);

    const kids = (links || []).map((l: any) => l.child).filter(Boolean);
    setChildren(kids);
    if (kids.length > 0) {
      setSelectedChild(kids[0]);
      await loadChildData(kids[0].id);
    }
    setLoading(false);
  };

  const loadChildData = async (childId: string) => {
    const [{ data: att }, { data: grd }, { data: asn }] = await Promise.all([
      supabase.from('education_attendance').select('id, status, date, class:class_id (name)').eq('student_profile_id', childId).order('date', { ascending: false }).limit(7),
      supabase.from('education_grades').select('id, score, total_marks, grade_label, assessment:assessment_id (title)').eq('student_profile_id', childId).order('created_at', { ascending: false }).limit(5),
      supabase.from('education_assignments').select('id, title, due_date, class:class_id (name)').eq('status', 'published').order('due_date', { ascending: true }).limit(5),
    ]);
    setAttendance(att || []);
    setGrades(grd || []);
    setAssignments(asn || []);
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
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading parent workspace...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Parent Home</Text>
        <Text style={styles.headerSub}>{children.length} Children</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {children.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {children.map((child) => (
              <TouchableOpacity
                key={child.id}
                style={[styles.childChip, selectedChild?.id === child.id && styles.childChipActive]}
                onPress={() => { setSelectedChild(child); loadChildData(child.id); }}
              >
                <Ionicons name="person-circle-outline" size={18} color={selectedChild?.id === child.id ? '#fff' : '#475569'} />
                <Text style={[styles.childChipText, selectedChild?.id === child.id && styles.childChipTextActive]}>
                  {child.full_name || 'Child'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {children.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>No children linked to your account.</Text>
          </View>
        ) : (
          <>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 6 }}>
              <QuickBtn icon="school-outline" label="Attendance" color="#3b82f6" onPress={() => router.push('/(education)/attendance')} />
              <QuickBtn icon="trophy-outline" label="Grades" color="#10b981" onPress={() => router.push('/(education)/results')} />
              <QuickBtn icon="clipboard-outline" label="Assignments" color="#f59e0b" onPress={() => router.push('/(education)/assignments')} />
              <QuickBtn icon="time-outline" label="Timetable" color="#6366f1" onPress={() => router.push('/(education)/timetable')} />
              <QuickBtn icon="bus-outline" label="Transport" color="#0ea5e9" onPress={() => router.push('/(education)/transport/track')} />
              <QuickBtn icon="cash-outline" label="Fees" color="#8b5cf6" onPress={() => router.push('/(education)/school/fees')} />
            </ScrollView>

            <Text style={styles.sectionTitle}>Recent Attendance</Text>
            {attendance.length === 0 ? (
              <Text style={styles.emptyText}>No attendance records.</Text>
            ) : attendance.map((a: any) => (
              <View key={a.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={styles.cardTitle}>{a.class?.name || 'Class'}</Text>
                  <Text style={[styles.badge, { color: a.status === 'present' ? '#10b981' : a.status === 'absent' ? '#ef4444' : '#f59e0b' }]}>
                    {a.status?.toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.cardMeta}>{new Date(a.date).toLocaleDateString()}</Text>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Recent Grades</Text>
            {grades.length === 0 ? (
              <Text style={styles.emptyText}>No grades yet.</Text>
            ) : grades.map((g: any) => (
              <View key={g.id} style={styles.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={styles.cardTitle}>{g.assessment?.title || 'Assessment'}</Text>
                  <Text style={{ fontWeight: 'bold', color: g.score >= (g.total_marks * 0.6) ? '#10b981' : '#ef4444' }}>
                    {g.score}/{g.total_marks}
                  </Text>
                </View>
              </View>
            ))}

            <Text style={styles.sectionTitle}>Upcoming Assignments</Text>
            {assignments.length === 0 ? (
              <Text style={styles.emptyText}>No upcoming assignments.</Text>
            ) : assignments.map((a: any) => (
              <View key={a.id} style={styles.card}>
                <Text style={styles.cardTitle}>{a.title}</Text>
                <Text style={styles.cardMeta}>{a.class?.name} · Due {new Date(a.due_date).toLocaleDateString()}</Text>
              </View>
            ))}
          </>
        )}
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
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8 },
  childChipActive: { backgroundColor: '#3b82f6' },
  childChipText: { fontSize: 13, color: '#475569', marginLeft: 6, fontWeight: '600' },
  childChipTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginTop: 18, marginBottom: 10 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#1e293b' },
  cardMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },
  badge: { fontSize: 11, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 13, color: '#94a3b8', marginBottom: 12 },
});
