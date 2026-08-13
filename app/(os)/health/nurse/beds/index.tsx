// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BedDouble, UserCheck, AlertCircle, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

interface BedRecord {
  id: string;
  bed_number: string;
  ward: string;
  status: 'available' | 'occupied' | 'cleaning' | 'maintenance';
  patient_name?: string;
  patient_id?: string;
  admission_date?: string;
}

export default function NurseBedsScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [beds, setBeds] = useState<BedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'available' | 'occupied'>('all');

  useEffect(() => { fetchBeds(); }, [staffRecord?.facility_id]);

  const fetchBeds = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_beds')
        .select('id, bed_number, ward, status, patient_name, patient_id, admission_date')
        .eq('facility_id', staffRecord.facility_id)
        .order('ward', { ascending: true })
        .order('bed_number', { ascending: true });
      if (error) throw error;
      setBeds(data || []);
    } catch (err) {
      console.error('Beds error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const updateBedStatus = async (id: string, status: string) => {
    try {
      const updates: any = { status };
      if (status === 'available') {
        updates.patient_name = null;
        updates.patient_id = null;
        updates.admission_date = null;
      }
      const { error } = await supabase.from('health_beds').update(updates).eq('id', id);
      if (error) throw error;
      fetchBeds();
    } catch (err: any) {
      alert('Update failed: ' + err.message);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'available': return '#22c55e';
      case 'occupied': return '#ef4444';
      case 'cleaning': return '#f59e0b';
      case 'maintenance': return '#6b7280';
      default: return '#9ca3af';
    }
  };

  const filtered = filter === 'all' ? beds : beds.filter((b) => b.status === filter);
  const stats = {
    total: beds.length,
    available: beds.filter((b) => b.status === 'available').length,
    occupied: beds.filter((b) => b.status === 'occupied').length,
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBeds(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Bed Management</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statPill, { backgroundColor: '#eff6ff' }]}>
          <Text style={[styles.statPillValue, { color: '#2563eb' }]}>{stats.total}</Text>
          <Text style={styles.statPillLabel}>Total</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#f0fdf4' }]}>
          <Text style={[styles.statPillValue, { color: '#16a34a' }]}>{stats.available}</Text>
          <Text style={styles.statPillLabel}>Free</Text>
        </View>
        <View style={[styles.statPill, { backgroundColor: '#fef2f2' }]}>
          <Text style={[styles.statPillValue, { color: '#dc2626' }]}>{stats.occupied}</Text>
          <Text style={styles.statPillLabel}>Occupied</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        {(['all', 'available', 'occupied'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterChip, filter === f && styles.filterChipActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#22c55e" style={{ marginTop: 40 }} />
      ) : (
        filtered.map((bed) => (
          <View key={bed.id} style={styles.bedCard}>
            <View style={styles.bedHeader}>
              <View style={[styles.bedIcon, { backgroundColor: getStatusColor(bed.status) + '15' }]}>
                <BedDouble size={20} color={getStatusColor(bed.status)} />
              </View>
              <View style={styles.bedInfo}>
                <Text style={styles.bedNumber}>Bed {bed.bed_number}</Text>
                <Text style={styles.bedWard}>{bed.ward}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(bed.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(bed.status) }]}>{bed.status}</Text>
              </View>
            </View>
            {bed.patient_name && (
              <View style={styles.patientRow}>
                <UserCheck size={14} color="#6b7280" />
                <Text style={styles.patientText}>{bed.patient_name}</Text>
                {bed.admission_date && <Text style={styles.dateText}>· {new Date(bed.admission_date).toLocaleDateString()}</Text>}
              </View>
            )}
            <View style={styles.actionsRow}>
              {bed.status === 'occupied' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#22c55e15' }]} onPress={() => updateBedStatus(bed.id, 'available')}>
                  <CheckCircle2 size={14} color="#22c55e" />
                  <Text style={[styles.actionText, { color: '#22c55e' }]}>Discharge</Text>
                </TouchableOpacity>
              )}
              {bed.status === 'available' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef444415' }]} onPress={() => updateBedStatus(bed.id, 'occupied')}>
                  <AlertCircle size={14} color="#ef4444" />
                  <Text style={[styles.actionText, { color: '#ef4444' }]}>Admit</Text>
                </TouchableOpacity>
              )}
              {bed.status === 'cleaning' && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#2563eb15' }]} onPress={() => updateBedStatus(bed.id, 'available')}>
                  <CheckCircle2 size={14} color="#2563eb" />
                  <Text style={[styles.actionText, { color: '#2563eb' }]}>Ready</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  statPill: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
  statPillValue: { fontSize: 20, fontWeight: '800' },
  statPillLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  filterChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  filterChipActive: { backgroundColor: '#22c55e', borderColor: '#22c55e' },
  filterText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  bedCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  bedHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  bedIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  bedInfo: { flex: 1, marginLeft: 10 },
  bedNumber: { fontSize: 15, fontWeight: '700', color: '#1f2937' },
  bedWard: { fontSize: 12, color: '#9ca3af' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 8 },
  patientText: { fontSize: 13, color: '#6b7280' },
  dateText: { fontSize: 12, color: '#9ca3af' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6, gap: 4 },
  actionText: { fontSize: 11, fontWeight: '600' },
});
