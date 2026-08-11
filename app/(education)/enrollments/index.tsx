import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Users, Search, Filter, Plus, ChevronRight, CheckCircle, Clock } from 'lucide-react-native';

export default function EnrollmentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });

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
        .from("education_enrollments")
        .select("*, education_students(name, email, grade_level), education_classes(name)")
        .eq("institution_id", instId).order("created_at", { ascending: false }).limit(50);
      if (filter) query = query.eq("status", filter);
      const { data: enrollData } = await query;

      setEnrollments(enrollData || []);
      const total = enrollData?.length || 0;
      const approved = (enrollData || []).filter((x: any) => x.status === 'approved').length;
      setStats({ total, approved, pending: total - approved });
    } catch (e: any) {
      console.error('[Enrollments]', e);
      Alert.alert('Error', e.message || 'Failed to load enrollments');
    } finally { setLoading(false); }
  }, [user?.id, filter]);

  useEffect(() => { load(); }, [load]);

  const approveEnrollment = async (id: string) => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_enrollments").update({ status: 'approved', approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
      Alert.alert('Approved', 'Enrollment approved'); load();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to approve'); }
  };

  const filtered = (enrollments || []).filter((e: any) => {
    const term = search.toLowerCase();
    return !search || (e.education_students?.name || '').toLowerCase().includes(term) || (e.education_classes?.name || '').toLowerCase().includes(term);
  });

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Enrollments</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education)/enrollments/create')}>
          <Plus size={18} color="#fff" /><Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <Users size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <CheckCircle size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Clock size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.pending}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>
      <View style={styles.searchBox}>
        <Search size={18} color="#94a3b8" />
        <TextInput style={styles.searchInput} placeholder="Search students or classes..." value={search} onChangeText={setSearch} placeholderTextColor="#94a3b8" />
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterChip, !filter && styles.filterActive]} onPress={() => setFilter(null)}>
          <Text style={[styles.filterText, !filter && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'pending' && styles.filterActive]} onPress={() => setFilter('pending')}>
          <Clock size={14} color={filter === 'pending' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'pending' && styles.filterTextActive]}>Pending</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'approved' && styles.filterActive]} onPress={() => setFilter('approved')}>
          <CheckCircle size={14} color={filter === 'approved' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'approved' && styles.filterTextActive]}>Approved</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filter === 'rejected' && styles.filterActive]} onPress={() => setFilter('rejected')}>
          <Filter size={14} color={filter === 'rejected' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>Rejected</Text>
        </TouchableOpacity>
      </ScrollView>
      <Text style={styles.sectionTitle}>Enrollment Requests</Text>
      {(filtered || []).map((e: any) => (
        <TouchableOpacity key={e.id} style={styles.card} onPress={() => router.push(`/(education)/enrollments/${e.id}`)}>
          <View style={styles.cardRow}>
            <Users size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{e.education_students?.name || 'Unknown Student'}</Text>
            <Text style={[styles.badge, e.status === 'approved' ? styles.badgePaid : e.status === 'rejected' ? styles.badgeRejected : styles.badgePending]}>{e.status}</Text>
          </View>
          <Text style={styles.cardSub}>Class: {e.education_classes?.name || 'N/A'} · Grade: {e.education_students?.grade_level || 'N/A'}</Text>
          <Text style={styles.cardSub}>Applied: {new Date(e.created_at).toLocaleDateString()}</Text>
          {e.status === 'pending' && (
            <TouchableOpacity style={styles.approveBtn} onPress={() => approveEnrollment(e.id)}>
              <Text style={styles.approveBtnText}>Approve</Text>
            </TouchableOpacity>
          )}
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
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 12, gap: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  searchInput: { flex: 1, fontSize: 14, color: '#1e293b' },
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
  approveBtn: { marginTop: 8, backgroundColor: '#22c55e', paddingVertical: 6, borderRadius: 6, alignItems: 'center' },
  approveBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
