import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Pill, Clock, AlertTriangle, CheckCircle2,
  Package, TrendingDown, Search, Filter
} from 'lucide-react-native';

interface PrescriptionQueue {
  id: string; prescription_id: string; patient_name: string;
  medication_name: string; dosage: string; quantity: number;
  status: 'pending' | 'preparing' | 'ready' | 'dispensed' | 'cancelled';
  priority: 'routine' | 'urgent' | 'stat';
  ordered_at: string; pharmacist_id: string | null;
}

export default function PharmacyDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [queue, setQueue] = useState<PrescriptionQueue[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, preparing: 0, ready: 0, urgent: 0 });
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'preparing' | 'ready' | 'urgent'>('all');

  useEffect(() => { loadQueue(); }, []);

  const loadQueue = async () => {
    try {
      const { data, error } = await supabase
        .from('pharmacy_queue')
        .select('*, prescriptions(name, dosage, quantity), patients(full_name)')
        .order('ordered_at', { ascending: true }).limit(100);
      if (error) throw error;
      const formatted = (data || []).map((q: any) => ({
        id: q.id, prescription_id: q.prescription_id,
        patient_name: q.patients?.full_name || 'Unknown',
        medication_name: q.prescriptions?.name || 'Unknown',
        dosage: q.prescriptions?.dosage || '', quantity: q.prescriptions?.quantity || 0,
        status: q.status, priority: q.priority, ordered_at: q.ordered_at,
        pharmacist_id: q.pharmacist_id,
      }));
      setQueue(formatted);
      setStats({
        total: formatted.length, pending: formatted.filter(q => q.status === 'pending').length,
        preparing: formatted.filter(q => q.status === 'preparing').length,
        ready: formatted.filter(q => q.status === 'ready').length,
        urgent: formatted.filter(q => q.priority === 'urgent' || q.priority === 'stat').length,
      });
    } catch (err) { Alert.alert('Error', 'Failed to load pharmacy queue'); }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'preparing') updates.pharmacist_id = user?.id;
      if (status === 'dispensed') updates.dispensed_at = new Date().toISOString();
      const { error } = await supabase.from('pharmacy_queue').update(updates).eq('id', id);
      if (error) throw error;
      loadQueue();
    } catch (err) { Alert.alert('Error', 'Failed to update status'); }
  };

  const filtered = queue.filter(q => {
    if (activeFilter === 'pending') return q.status === 'pending';
    if (activeFilter === 'preparing') return q.status === 'preparing';
    if (activeFilter === 'ready') return q.status === 'ready';
    if (activeFilter === 'urgent') return q.priority === 'urgent' || q.priority === 'stat';
    return true;
  });

  const STATUS_COLORS: Record<string, string> = { pending: '#f59e0b', preparing: '#3b82f6', ready: '#8b5cf6', dispensed: '#22c55e', cancelled: '#ef4444' };
  const PRIORITY_COLORS: Record<string, string> = { routine: '#64748b', urgent: '#f59e0b', stat: '#ef4444' };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pharmacy</Text>
        <TouchableOpacity onPress={() => router.push('/health/pharmacy/inventory')} style={styles.invBtn}>
          <Package size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <StatCard icon={<Pill size={16} color="#6366f1" />} label="Total" value={stats.total} color="#6366f1" />
        <StatCard icon={<Clock size={16} color="#f59e0b" />} label="Pending" value={stats.pending} color="#f59e0b" />
        <StatCard icon={<Package size={16} color="#3b82f6" />} label="Prep" value={stats.preparing} color="#3b82f6" />
        <StatCard icon={<AlertTriangle size={16} color="#ef4444" />} label="Urgent" value={stats.urgent} color="#ef4444" />
      </View>

      <View style={styles.tabBar}>
        {(['all', 'pending', 'preparing', 'ready', 'urgent'] as const).map(f => (
          <TouchableOpacity key={f} style={[styles.tab, activeFilter === f && styles.tabActive]} onPress={() => setActiveFilter(f)}>
            <Text style={[styles.tabText, activeFilter === f && styles.tabTextActive]}>
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <View style={styles.queueCard}>
            <View style={styles.queueHeader}>
              <View>
                <Text style={styles.medName}>{item.medication_name}</Text>
                <Text style={styles.medDose}>{item.dosage} · Qty: {item.quantity}</Text>
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
            <Text style={styles.patientName}>{item.patient_name}</Text>
            <Text style={styles.orderedText}>Ordered: {new Date(item.ordered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>

            <View style={styles.actionRow}>
              {item.status === 'pending' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'preparing')}>
                  <Package size={14} color="#3b82f6" /><Text style={[styles.actionText, { color: '#3b82f6' }]}>Start Prep</Text>
                </TouchableOpacity>
              )}
              {item.status === 'preparing' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'ready')}>
                  <CheckCircle2 size={14} color="#8b5cf6" /><Text style={[styles.actionText, { color: '#8b5cf6' }]}>Mark Ready</Text>
                </TouchableOpacity>
              )}
              {item.status === 'ready' && (
                <TouchableOpacity style={styles.actionBtn} onPress={() => updateStatus(item.id, 'dispensed')}>
                  <CheckCircle2 size={14} color="#22c55e" /><Text style={[styles.actionText, { color: '#22c55e' }]}>Dispense</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Pill size={48} color="#334155" />
            <Text style={styles.emptyTitle}>Queue empty</Text>
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
  invBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 12, gap: 8 },
  statCard: { flex: 1, backgroundColor: '#1e293b', borderRadius: 12, padding: 12, alignItems: 'center', borderTopWidth: 3 },
  statValue: { fontSize: 20, fontWeight: '700', marginTop: 4 },
  statLabel: { color: '#94a3b8', fontSize: 11, marginTop: 2 },
  tabBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1e293b', borderRadius: 12, padding: 4 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 8 },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { color: '#94a3b8', fontSize: 11, fontWeight: '600' },
  tabTextActive: { color: '#fff' },
  queueCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  medName: { color: '#fff', fontSize: 15, fontWeight: '700' },
  medDose: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  badgeRow: { alignItems: 'flex-end', gap: 4 },
  priorityBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 10, fontWeight: '700' },
  patientName: { color: '#cbd5e1', fontSize: 13, marginBottom: 4 },
  orderedText: { color: '#64748b', fontSize: 12, marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  actionText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
});
