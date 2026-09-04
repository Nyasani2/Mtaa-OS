// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert,
  ChevronLeft, FlaskConical, Clock, AlertTriangle, CheckCircle2,
  TrendingUp, Package, Activity
} from 'lucide-react-native';

interface LabTest {
  id: string; sample_id: string; patient_id: string; patient_name: string;
  test_name: string; category: string;
  status: 'ordered' | 'collected' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  ordered_at: string; collected_at: string | null; completed_at: string | null;
  turnaround_minutes: number | null; result_count: number;
}

export default function LabDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [tests, setTests] = useState<LabTest[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0, urgent: 0 });
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'in_progress' | 'urgent'>('all');

  useEffect(() => { loadTests(); }, []);

  const loadTests = async () => {
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*, patients(full_name), lab_results(id)')
        .order('ordered_at', { ascending: false }).limit(100);
      if (error) throw error;
      const formatted = (data || []).map((t: any) => ({
        id: t.id, sample_id: t.sample_id, patient_id: t.patient_id,
        patient_name: t.patients?.full_name || 'Unknown',
        test_name: t.test_name, category: t.category, status: t.status,
        priority: t.priority, ordered_at: t.ordered_at, collected_at: t.collected_at,
        completed_at: t.completed_at, turnaround_minutes: t.turnaround_minutes,
        result_count: t.lab_results?.length || 0,
      }));
      setTests(formatted);
      setStats({
        total: formatted.length, pending: formatted.filter((t: any) => t.status === 'ordered').length,
        inProgress: formatted.filter((t: any) => t.status === 'in_progress').length,
        completed: formatted.filter((t: any) => t.status === 'completed').length,
        urgent: formatted.filter((t: any) => t.priority === 'urgent' || t.priority === 'stat').length,
      });
    } catch (err) { Alert.alert('Error', 'Failed to load lab tests'); }
  };

  const updateStatus = async (testId: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'collected') updates.collected_at = new Date().toISOString();
      if (status === 'completed') updates.completed_at = new Date().toISOString();
      const { error } = await supabase.from('lab_tests').update(updates).eq('id', testId);
      if (error) throw error;
      loadTests();
    } catch (err) { Alert.alert('Error', 'Failed to update status'); }
  };

  const filteredTests = tests.filter((t: any) => {
    if (activeFilter === 'pending') return t.status === 'ordered';
    if (activeFilter === 'in_progress') return t.status === 'in_progress' || t.status === 'collected';
    if (activeFilter === 'urgent') return t.priority === 'urgent' || t.priority === 'stat';
    return true;
  });

  const STATUS_COLORS: Record<string, string> = { ordered: '#f59e0b', collected: '#3b82f6', in_progress: '#8b5cf6', completed: '#22c55e', cancelled: '#ef4444' };
  const PRIORITY_COLORS: Record<string, string> = { routine: '#64748b', urgent: '#f59e0b', stat: '#ef4444' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laboratory</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statsRow}>
        <StatCard icon={<Package size={16} color="#6366f1" />} label="Total" value={stats.total} color="#6366f1" />
        <StatCard icon={<Clock size={16} color="#f59e0b" />} label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard icon={<Activity size={16} color="#8b5cf6" />} label="In Lab" value={stats.inProgress} color="#8b5cf6" />
        <StatCard icon={<AlertTriangle size={16} color="#ef4444" />} label="Urgent" value={stats.urgent} color="#ef4444" />
      </View>

      <View style={styles.tabBar}>
        {(['all', 'pending', 'in_progress', 'urgent'] as const).map((f: any) => (
          <TouchableOpacity key={f} style={[styles.tab, activeFilter === f && styles.tabActive]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.tabText, activeFilter === f && styles.tabTextActive]}>
              {f === 'all' ? 'All' : f === 'in_progress' ? 'In Lab' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredTests}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.testCard}>
            <View style={styles.testHeader}>
              <View>
                <Text style={styles.testName}>{item.test_name}</Text>
                <Text style={styles.patientName}>{item.patient_name}</Text>
              </View>
              <View style={styles.badgeRow}>
                <View style={[styles.priorityBadge, { backgroundColor: PRIORITY_COLORS[item.priority] + '20' }]}>
                  <Text style={[styles.priorityText, { color: PRIORITY_COLORS[item.priority] }]}>{item.priority}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <Text style={[styles.statusText, { color: STATUS_COLORS[item.status] }]}>{item.status}</Text>
                </View>
              </View>
            </View>
            <View style={styles.testMeta}>
              <Text style={styles.metaText}>Sample: {item.sample_id}</Text>
              <Text style={styles.metaText}>Ordered: {new Date(item.ordered_at).toLocaleDateString()}</Text>
              {item.turnaround_minutes && <Text style={styles.metaText}>TAT: {item.turnaround_minutes} min</Text>}
            </View>
            <View style={styles.actionRow}>
              {item.status === 'ordered' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'collected')}>
                  <Package size={14} color="#3b82f6" /><Text style={[styles.actionText, { color: '#3b82f6' }]}>Collect</Text>
                </TouchableOpacity>
              )}
              {item.status === 'collected' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'in_progress')}>
                  <FlaskConical size={14} color="#8b5cf6" /><Text style={[styles.actionText, { color: '#8b5cf6' }]}>Start Test</Text>
                </TouchableOpacity>
              )}
              {item.status === 'in_progress' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/health/lab/results?testId=${item.id}` as any)}>
                  <CheckCircle2 size={14} color="#22c55e" /><Text style={[styles.actionText, { color: '#22c55e' }]}>Enter Results</Text>
                </TouchableOpacity>
              )}
              {item.status === 'completed' && item.result_count > 0 && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/health/lab/results?testId=${item.id}` as any)}>
                  <TrendingUp size={14} color="#22c55e" /><Text style={[styles.actionText, { color: '#22c55e' }]}>View Results</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <FlaskConical size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No tests</Text>
          </View>
        }
      />
    </View>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <View style={[styles.statCard, { borderTopColor: color }]}>
      {icon}
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  statLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  testCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  testHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  testName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  patientName: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  badgeRow: { alignItems: 'flex-end', gap: 4 },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  testMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 10 },
  metaText: { color: '#64748b', fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
});
