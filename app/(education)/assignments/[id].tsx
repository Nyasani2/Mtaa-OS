// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { FileText, Users, Calendar, ChevronRight, BookOpen, Clock } from 'lucide-react-native';

export default function AssignmentDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [assignment, setAssignment] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: assignData } = await supabase
        .from("education_assignments").select("*, education_courses(name), education_classes(name)").eq("id", id).maybeSingle();
      const { data: subData } = await supabase
        .from("education_submissions").select("*, education_students(name)").eq("assignment_id", id).order("submitted_at", { ascending: false });

      setAssignment(assignData);
      setSubmissions(subData || []);
    } catch (e: any) {
      console.error('[AssignmentDetail]', e);
      Alert.alert('Error', e.message || 'Failed to load assignment');
    } finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!assignment) return <View style={styles.center}><Text>Assignment not found</Text></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ChevronRight size={24} color="#1e293b" style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.title}>Assignment</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.detailCard}>
        <View style={styles.cardRow}>
          <FileText size={20} color="#6366f1" />
          <Text style={styles.detailTitle}>{assignment.title || 'Untitled'}</Text>
        </View>
        <Text style={styles.detailDesc}>{assignment.description || 'No description'}</Text>
        <View style={styles.metaRow}>
          <BookOpen size={14} color="#64748b" /><Text style={styles.metaText}>{assignment.education_courses?.name || 'N/A'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Users size={14} color="#64748b" /><Text style={styles.metaText}>Class: {assignment.education_classes?.name || 'N/A'}</Text>
        </View>
        <View style={styles.metaRow}>
          <Calendar size={14} color="#64748b" /><Text style={styles.metaText}>Due: {new Date(assignment.due_date).toLocaleDateString()}</Text>
        </View>
        <View style={styles.metaRow}>
          <Clock size={14} color="#64748b" /><Text style={styles.metaText}>Max Marks: {assignment.max_marks || 0}</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Submissions ({submissions.length})</Text>
      {(submissions || []).map((s: any) => (
        <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(`/education/submissions/${s.id}` as any)}>
          <View style={styles.cardRow}>
            <Users size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{s.education_students?.name || 'Unknown'}</Text>
            <Text style={[styles.badge, s.status === 'graded' ? styles.badgePaid : s.status === 'late' ? styles.badgeRejected : styles.badgePending]}>{s.status}</Text>
          </View>
          <Text style={styles.cardSub}>Submitted: {new Date(s.submitted_at).toLocaleDateString()} · Score: {s.score || 'N/A'}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}

      <TouchableOpacity style={styles.gradeBtn} onPress={() => router.push(`/(education as any)/assignments/${id}/grade` as any)}>
        <Text style={styles.gradeBtnText}>Grade Submissions</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  detailCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  detailTitle: { fontSize: 18, fontWeight: '700', color: '#1e293b', marginLeft: 8 },
  detailDesc: { fontSize: 14, color: '#64748b', marginTop: 8, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  metaText: { fontSize: 12, color: '#64748b' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgePaid: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgePending: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  badgeRejected: { backgroundColor: '#ef444420', color: '#ef4444' },
  gradeBtn: { backgroundColor: '#6366f1', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 16 },
  gradeBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
