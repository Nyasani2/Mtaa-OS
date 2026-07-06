import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, BarChart3, Wallet, CreditCard, TrendingUp, Calendar } from 'lucide-react-native';
import { supabase } from '@/lib/supabase/client';
import { useHealthRole } from '@/lib/health/hooks';

export default function CashierRevenueScreen() {
  const router = useRouter();
  const { staffRecord } = useHealthRole();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchRevenue(); }, [staffRecord?.facility_id]);

  const fetchRevenue = async () => {
    if (!staffRecord?.facility_id) { setLoading(false); return; }
    setLoading(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { data: todayData, error: tErr } = await supabase
        .from('health_billing')
        .select('amount, payment_method')
        .eq('facility_id', staffRecord.facility_id)
        .eq('status', 'paid')
        .gte('created_at', today.toISOString());

      const totalToday = todayData?.reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0;
      const cashToday = todayData?.filter((r: any) => r.payment_method === 'cash').reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0;
      const mpesaToday = todayData?.filter((r: any) => r.payment_method === 'mpesa').reduce((s: number, r: any) => s + (r.amount || 0), 0) || 0;

      setStats({ totalToday, cashToday, mpesaToday, transactionCount: todayData?.length || 0 });
    } catch (err) {
      console.error('Revenue error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#22c55e" />
        <Text style={styles.loadingText}>Loading daily revenue...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><ArrowLeft size={24} color="#1f2937" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Daily Revenue</Text>
      </View>

      <View style={styles.totalCard}>
        <BarChart3 size={32} color="#22c55e" />
        <Text style={styles.totalLabel}>Today's Revenue</Text>
        <Text style={styles.totalValue}>KES {(stats?.totalToday || 0).toLocaleString()}</Text>
        <Text style={styles.transText}>{stats?.transactionCount || 0} transactions</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#f0fdf4' }]}>
          <Wallet size={24} color="#16a34a" />
          <Text style={styles.statValue}>KES {(stats?.cashToday || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>Cash</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#eff6ff' }]}>
          <CreditCard size={24} color="#2563eb" />
          <Text style={styles.statValue}>KES {(stats?.mpesaToday || 0).toLocaleString()}</Text>
          <Text style={styles.statLabel}>M-Pesa</Text>
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
  totalCard: { backgroundColor: '#fff', marginHorizontal: 16, marginTop: 8, padding: 24, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#e5e7eb' },
  totalLabel: { fontSize: 13, color: '#6b7280', marginTop: 8 },
  totalValue: { fontSize: 32, fontWeight: '800', color: '#1f2937', marginTop: 4 },
  transText: { fontSize: 13, color: '#9ca3af', marginTop: 4 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 10 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', gap: 6 },
  statValue: { fontSize: 16, fontWeight: '700', color: '#1f2937' },
  statLabel: { fontSize: 11, color: '#6b7280', fontWeight: '500' },
});
