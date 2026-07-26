import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface PayrollRecord {
  id: string;
  teacher_id: string;
  month: string;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_pay: number;
  currency: string;
  status: string;
  paid_at: string | null;
  created_at: string;
}

export default function PayrollScreen() {
  const router = useRouter();
  const { user, session } = useAuthStore();
  const [payrolls, setPayrolls] = useState<PayrollRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [summary, setSummary] = useState({ totalPaid: 0, totalPending: 0, count: 0 });

  const fetchPayroll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_payroll')
        .select('*')
        .eq('teacher_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPayrolls(data || []);

      // Calculate summary
      const paid = (data || []).filter((p: PayrollRecord) => p.status === 'paid').reduce((s: number, p: PayrollRecord) => s + p.net_pay, 0);
      const pending = (data || []).filter((p: PayrollRecord) => p.status === 'pending').reduce((s: number, p: PayrollRecord) => s + p.net_pay, 0);
      setSummary({ totalPaid: paid, totalPending: pending, count: data?.length || 0 });
    } catch (err: any) {
      console.error('Fetch payroll error:', err);
      Alert.alert('Error', err.message || 'Failed to load payroll records');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);


  useEffect(() => {
    fetchPayroll();
  }, [fetchPayroll]);

  // Auth guard
  if (!user || !session) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sign In Required</Text>
        <Text style={styles.subtitle}>Please sign in to view payroll.</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPayroll();
  };

  const renderItem = ({ item }: { item: PayrollRecord }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.month} {item.year}</Text>
        <View style={[styles.badge, item.status === 'paid' ? styles.paidBadge : styles.pendingBadge]}>
          <Text style={styles.badgeText}>{item.status.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={styles.cardAmount}>
        {item.currency} {item.net_pay.toLocaleString()}
      </Text>
      <View style={styles.cardDetails}>
        <Text style={styles.cardDetail}>Basic: {item.currency} {item.basic_salary.toLocaleString()}</Text>
        <Text style={styles.cardDetail}>Allowances: {item.currency} {item.allowances.toLocaleString()}</Text>
        <Text style={styles.cardDetail}>Deductions: {item.currency} {item.deductions.toLocaleString()}</Text>
      </View>
      {item.paid_at && (
        <Text style={styles.paidDate}>Paid on {new Date(item.paid_at).toLocaleDateString()}</Text>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Payroll</Text>

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.count}</Text>
          <Text style={styles.summaryLabel}>Records</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.totalPaid.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Total Paid</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{summary.totalPending.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Pending</Text>
        </View>
      </View>

      <FlatList
        data={payrolls}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No payroll records</Text>
            <Text style={styles.emptySubtext}>Your payroll history will appear here.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },
  header: { fontSize: 24, fontWeight: '700', color: '#fff', padding: 20, paddingBottom: 10 },
  title: { fontSize: 20, fontWeight: '600', color: '#fff', textAlign: 'center', marginTop: 40 },
  subtitle: { fontSize: 14, color: '#888', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  summaryValue: { fontSize: 18, fontWeight: '700', color: '#fff' },
  summaryLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  list: { padding: 20, paddingTop: 0, paddingBottom: 40 },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#fff' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paidBadge: { backgroundColor: '#22c55e' },
  pendingBadge: { backgroundColor: '#f59e0b' },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  cardAmount: { fontSize: 20, fontWeight: '700', color: '#2563eb', marginBottom: 8 },
  cardDetails: { gap: 2 },
  cardDetail: { fontSize: 13, color: '#aaa' },
  paidDate: { fontSize: 12, color: '#22c55e', marginTop: 8 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#888', fontWeight: '600' },
  emptySubtext: { fontSize: 13, color: '#666', marginTop: 4 },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 40,
    marginTop: 24,
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});