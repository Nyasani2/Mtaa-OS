import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, CreditCard, Search, CheckCircle2, Clock, User } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface Payment {
  id: string;
  patient_name: string;
  amount: number;
  service: string;
  status: 'pending' | 'paid' | 'refunded';
  payment_method: string;
  created_at: string;
}

export default function CashierPaymentsScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchPayments(); }, [staffRecord?.facility_id]);

  const fetchPayments = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_billing')
        .select('id, patient_name, amount, service, status, payment_method, created_at')
        .eq('facility_id', staffRecord.facility_id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setPayments(data || []);
    } catch (err) {
      console.error('Payments error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const processPayment = async (id: string, method: string) => {
    try {
      const { error } = await supabase.from('health_billing').update({ status: 'paid', payment_method: method, paid_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      fetchPayments();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const getStatusColor = (s: string) => s === 'paid' ? '#22c55e' : s === 'refunded' ? '#ef4444' : '#f59e0b';
  const filtered = payments.filter((p) => p.patient_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayments(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Payments</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search patient..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#10b981" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <CreditCard size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No payments found</Text>
        </View>
      ) : (
        filtered.map((p) => (
          <View key={p.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.patientRow}>
                <User size={14} color="#6b7280" />
                <Text style={styles.patientName}>{p.patient_name || 'Unknown'}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(p.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(p.status) }]}>{p.status}</Text>
              </View>
            </View>
            <Text style={styles.serviceText}>{p.service}</Text>
            <Text style={styles.amountText}>KES {p.amount?.toLocaleString()}</Text>
            {p.status === 'pending' && (
              <View style={styles.actionsRow}>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#22c55e' }]} onPress={() => processPayment(p.id, 'cash')}>
                  <CheckCircle2 size={14} color="#fff" /><Text style={styles.payText}>Cash</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#2563eb' }]} onPress={() => processPayment(p.id, 'mpesa')}>
                  <CheckCircle2 size={14} color="#fff" /><Text style={styles.payText}>M-Pesa</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.payBtn, { backgroundColor: '#db2777' }]} onPress={() => processPayment(p.id, 'insurance')}>
                  <CheckCircle2 size={14} color="#fff" /><Text style={styles.payText}>Insurance</Text>
                </TouchableOpacity>
              </View>
            )}
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
  serviceText: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  amountText: { fontSize: 18, fontWeight: '800', color: '#1f2937' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#f3f4f6' },
  payBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  payText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
