import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface QueueItem {
  id: string;
  patient_id: string;
  patient_name: string;
  patient_phone: string | null;
  department: string;
  doctor_name: string | null;
  priority: 'routine' | 'urgent' | 'emergency';
  status: 'waiting' | 'in_consultation' | 'completed' | 'cancelled';
  queue_number: number;
  estimated_wait_minutes: number | null;
  checked_in_at: string;
}

export default function ReceptionistQueueScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('all');
  const [departments, setDepartments] = useState<string[]>([]);

  useEffect(() => {
    loadDepartments();
    loadQueue();
    const interval = setInterval(loadQueue, 30000);
    return () => clearInterval(interval);
  }, [department]);

  async function loadDepartments() {
    const { data } = await supabase.from('health_check_ins').select('department').eq('status', 'waiting');
    const unique = [...new Set((data || []).map((d: any) => d.department))].sort();
    setDepartments(unique);
  }

  async function loadQueue() {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from('health_check_ins')
        .select('*, health_patients(id, full_name, phone), health_staff(id, user_profiles(full_name))')
        .in('status', ['waiting', 'in_consultation'])
        .order('priority', { ascending: false })
        .order('checked_in_at', { ascending: true });

      if (department !== 'all') {
        query = query.eq('department', department);
      }

      const { data, error } = await query;
      if (error) throw error;

      let queueNum = 1;
      const mapped: QueueItem[] = (data || []).map((r: any) => ({
        id: r.id,
        patient_id: r.patient_id,
        patient_name: r.health_patients?.full_name || 'Unknown',
        patient_phone: r.health_patients?.phone || null,
        department: r.department,
        doctor_name: r.health_staff?.user_profiles?.full_name || 'Unassigned',
        priority: r.priority,
        status: r.status,
        queue_number: r.queue_number || queueNum++,
        estimated_wait_minutes: r.estimated_wait_minutes,
        checked_in_at: r.checked_in_at,
      }));

      setQueue(mapped);
    } catch (err) {
      console.error('Queue load error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function callNext(id: string) {
    const { error } = await supabase.from('health_check_ins').update({ status: 'in_consultation' }).eq('id', id);
    if (!error) loadQueue();
  }

  async function skipPatient(id: string) {
    const { error } = await supabase.from('health_check_ins').update({ status: 'cancelled' }).eq('id', id);
    if (!error) loadQueue();
  }

  const priorityConfig: Record<string, { color: string; icon: string }> = {
    routine: { color: '#22c55e', icon: 'time' },
    urgent: { color: '#f59e0b', icon: 'alert' },
    emergency: { color: '#ef4444', icon: 'flash' },
  };

  const waitingCount = queue.filter(q => q.status === 'waiting').length;
  const inRoomCount = queue.filter(q => q.status === 'in_consultation').length;
  const avgWait = queue.length > 0 ? queue.reduce((s, q) => s + (q.estimated_wait_minutes || 15), 0) / queue.length : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Queue</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.totalsRow}>
        <View style={[styles.totalCard, { backgroundColor: '#f59e0b20' }]}>
          <Text style={[styles.totalValue, { color: '#f59e0b' }]}>{waitingCount}</Text>
          <Text style={styles.totalLabel}>Waiting</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#3b82f620' }]}>
          <Text style={[styles.totalValue, { color: '#3b82f6' }]}>{inRoomCount}</Text>
          <Text style={styles.totalLabel}>In Room</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: '#8b5cf620' }]}>
          <Text style={[styles.totalValue, { color: '#8b5cf6' }]}>{Math.round(avgWait)}m</Text>
          <Text style={styles.totalLabel}>Avg Wait</Text>
        </View>
      </View>

      <View style={styles.deptRow}>
        <TouchableOpacity style={[styles.deptChip, department === 'all' && styles.deptChipActive]} onPress={() => setDepartment('all')}>
          <Text style={[styles.deptText, department === 'all' && styles.deptTextActive]}>All</Text>
        </TouchableOpacity>
        {departments.map(d => (
          <TouchableOpacity key={d} style={[styles.deptChip, department === d && styles.deptChipActive]} onPress={() => setDepartment(d)}>
            <Text style={[styles.deptText, department === d && styles.deptTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0ea5e9" style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={queue}
          keyExtractor={item => item.id}
          contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          renderItem={({ item, index }) => (
            <View style={[styles.card, item.status === 'in_consultation' && styles.cardActive]}>
              <View style={styles.cardHeader}>
                <View style={styles.cardLeft}>
                  <View style={[styles.queueNum, item.status === 'in_consultation' ? { backgroundColor: '#3b82f6' } : { backgroundColor: '#0ea5e9' }]}>
                    <Text style={styles.queueNumText}>#{item.queue_number}</Text>
                  </View>
                  <View>
                    <Text style={styles.cardName}>{item.patient_name}</Text>
                    <Text style={styles.cardDetail}>{item.department} — {item.doctor_name}</Text>
                    <Text style={styles.cardTime}>Checked in: {new Date(item.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                  </View>
                </View>
                <View style={[styles.priorityBadge, { backgroundColor: priorityConfig[item.priority]?.color + '20' }]}>
                  <Ionicons name={priorityConfig[item.priority]?.icon as any} size={12} color={priorityConfig[item.priority]?.color} />
                  <Text style={[styles.priorityText, { color: priorityConfig[item.priority]?.color }]}>{item.priority.toUpperCase()}</Text>
                </View>
              </View>
              {item.status === 'waiting' && (
                <View style={styles.actionRow}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e' }]} onPress={() => callNext(item.id)}>
                    <Ionicons name="call" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Call Next</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => router.push(`/(os)/health/doctor/patient/${item.patient_id}`)}>
                    <Ionicons name="eye" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>View Record</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => skipPatient(item.id)}>
                    <Ionicons name="close" size={14} color="#fff" />
                    <Text style={styles.actionBtnText}>Skip</Text>
                  </TouchableOpacity>
                </View>
              )}
              {item.status === 'in_consultation' && (
                <View style={styles.inRoomRow}>
                  <Ionicons name="medical" size={16} color="#3b82f6" />
                  <Text style={styles.inRoomText}>Currently in consultation with {item.doctor_name}</Text>
                </View>
              )}
              {item.estimated_wait_minutes && item.status === 'waiting' && (
                <Text style={styles.waitText}>Est. wait: {item.estimated_wait_minutes} minutes</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>Queue is empty</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 48, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  totalsRow: { flexDirection: 'row', padding: 16, gap: 10 },
  totalCard: { flex: 1, borderRadius: 12, padding: 12, alignItems: 'center' },
  totalValue: { fontSize: 22, fontWeight: '700' },
  totalLabel: { fontSize: 11, color: '#64748b', marginTop: 4 },
  deptRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 6, marginBottom: 8, flexWrap: 'wrap' },
  deptChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1e293b' },
  deptChipActive: { backgroundColor: '#8b5cf6' },
  deptText: { fontSize: 12, color: '#94a3b8' },
  deptTextActive: { color: '#fff', fontWeight: '600' },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  cardActive: { borderLeftWidth: 4, borderLeftColor: '#3b82f6' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  queueNum: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  queueNumText: { fontSize: 13, fontWeight: '700', color: '#fff' },
  cardName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  cardDetail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  cardTime: { fontSize: 11, color: '#64748b', marginTop: 1 },
  priorityBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  priorityText: { fontSize: 10, fontWeight: '700' },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, flex: 1, borderRadius: 8, padding: 10, justifyContent: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  inRoomRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, padding: 8, backgroundColor: '#3b82f620', borderRadius: 8 },
  inRoomText: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  waitText: { fontSize: 12, color: '#f59e0b', marginTop: 6, textAlign: 'center' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#94a3b8', marginTop: 12, fontSize: 14 },
});
