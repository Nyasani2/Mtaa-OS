import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { BarChart3, TrendingUp, Users, BookOpen, ChevronRight } from 'lucide-react-native';

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [performance, setPerformance] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ avgScore: 0, passRate: 0, attendance: 0, classes: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const { data: perfData } = await supabase
        .from("education_exam_results").select("*, education_students(name), education_exams(title, max_marks)").eq("institution_id", instId).limit(100);
      const { data: attendData } = await supabase
        .from("education_attendance").select("status, date").eq("institution_id", instId).gte("date", new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0]).limit(500);
      const { data: classData } = await supabase
        .from("education_classes").select("id, name").eq("institution_id", instId);

      setPerformance(perfData || []);
      setAttendance(attendData || []);

      const avgScore = perfData?.length ? (perfData.reduce((s: number, x: any) => s + (Number(x.marks_obtained) || 0), 0) / perfData.length) : 0;
      const passRate = perfData?.length ? Math.round((perfData.filter((x: any) => (x.marks_obtained / (x.education_exams?.max_marks || 1)) >= 0.5).length / perfData.length) * 100) : 0;
      const presentCount = (attendData || []).filter((x: any) => x.status === 'present').length;
      const attendanceRate = attendData?.length ? Math.round((presentCount / attendData.length) * 100) : 0;
      setStats({ avgScore: Math.round(avgScore), passRate, attendance: attendanceRate, classes: classData?.length || 0 });
    } catch (e: any) {
      console.error('[Analytics]', e);
      Alert.alert('Error', e.message || 'Failed to load analytics');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Analytics</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <BarChart3 size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.avgScore}</Text>
          <Text style={styles.statLabel}>Avg Score</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <TrendingUp size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.passRate}%</Text>
          <Text style={styles.statLabel}>Pass Rate</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Users size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.attendance}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <BookOpen size={20} color="#ef4444" />
          <Text style={styles.statValue}>{stats.classes}</Text>
          <Text style={styles.statLabel}>Classes</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Recent Performance</Text>
      {(performance || []).slice(0, 20).map((p: any) => (
        <TouchableOpacity key={p.id} style={styles.card} onPress={() => router.push(`/education/exam-results/${p.id}` as any)}>
          <View style={styles.cardRow}>
            <Users size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{p.education_students?.name || 'Unknown'}</Text>
            <Text style={styles.cardAmount}>{p.marks_obtained || 0}/{p.education_exams?.max_marks || 0}</Text>
          </View>
          <Text style={styles.cardSub}>{p.education_exams?.title || 'Exam'} · Grade: {p.grade || 'N/A'}</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(100, ((p.marks_obtained || 0) / (p.education_exams?.max_marks || 1)) * 100)}%`, backgroundColor: ((p.marks_obtained || 0) / (p.education_exams?.max_marks || 1)) >= 0.5 ? '#22c55e' : '#ef4444' }]} />
          </View>
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
  statsRow: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 14, fontWeight: '700', color: '#1e293b', marginTop: 4 },
  statLabel: { fontSize: 10, color: '#64748b', marginTop: 2 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  cardAmount: { fontSize: 14, fontWeight: '600', color: '#6366f1' },
  progressBar: { height: 6, backgroundColor: '#e2e8f0', borderRadius: 3, marginTop: 8, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
