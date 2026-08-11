import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { CheckCircle, XCircle, Clock, FileText, ChevronRight, Filter } from 'lucide-react-native';

export default function ApprovalsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [approvals, setApprovals] = useState<any[]>([]);
  const [filter, setFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });

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
        .from("education_approvals")
        .select("*, education_staff(name, role)")
        .eq("institution_id", instId).order("created_at", { ascending: false }).limit(50);
      if (filter) query = query.eq("status", filter);
      const { data } = await query;

      setApprovals(data || []);
      const total = data?.length || 0;
      const pending = (data || []).filter((x: any) => x.status === 'pending').length;
      const approved = (data || []).filter((x: any) => x.status === 'approved').length;
      const rejected = (data || []).filter((x: any) => x.status === 'rejected').length;
      setStats({ total, pending, approved, rejected });
    } catch (e: any) {
      console.error('[Approvals]', e);
      Alert.alert('Error', e.message || 'Failed to load approvals');
    } finally { setLoading(false); }
  }, [user?.id, filter]);

  useEffect(() => { load(); }, [load]);

  const handleApproval = async (id: string, status: 'approved' | 'rejected') => {
    try {
      const { supabase } = await import("@/lib/supabase");
      const { error } = await supabase.from("education_approvals").update({
        status, reviewed_by: user?.id, reviewed_at: new Date().toISOString()
      }).eq("id", id);
      if (error) throw error;
      Alert.alert(status === 'approved' ? 'Approved' : 'Rejected', `Request ${status}`);
      load();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to update'); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Approvals</Text>
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
          <Text style={styles.statValue}>{stats.approved}</Text>
          <Text style={styles.statLabel}>Approved</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#ef444420' }]}>
          <XCircle size={20} color="#ef4444" />
          <Text style={styles.statValue}>{stats.rejected}</Text>
          <Text style={styles.statLabel}>Rejected</Text>
        </View>
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
          <XCircle size={14} color={filter === 'rejected' ? '#fff' : '#64748b'} />
          <Text style={[styles.filterText, filter === 'rejected' && styles.filterTextActive]}>Rejected</Text>
        </TouchableOpacity>
      </ScrollView>
      <Text style={styles.sectionTitle}>Approval Requests</Text>
      {(approvals || []).map((a: any) => (
        <View key={a.id} style={styles.card}>
          <View style={styles.cardRow}>
            <FileText size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{a.title || 'Approval Request'}</Text>
            <Text style={[styles.badge, a.status === 'approved' ? styles.badgePaid : a.status === 'rejected' ? styles.badgeRejected : styles.badgePending]}>{a.status}</Text>
          </View>
          <Text style={styles.cardSub}>{a.description || 'No description'}</Text>
          <Text style={styles.cardSub}>By: {a.education_staff?.name || 'Unknown'} · {a.education_staff?.role || 'Staff'} · {new Date(a.created_at).toLocaleDateString()}</Text>
          {a.status === 'pending' && (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApproval(a.id, 'approved')}>
                <CheckCircle size={14} color="#fff" /><Text style={styles.actionBtnText}>Approve</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleApproval(a.id, 'rejected')}>
                <XCircle size={14} color="#fff" /><Text style={styles.actionBtnText}>Reject</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
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
  actionRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#22c55e', paddingVertical: 8, borderRadius: 6 },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#ef4444', paddingVertical: 8, borderRadius: 6 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
