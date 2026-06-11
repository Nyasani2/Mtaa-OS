import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/kernel/stores/useAuthStore';
import { supabase } from '@/lib/supabase';
import {
  ChevronLeft, Users, Heart, Pill, BedDouble, Activity,
  Clock, AlertTriangle, CheckCircle2, Thermometer, Droplets
} from 'lucide-react-native';

interface PatientAssignment {
  id: string;
  patient_id: string;
  patient_name: string;
  room_number: string;
  bed_number: string;
  admission_date: string;
  diagnosis: string;
  vitals_due: boolean;
  meds_due: boolean;
  last_vitals_at: string | null;
  alert_level: 'stable' | 'watch' | 'critical';
}

export default function NurseDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [patients, setPatients] = useState<PatientAssignment[]>([]);
  const [stats, setStats] = useState({ total: 0, vitalsDue: 0, medsDue: 0, critical: 0 });
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'vitals' | 'meds' | 'critical'>('all');

  useEffect(() => {
    loadAssignments();
  }, []);

  const loadAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('nurse_assignments')
        .select('*, patients(full_name, room_number, bed_number, admission_date, diagnosis), health_profiles(heart_rate, temperature, blood_pressure, recorded_at)')
        .eq('nurse_id', user?.id)
        .eq('status', 'active');

      if (error) throw error;

      const formatted = (data || []).map((a: any) => {
        const lastVitals = a.health_profiles?.[0];
        const vitalsDue = !lastVitals || (Date.now() - new Date(lastVitals.recorded_at).getTime()) > 4 * 60 * 60 * 1000;
        const isCritical = lastVitals?.heart_rate > 120 || lastVitals?.temperature > 39;

        return {
          id: a.id,
          patient_id: a.patient_id,
          patient_name: a.patients?.full_name || 'Unknown',
          room_number: a.patients?.room_number || '—',
          bed_number: a.patients?.bed_number || '—',
          admission_date: a.patients?.admission_date,
          diagnosis: a.patients?.diagnosis || 'No diagnosis',
          vitals_due: vitalsDue,
          meds_due: a.meds_due || false,
          last_vitals_at: lastVitals?.recorded_at || null,
          alert_level: isCritical ? 'critical' : vitalsDue ? 'watch' : 'stable',
        };
      });

      setPatients(formatted);
      setStats({
        total: formatted.length,
        vitalsDue: formatted.filter(p => p.vitals_due).length,
        medsDue: formatted.filter(p => p.meds_due).length,
        critical: formatted.filter(p => p.alert_level === 'critical').length,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  const filteredPatients = patients.filter(p => {
    if (activeFilter === 'vitals') return p.vitals_due;
    if (activeFilter === 'meds') return p.meds_due;
    if (activeFilter === 'critical') return p.alert_level === 'critical';
    return true;
  });

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return '#ef4444';
      case 'watch': return '#f59e0b';
      default: return '#22c55e';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nurse Station</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.statsRow}>
        <StatCard icon={<Users size={18} color="#6366f1" />} label="Patients" value={stats.total} color="#6366f1" />
        <StatCard icon={<Activity size={18} color="#f59e0b" />} label="Vitals Due" value={stats.vitalsDue} color="#f59e0b" />
        <StatCard icon={<Pill size={18} color="#8b5cf6" />} label="Meds Due" value={stats.medsDue} color="#8b5cf6" />
        <StatCard icon={<AlertTriangle size={18} color="#ef4444" />} label="Critical" value={stats.critical} color="#ef4444" />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {(['all', 'vitals', 'meds', 'critical'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, activeFilter === f && styles.filterChipActive]}
            onPress={() => setActiveFilter(f)}
          >
            <Text style={[styles.filterText, activeFilter === f && styles.filterTextActive]}>
              {f === 'all' ? 'All' : f === 'vitals' ? 'Vitals Due' : f === 'meds' ? 'Meds Due' : 'Critical'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filteredPatients}
        keyExtractor={item => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.patientCard}
            onPress={() => router.push(`/health/nurse/vitals?patientId=${item.patient_id}`)}
          >
            <View style={styles.patientHeader}>
              <View style={styles.patientIdentity}>
                <Text style={styles.patientName}>{item.patient_name}</Text>
                <Text style={styles.patientRoom}>Room {item.room_number} · Bed {item.bed_number}</Text>
              </View>
              <View style={[styles.alertDot, { backgroundColor: getAlertColor(item.alert_level) }]} />
            </View>

            <Text style={styles.diagnosisText}>{item.diagnosis}</Text>

            <View style={styles.taskRow}>
              {item.vitals_due && (
                <View style={styles.taskBadge}>
                  <Thermometer size={12} color="#f59e0b" />
                  <Text style={styles.taskText}>Vitals due</Text>
                </View>
              )}
              {item.meds_due && (
                <View style={styles.taskBadge}>
                  <Pill size={12} color="#8b5cf6" />
                  <Text style={styles.taskText}>Meds due</Text>
                </View>
              )}
              {item.last_vitals_at && (
                <View style={styles.lastVitals}>
                  <Clock size={12} color="#64748b" />
                  <Text style={styles.lastVitalsText}>
                    Last: {new Date(item.last_vitals_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => router.push(`/health/nurse/vitals?patientId=${item.patient_id}`)}
              >
                <Heart size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Vitals</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#8b5cf6' }]}
                onPress={() => router.push(`/health/nurse/meds?patientId=${item.patient_id}`)}
              >
                <Pill size={14} color="#fff" />
                <Text style={styles.actionBtnText}>Meds</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Users size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No patients assigned</Text>
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
  filterScroll: { maxHeight: 44, marginBottom: 8 },
  filterChip: { backgroundColor: '#1e293b', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: '#334155' },
  filterChipActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#94a3b8', fontSize: 12, fontWeight: '600' },
  filterTextActive: { color: '#fff' },
  patientCard: { backgroundColor: '#1e293b', borderRadius: 16, padding: 16, marginBottom: 12 },
  patientHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  patientIdentity: { flex: 1 },
  patientName: { color: '#fff', fontSize: 16, fontWeight: '700' },
  patientRoom: { color: '#94a3b8', fontSize: 12, marginTop: 2 },
  alertDot: { width: 12, height: 12, borderRadius: 6 },
  diagnosisText: { color: '#cbd5e1', fontSize: 13, marginBottom: 10 },
  taskRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  taskBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#0f172a', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  taskText: { color: '#cbd5e1', fontSize: 11, fontWeight: '600' },
  lastVitals: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lastVitalsText: { color: '#64748b', fontSize: 11 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#6366f1', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  actionBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  emptyState: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { color: '#94a3b8', fontSize: 18, fontWeight: '700', marginTop: 16 },
});
