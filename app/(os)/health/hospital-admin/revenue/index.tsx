import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Wallet, TrendingUp, Users, CreditCard, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useHealthRole } from '@/lib/health/hooks';

export default function HospitalRevenueScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => { fetchRevenue(); }, [period, staffRecord?.facility_id]);

  const fetchRevenue = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const now = new Date();
      let startDate = new Date();
      if (period === 'today') startDate.setHours(0, 0, 0, 0);
      else if (period === 'week') startDate.setDate(now.getDate() - 7);
      else startDate.setMonth(now.getMonth() - 1);

      const { data: billing, error: bErr } = await supabase
        .from('health_billing')
        .select('amount, status, payment_method')
        .eq('facility_id', staffRecord.facility_id)
        .gte('created_at', startDate.toISOString());

      const paid = billing?.filter((r: any) => r.status === 'paid') || [];
      const pending = billing?.filter((r: any) => r.status === 'pending') || [];
      const totalPaid = paid.reduce((s: number, r: any) => s + (r.amount || 0), 0);
      const totalPending = pending.reduce((s: number, r: any) => s + (r.amount || 0), 0);

      setStats({
        totalPaid,
        totalPending,
        transactionCount: billing?.length || 0,
        cash: paid.filter((r: any) => r.payment_method === 'cash').reduce((s: number, r: any) => s + (r.amount || 0), 0),
        mpesa: paid.filter((r: any) => r.payment_method === 'mpesa').reduce((s: number, r: any) => s + (r.amount || 0), 0),
        insurance: paid.filter((r: any) => r.payment_method === 'insurance').reduce((s: number, r: any) => s + (r.amount || 0), 0),
      });
    } catch (err) {
      console.error('Revenue error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Loading revenue...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Revenue</Text>
      </View>

      <View style={styles.periodRow}>
        {(['today', 'week', 'month'] as const).map((p) => (
          <TouchableOpacity key={p} style={[styles.periodChip, period === p && styles.periodChipActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p === 'today' ? 'Today' : p === 'week' ? 'This Week' : 'This Month'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.totalCard}>
        <Wallet size={32} color="#10b981" />
        <Text style={styles.totalLabel}>Total Revenue</Text>
        <Text style={styles.totalValue}>KES {(stats?.totalPaid || 0).toLocaleString()}</Text>
        <Text style={styles.pendingText}>Pending: KES {(stats?.totalPending || 0).toLocaleString()}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
          <CreditCard size={20} color="#16a34a" />
          <Text style={styles.statValue}>KES {(stats?.cash || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Cash</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <Wallet size={20} color="#2563eb" />
          <Text style={styles.statValue}>KES {(stats?.mpesa || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>M-Pesa</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fdf2f8' }]}>
          <TrendingUp size={20} color="#db2777" />
          <Text style={styles.statValue}>KES {(stats?.insurance || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Insurance</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#fefce8' }]}>
          <Users size={20} color="#ca8a04" />
          <Text style={styles.statValue}>{stats?.transactionCount || 0}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, color: '#6b7280', fontSize: 14 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#1f2937' },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  periodChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e5e7eb' },
  periodChipActive: { backgroundColor: '#10b981', borderColor: '#10b981' },
  periodText: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  periodTextActive: { color: '#fff' },
  totalCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  totalLabel: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  totalValue: { fontSize: 32, fontWeight: '800', color: '#1f2937', marginTop: 4 },
  pendingText: { fontSize: 13, color: '#f59e0b', marginTop: 4 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  statCard: { width: '47%', padding: 16, borderRadius: 12, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
});
