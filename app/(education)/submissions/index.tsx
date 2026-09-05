// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { FileText, Clock, CheckCircle, XCircle, ChevronRight, Filter } from 'lucide-react-native';

export default function SubmissionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, graded: 0, pending: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      let query = supabase
        .from("education_submissions")
        .select("*, education_students(name), education_assignments(title, max_marks)")
        .eq("institution_id", instId).order("submitted_at", { ascending: false }).limit(50);
      if (filter) query = query.eq("status", filter);
      const { data } = await query;

      setSubmissions(data || []);
      const total = data?.length || 0;
      const graded = (data || []).filter((x: any) => x.status === 'graded').length;
      setStats({ total, graded, pending: total - graded });
    } catch (e: any) {
      console.error('[Submissions]', e);
      Alert.alert('Error', e.message || 'Failed to load submissions');
    } finally { setLoading(false); }
  }, [user?.id, filter]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Submissions</Text>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <FileText size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <CheckCircle size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.graded}</Text>
          <Text style={styles.statLabel}>Graded</Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, !filter && styles.filterActive]} onPress={() => setFilter(null)}>
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'submitted' && styles.filterActive]} onPress={() => setFilter('submitted')}>
          <Clock size={14} color={filter === 'submitted' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'submitted' && styles.filterTextActive]}>Submitted</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'graded' && styles.filterActive]} onPress={() => setFilter('graded')}>
          <CheckCircle size={14} color={filter === 'graded' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'graded' && styles.filterTextActive]}>Graded</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'late' && styles.filterActive]} onPress={() => setFilter('late')}>
          <XCircle size={14} color={filter === 'late' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'late' && styles.filterTextActive]}>Late</Text>
        </TouchableOpacity>
      </ScrollView>
      <Text style={styles.sectionTitle}>Student Submissions</Text>
      {(submissions || []).map((s: any) => (
        <TouchableOpacity key={s.id} style={styles.card} onPress={() => router.push(`/(education as any)/submissions/${s.id}` as any)}>
          <View style={styles.cardRow}>
            <FileText size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{s.education_students?.name || 'Unknown'}</Text>
            <Text style={[styles.badge, s.status === 'graded' ? styles.badgePaid : s.status === 'late' ? styles.badgeRejected : styles.badgePending]}>{s.status}</Text>
          </View>
          <Text style={styles.cardSub}>{s.education_assignments?.title || 'Assignment'} · Max: {s.education_assignments?.max_marks || 0}</Text>
          <Text style={styles.cardSub}>Submitted: {new Date(s.submitted_at).toLocaleDateString()} · Score: {s.score || 'N/A'}</Text>
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
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginTop: 6 },
  statLabel: { fontSize: 11, color: '#64748b', marginTop: 2 },
  filterRow: { flexDirection: 'row', marginBottom: 16 },
  filterChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#e2e8f0', marginRight: 8, gap: 4 },
  filterActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 12, color: '#64748b', fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1e293b', marginBottom: 10, marginTop: 8 },
  card: { backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  cardSub: { fontSize: 12, color: '#64748b', marginTop: 4 },
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  badgePaid: { backgroundColor: '#22c55e20', color: '#22c55e' },
  badgePending: { backgroundColor: '#f59e0b20', color: '#f59e0b' },
  badgeRejected: { backgroundColor: '#ef444420', color: '#ef4444' },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
