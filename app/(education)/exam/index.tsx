// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, FileText, Clock, CheckCircle, Plus, ChevronRight } from 'lucide-react-native';

export default function ExamScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [exams, setExams] = useState<any[]>([]);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, upcoming: 0, completed: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const now = new Date().toISOString();
      const { data: examData } = await supabase
        .from("education_exams").select("*, education_courses(name)").eq("institution_id", instId).order("exam_date", { ascending: true }).limit(50);
      const { data: resultData } = await supabase
        .from("education_exam_results").select("*, education_students(name), education_exams(title)").eq("institution_id", instId).order("created_at", { ascending: false }).limit(30);

      setExams(examData || []);
      setResults(resultData || []);
      setStats({
        total: examData?.length || 0,
        upcoming: (examData || []).filter((x: any) => x.exam_date > now).length,
        completed: (examData || []).filter((x: any) => x.exam_date <= now).length,
      });
    } catch (e: any) {
      console.error('[Exam]', e);
      Alert.alert('Error', e.message || 'Failed to load exams');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Exams</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education as any)/exams/create' as any)}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>Schedule</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <FileText size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.upcoming}</Text>
          <Text style={styles.statLabel}>Upcoming</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <CheckCircle size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.completed}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Exam Schedule</Text>
      {(exams || []).map((e: any) => (
        <TouchableOpacity key={e.id} style={styles.card} onPress={() => router.push(`/(education as any)/exams/${e.id}` as any)}>
          <View style={styles.cardRow}>
            <FileText size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{e.title || 'Untitled Exam'}</Text>
            <Text style={[styles.badge, e.exam_date > new Date().toISOString() ? styles.badgePending : styles.badgePaid]}>{e.exam_date > new Date().toISOString() ? 'Upcoming' : 'Completed'}</Text>
          </View>
          <Text style={styles.cardSub}>Course: {e.education_courses?.name || 'N/A'} · Date: {new Date(e.exam_date).toLocaleDateString()}</Text>
          <Text style={styles.cardSub}>Duration: {e.duration_minutes || 0}min · Max: {e.max_marks || 0} marks</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>Recent Results</Text>
      {(results || []).map((r: any) => (
        <TouchableOpacity key={r.id} style={styles.card} onPress={() => router.push(`/(education as any)/exam-results/${r.id}` as any)}>
          <View style={styles.cardRow}>
            <FileText size={18} color="#22c55e" />
            <Text style={styles.cardTitle}>{r.education_students?.name || 'Unknown'}</Text>
            <Text style={styles.cardAmount}>{r.marks_obtained || 0}/{r.education_exams?.max_marks || 0}</Text>
          </View>
          <Text style={styles.cardSub}>{r.education_exams?.title || 'Exam'} · Grade: {r.grade || 'N/A'}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc', padding: 16 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#1e293b' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#6366f1', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, gap: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardAmount: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgePaid: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgePending: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
