// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Alert, View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertTriangle, Phone, User, Clock } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

interface CriticalResult {
  id: string;
  patient_name: string;
  test_name: string;
  result_value: string;
  reference_range: string;
  flagged_at: string;
  doctor_name: string;
  acknowledged: boolean;
}

export default function LabCriticalScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [results, setResults] = useState<CriticalResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchCritical(); }, [staffRecord?.facility_id]);

  const fetchCritical = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_lab_results')
        .select('id, patient_name, test_name, result_value, reference_range, flagged_at, doctor_name, acknowledged')
        .eq('is_critical', true)
        .eq('acknowledged', false)
        .order('flagged_at', { ascending: false });
      if (error) throw error;
      setResults(data || []);
    } catch (err) {
      console.error('Critical error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const acknowledge = async (id: string) => {
    try {
      const { error } = await supabase.from('health_lab_results').update({ acknowledged: true, acknowledged_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      fetchCritical();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCritical(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Critical Results</Text>
        {results.length > 0 && <View style={styles.badge}><Text style={styles.badgeText}>{results.length}</Text></View>}
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#dc2626" style={{ marginTop: 40 }} />
      ) : results.length === 0 ? (
        <View style={styles.empty}>
          <AlertTriangle size={48} color="#22c55e" />
          <Text style={styles.emptyTitle}>No critical results</Text>
          <Text style={styles.emptySub}>All clear. No unacknowledged critical values.</Text>
        </View>
      ) : (
        results.map((r) => (
          <View key={r.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <AlertTriangle size={20} color="#dc2626" />
              <Text style={styles.criticalLabel}>CRITICAL</Text>
            </View>
            <View style={styles.patientRow}>
              <User size={14} color="#6b7280" />
              <Text style={styles.patientName}>{r.patient_name}</Text>
            </View>
            <Text style={styles.testName}>{r.test_name}</Text>
            <View style={styles.resultRow}>
              <Text style={styles.resultValue}>{r.result_value}</Text>
              <Text style={styles.reference}>Ref: {r.reference_range}</Text>
            </View>
            <View style={styles.footer}>
              <View style={styles.timeRow}>
                <Clock size={12} color="#9ca3af" />
                <Text style={styles.timeText}>{new Date(r.flagged_at).toLocaleString()}</Text>
              </View>
              <TouchableOpacity style={styles.ackBtn} onPress={() => acknowledge(r.id)}>
                <Text style={styles.ackText}>Acknowledge</Text>
              </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937', flex: 1 },
  badge: { backgroundColor: '#dc2626', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#22c55e', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  card: { backgroundColor: '#fef2f2', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#fecaca' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  criticalLabel: { fontSize: 12, fontWeight: '800', color: '#dc2626' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  testName: { fontSize: 15, fontWeight: '600', color: '#dc2626', marginBottom: 6 },
  resultRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 8 },
  resultValue: { fontSize: 22, fontWeight: '800', color: '#dc2626' },
  reference: { fontSize: 12, color: '#6b7280' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#fecaca' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, color: '#9ca3af' },
  ackBtn: { backgroundColor: '#dc2626', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  ackText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
