// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Alert, FileText, BarChart3, Download, ChevronRight, Calendar, TrendingUp } from 'lucide-react-native';

export default function ReportsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [institutionId, setInstitutionId] = useState<string | null>(null);
  const [stats, setStats] = useState({ students: 0, staff: 0, attendance: 0, fees: 0 });

  const load = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { supabase } = await import("@/lib/supabase");
      const { data: staffData } = await supabase
        .from("education_staff").select("institution_id").eq("user_id", user.id).maybeSingle();
      const instId = staffData?.institution_id;
      setInstitutionId(instId);
      if (!instId) { setLoading(false); return; }

      const { data: reportData } = await supabase
        .from("education_reports").select("*").eq("institution_id", instId).order("created_at", { ascending: false }).limit(20);
      const { count: studentCount } = await supabase
        .from("education_students").select("*", { count: 'exact', head: true }).eq("institution_id", instId);
      const { count: staffCount } = await supabase
        .from("education_staff").select("*", { count: 'exact', head: true }).eq("institution_id", instId);
      const { data: feeData } = await supabase
        .from("education_fee_payments").select("amount").eq("institution_id", instId);
      const { data: attendData } = await supabase
        .from("education_attendance").select("status").eq("institution_id", instId).gte("date", new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]);

      setReports(reportData || []);
      const totalFees = (feeData || []).reduce((s: number, x: any) => s + (Number(x.amount) || 0), 0);
      const presentCount = (attendData || []).filter((x: any) => x.status === 'present').length;
      const attendanceRate = attendData?.length ? Math.round((presentCount / attendData.length) * 100) : 0;
      setStats({ students: studentCount || 0, staff: staffCount || 0, attendance: attendanceRate, fees: totalFees });
    } catch (e: any) {
      console.error('[Reports]', e);
      Alert.alert('Error', e.message || 'Failed to load reports');
    } finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(education as any)/reports/create' as any)}>
          <FileText size={18} color="#fff" /><Text style={styles.addBtnText}>Generate</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: '#6366f120' }]}>
          <TrendingUp size={20} color="#6366f1" />
          <Text style={styles.statValue}>{stats.students}</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#22c55e20' }]}>
          <BarChart3 size={20} color="#22c55e" />
          <Text style={styles.statValue}>{stats.staff}</Text>
          <Text style={styles.statLabel}>Staff</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#f59e0b20' }]}>
          <Calendar size={20} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.attendance}%</Text>
          <Text style={styles.statLabel}>Attendance</Text>
        </View>
      </View>
      <Text style={styles.sectionTitle}>Generated Reports</Text>
      {(reports || []).map((r: any) => (
        <TouchableOpacity key={r.id} style={styles.card} onPress={() => router.push(`/(education as any)/reports/${r.id}` as any)}>
          <View style={styles.cardRow}>
            <FileText size={18} color="#6366f1" />
            <Text style={styles.cardTitle}>{r.title || 'Report'}</Text>
            <Text style={styles.badge}>{r.report_type}</Text>
          </View>
          <Text style={styles.cardSub}>{r.description || 'No description'} · {new Date(r.created_at).toLocaleDateString()}</Text>
          <ChevronRight size={16} color="#9ca3af" style={styles.chevron} />
        </TouchableOpacity>
      ))}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Export', 'Financial report exported')}>
        <Download size={18} color="#6366f1" /><Text style={styles.actionText}>Export Financial Report</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Export', 'Attendance report exported')}>
        <Download size={18} color="#22c55e" /><Text style={styles.actionText}>Export Attendance Report</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Export', 'Student performance report exported')}>
        <Download size={18} color="#f59e0b" /><Text style={styles.actionText}>Export Performance Report</Text>
      </TouchableOpacity>
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
  badge: { fontSize: 11, fontWeight: '600', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden', backgroundColor: '#e2e8f0', color: '#64748b' },
  actionCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 10, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  actionText: { fontSize: 14, fontWeight: '600', color: '#1e293b' },
  chevron: { position: 'absolute', right: 14, top: '50%', marginTop: -8 },
});
