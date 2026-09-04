// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { shopService } from '@/domains/shop/services/shopService';
import { supabase } from '@/lib/supabase';

interface Transaction {
  id: string;
  type: 'payment_received' | 'payment_sent' | 'refund' | 'withdrawal';
  amount: number;
  customer_name: string;
  description: string;
  created_at: string;
  status: 'completed' | 'pending' | 'failed';
}

interface DailyStat {
  day: string;
  revenue: number;
  transactions: number;
}

export default function MerchantDashboardScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [shop, setShop] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBusinessData = useCallback(async (bizId: string) => {
    setLoading(true);
    try {
      // Load real shop data from shops table
      const shopData = await shopService.getShopById(bizId);
      setShop(shopData);

      // Load real transactions from shop_orders
      const { data: txData } = await supabase
        .from('shop_orders')
        .select('id, total_amount, payment_status, customer_name, created_at, status')
        .eq('shop_id', bizId)
        .order('created_at', { ascending: false })
        .limit(20);

      const mappedTx: Transaction[] = (txData || []).map((row: any) => ({
        id: row.id,
        type: row.payment_status === 'paid' ? 'payment_received' : 'pending',
        amount: row.total_amount || 0,
        customer_name: row.customer_name || 'Customer',
        description: `Order #${row.id.slice(0, 8)}`,
        created_at: row.created_at,
        status: row.payment_status === 'paid' ? 'completed' : row.payment_status || 'pending',
      }));
      setTransactions(mappedTx);

      // Calculate real daily stats from shop_orders
      const now = new Date();
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const stats: DailyStat[] = [];

      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
        const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();

        const { data: dayOrders } = await supabase
          .from('shop_orders')
          .select('total_amount')
          .eq('shop_id', bizId)
          .eq('payment_status', 'paid')
          .gte('created_at', dayStart)
          .lt('created_at', dayEnd);

        const revenue = (dayOrders || []).reduce((s: number, r: any) => s + (r.total_amount || 0), 0);
        stats.push({
          day: days[d.getDay()],
          revenue,
          transactions: (dayOrders || []).length,
        });
      }
      setDailyStats(stats);
    } catch (err) {
      console.error('[MerchantDashboard] Error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) loadBusinessData(id);
  }, [id, period, loadBusinessData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (id) await loadBusinessData(id);
    setRefreshing(false);
  }, [id, loadBusinessData]);

  const getPeriodRevenue = () => {
    const now = new Date();
    let start = new Date(now);
    if (period === 'today') start.setHours(0, 0, 0, 0);
    else if (period === 'week') start.setDate(now.getDate() - 7);
    else start.setMonth(now.getMonth() - 1);

    return dailyStats
      .filter((s) => {
        // Simple filter: for demo we sum all loaded stats
        // In production, filter by actual date range
        return true;
      })
      .reduce((sum, s) => sum + s.revenue, 0);
  };

  const getPeriodTxCount = () => {
    return dailyStats.reduce((sum, s) => sum + s.transactions, 0);
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return { name: 'arrow-down-circle' as const, color: '#22C55E' };
      case 'payment_sent': return { name: 'arrow-up-circle' as const, color: '#EF4444' };
      case 'refund': return { name: 'return-up-back' as const, color: '#F59E0B' };
      default: return { name: 'cash' as const, color: '#6B7280' };
    }
  };

  const getTxStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#22C55E';
      case 'pending': return '#F59E0B';
      case 'failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  if (loading && !shop) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading shop data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#0F172A" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{shop?.name || 'My Business'}</Text>
          <Text style={styles.headerSub}>{shop?.category || 'Merchant'} • {shop?.location || 'No location'}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['today', 'week', 'month'] as const).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="cash-multiple" size={24} color="#2196F3" />
            <Text style={styles.statValue}>KES {getPeriodRevenue().toLocaleString()}</Text>
            <Text style={styles.statLabel}>Revenue</Text>
          </View>
          <View style={styles.statCard}>
            <MaterialCommunityIcons name="receipt" size={24} color="#10B981" />
            <Text style={styles.statValue}>{getPeriodTxCount()}</Text>
            <Text style={styles.statLabel}>Orders</Text>
          </View>
        </View>

        {/* Daily Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Daily Performance</Text>
          <View style={styles.chartRow}>
            {dailyStats.map((stat, idx) => {
              const maxRev = Math.max(...dailyStats.map((s) => s.revenue), 1);
              const height = (stat.revenue / maxRev) * 100;
              return (
                <View key={idx} style={styles.chartBarWrap}>
                  <View style={[styles.chartBar, { height: Math.max(height, 4) }]} />
                  <Text style={styles.chartLabel}>{stat.day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          {transactions.length === 0 ? (
            <Text style={styles.emptyText}>No transactions yet</Text>
          ) : (
            transactions.map((tx) => {
              const icon = getTxIcon(tx.type);
              return (
                <View key={tx.id} style={styles.txRow}>
                  <Ionicons name={icon.name} size={24} color={icon.color} />
                  <View style={styles.txInfo}>
                    <Text style={styles.txTitle}>{tx.description}</Text>
                    <Text style={styles.txSub}>{tx.customer_name} • {new Date(tx.created_at).toLocaleDateString()}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>KES {tx.amount.toLocaleString()}</Text>
                    <Text style={[styles.txStatus, { color: getTxStatusColor(tx.status) }]}>{tx.status}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B' },
  header: { padding: 20, paddingTop: 8 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  periodBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E2E8F0' },
  periodBtnActive: { backgroundColor: '#2196F3' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  periodTextActive: { color: '#fff' },
  statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#0F172A', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  chartRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', height: 120, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  chartBarWrap: { alignItems: 'center', flex: 1 },
  chartBar: { width: 8, backgroundColor: '#2196F3', borderRadius: 4, minHeight: 4 },
  chartLabel: { fontSize: 10, color: '#64748B', marginTop: 6 },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  txRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  txInfo: { flex: 1, marginLeft: 12 },
  txTitle: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  txSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  txStatus: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
