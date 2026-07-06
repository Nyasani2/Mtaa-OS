import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, FileText, Search, Download, User, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

interface Invoice {
  id: string;
  invoice_number: string;
  patient_name: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  created_at: string;
  due_date: string;
}

export default function CashierInvoicesScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => { fetchInvoices(); }, [staffRecord?.facility_id]);

  const fetchInvoices = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('health_invoices')
        .select('id, invoice_number, patient_name, amount, status, created_at, due_date')
        .eq('facility_id', staffRecord.facility_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setInvoices(data || []);
    } catch (err) {
      console.error('Invoices error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return '#22c55e';
      case 'sent': return '#2563eb';
      case 'overdue': return '#ef4444';
      default: return '#9ca3af';
    }
  };

  const filtered = invoices.filter((i) => i.patient_name?.toLowerCase().includes(search.toLowerCase()) || i.invoice_number?.toLowerCase().includes(search.toLowerCase()));

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Invoices</Text>
      </View>

      <View style={styles.searchBox}>
        <Search size={18} color="#9ca3af" />
        <TextInput style={styles.searchInput} placeholder="Search invoices..." value={search} onChangeText={setSearch} placeholderTextColor="#9ca3af" />
      </View>

      {loading && !refreshing ? (
        <ActivityIndicator size="large" color="#0066cc" style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <FileText size={48} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No invoices found</Text>
        </View>
      ) : (
        filtered.map((i) => (
          <View key={i.id} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.invRow}>
                <FileText size={16} color="#0066cc" />
                <Text style={styles.invNumber}>{i.invoice_number}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(i.status) + '20' }]}>
                <Text style={[styles.statusText, { color: getStatusColor(i.status) }]}>{i.status}</Text>
              </View>
            </View>
            <View style={styles.patientRow}>
              <User size={14} color="#6b7280" />
              <Text style={styles.patientName}>{i.patient_name}</Text>
            </View>
            <Text style={styles.amountText}>KES {i.amount?.toLocaleString()}</Text>
            <View style={styles.dateRow}>
              <View style={styles.dateItem}><Calendar size={12} color="#9ca3af" /><Text style={styles.dateText}>Created: {new Date(i.created_at).toLocaleDateString()}</Text></View>
              <View style={styles.dateItem}><Calendar size={12} color="#9ca3af" /><Text style={styles.dateText}>Due: {new Date(i.due_date).toLocaleDateString()}</Text></View>
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
  invRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  invNumber: { fontSize: 14, fontWeight: '700', color: '#0066cc' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '700', textTransform: 'capitalize' },
  patientRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 4 },
  patientName: { fontSize: 13, color: '#6b7280' },
  amountText: { fontSize: 18, fontWeight: '800', color: '#1f2937', marginBottom: 6 },
  dateRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dateItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontSize: 11, color: '#9ca3af' },
});
