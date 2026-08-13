// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationResults() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [grades, setGrades] = useState<any[]>([]);
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [classes, setClasses] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    init();
  }, [user?.id]);

  const init = async () => {
    setLoading(true);
    const uid = user!.id;

    // Detect primary role
    const [{ data: st }, { data: te }, { data: pa }] = await Promise.all([
      supabase.from('education_enrollments').select('id').eq('student_profile_id', uid).limit(1),
      supabase.from('education_teachers').select('id').eq('teacher_profile_id', uid).limit(1),
      supabase.from('education_parents').select('id, student_profile_id').eq('parent_profile_id', uid),
    ]);

    if (st && st.length > 0) {
      setRole('student');
      await loadStudentGrades(uid);
    } else if (te && te.length > 0) {
      setRole('teacher');
      await loadTeacherClasses(uid);
    } else if (pa && pa.length > 0) {
      setRole('parent');
      const kids = pa.map((p: any) => p.student_profile_id).filter(Boolean);
      setChildren(kids);
      if (kids.length > 0) {
        setSelectedChild(kids[0]);
        await loadStudentGrades(kids[0]);
      }
    } else {
      setRole(null);
    }
    setLoading(false);
  };

  const loadStudentGrades = async (profileId: string) => {
    const { data } = await supabase
      .from('education_grades')
      .select(`
        id, score, total_marks, grade_label, feedback, created_at,
        assessment:assessment_id (title, type, subject:subject_id (name)),
        class:class_id (name)
      `)
      .eq('student_profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(50);
    setGrades(data || []);
  };

  const loadTeacherClasses = async (profileId: string) => {
    const { data } = await supabase
      .from('education_classes')
      .select('id, name, subject:subject_id (name)')
      .eq('teacher_profile_id', profileId);
    setClasses(data || []);
  };

  const gradeColor = (score: number, total: number) => {
    const pct = total > 0 ? (score / total) * 100 : 0;
    if (pct >= 80) return '#10b981';
    if (pct >= 60) return '#f59e0b';
    return '#ef4444';
  };

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={{ color: '#94a3b8', marginTop: 12 }}>Loading results...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Results</Text>
        <Text style={styles.headerSub}>
          {role ? role.charAt(0).toUpperCase() + role.slice(1) + ' View' : 'Not enrolled'}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {role === 'parent' && children.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
            {children.map((childId) => (
              <TouchableOpacity
                key={childId}
                style={[styles.childChip, selectedChild === childId && styles.childChipActive]}
                onPress={() => { setSelectedChild(childId); loadStudentGrades(childId); }}
              >
                <Ionicons name="person-circle-outline" size={16} color={selectedChild === childId ? '#fff' : '#475569'} />
                <Text style={[styles.childChipText, selectedChild === childId && styles.childChipTextActive]}>Child</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {role === 'teacher' && (
          <View>
            <Text style={styles.sectionTitle}>My Classes</Text>
            {classes.length === 0 ? (
              <Text style={styles.emptyText}>No classes assigned.</Text>
            ) : classes.map((cls: any) => (
              <View key={cls.id} style={styles.resultCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.iconCircle, { backgroundColor: '#3b82f620' }]}>
                    <Ionicons name="people-outline" size={20} color="#3b82f6" />
                  </View>
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text style={styles.cardTitle}>{cls.name}</Text>
                    <Text style={styles.cardMeta}>{cls.subject?.name || 'No subject'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => router.push(`/(education as any)/grades?class_id=${cls.id}` as any)}>
                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>Gradebook</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {(role === 'student' || role === 'parent') && (
          <View>
            <Text style={styles.sectionTitle}>Recent Grades</Text>
            {grades.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons name="document-text-outline" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>No grades available yet.</Text>
              </View>
            ) : grades.map((g: any) => (
              <View key={g.id} style={styles.resultCard}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{g.assessment?.title || 'Assessment'}</Text>
                    <Text style={styles.cardMeta}>
                      {g.assessment?.subject?.name || 'Subject'} · {g.class?.name || 'Class'}
                    </Text>
                    {g.feedback ? <Text style={styles.feedback}>“{g.feedback}”</Text> : null}
                  </View>
                  <View style={[styles.scoreBadge, { backgroundColor: gradeColor(g.score, g.total_marks) + '20' }]}>
                    <Text style={[styles.scoreText, { color: gradeColor(g.score, g.total_marks) }]}>
                      {g.score}/{g.total_marks}
                    </Text>
                    <Text style={[styles.gradeLabel, { color: gradeColor(g.score, g.total_marks) }]}>
                      {g.grade_label || ''}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}

        {role === null && (
          <View style={styles.emptyBox}>
            <Ionicons name="alert-circle-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyText}>You are not enrolled in any education program.</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(education as any)/schools' as any)}>
              <Text style={styles.actionBtnText}>Find a School</Text>
            </TouchableOpacity>
          </View>
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b', marginBottom: 12 },
  resultCard: { backgroundColor: '#fff', borderRadius: 14, padding: 16, marginBottom: 10 },
  iconCircle: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#1e293b' },
  cardMeta: { fontSize: 13, color: '#64748b', marginTop: 2 },
  feedback: { fontSize: 13, color: '#475569', marginTop: 6, fontStyle: 'italic' },
  scoreBadge: { borderRadius: 12, paddingVertical: 8, paddingHorizontal: 14, alignItems: 'center' },
  scoreText: { fontSize: 16, fontWeight: 'bold' },
  gradeLabel: { fontSize: 11, fontWeight: '600', marginTop: 2 },
  childChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 14, marginRight: 8 },
  childChipActive: { backgroundColor: '#3b82f6' },
  childChipText: { fontSize: 13, color: '#475569', marginLeft: 6, fontWeight: '600' },
  childChipTextActive: { color: '#fff' },
  emptyBox: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12 },
  actionBtn: { backgroundColor: '#3b82f6', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16 },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});
