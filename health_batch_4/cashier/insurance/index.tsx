import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Shield, Search, CheckCircle2, Clock, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface InsuranceClaim {
  id: string;
  patient_name: string;
  provider: string;
  policy_number: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  submitted_at: string;
}

export default function CashierInsuranceScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchClaims(); }, [staffRecord?.facility_id]);

  const fetchClaims = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_insurance_claims')
        .select('id, patient_name, provider, policy_number, amount, status, submitted_at')
        .eq('facility_id', staffRecord.facility_id)
        .order('submitted_at', { ascending: false });
      if (error) throw error;
      setClaims(data || []);
    } catch (err) {
      console.error('Insurance error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'approved': return '#22c55e';
      case 'paid': return '#2563eb';
      case 'rejected': return '#ef4444';
      default: return '#f59e0b';
    }
  };

  const filtered = claims.filter((c) => c.patient_name?.toLowerCase().includes(search.toLowerCase()) || c.provider?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchClaims(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Insurance Claims</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search claims..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Shield size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No claims found</Text>
        </View>
      ) : (
        filtered.map((c) => (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.patientRow}>
                <User size={14} color="#6b7280" />
                <Text style={styles.patientName}>{c.patient_name}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(c.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(c.status) }]}>{c.status}</Text>
              </View>
            </View>
            <Text style={styles.providerText}>{c.provider} · {c.policy_number}</Text>
            <Text style={styles.amountText}>KES {c.amount?.toLocaleString()}</Text>
            <View style={styles.timeRow}>
              <Clock size={12} color="#9ca3af" />
              <Text style={styles.timeText}>{new Date(c.submitted_at).toLocaleDateString()}</Text>
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
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', marginHorizontal: 16, marginVertical: 10, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb', gap: 8 },
  searchInput: { flex: 1, fontSize: 15, color: '#1f2937' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  card: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#e5e7eb' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  patientName: { fontSize: 14, fontWeight: '700', color: '#1f2937' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  providerText: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  amountText: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  timeText: { fontSize: 11, color: '#9ca3af' },
});
