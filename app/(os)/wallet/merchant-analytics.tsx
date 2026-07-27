import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  ActivityIndicator, RefreshControl, Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface PeriodStat {
  period: string;
  revenue: number;
  transactions: number;
  customers: number;
  avgOrderValue: number;
}

interface TopProduct {
  name: string;
  sales: number;
  revenue: number;
}

export default function MerchantAnalyticsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [period, setPeriod] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const [stats, setStats] = useState<PeriodStat | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [businessName, setBusinessName] = useState('My Business');

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      // Get business name
      const { data: biz } = await supabase
        .from('business_profiles')
        .select('name')
        .eq('owner_id', user.id)
        .maybeSingle();
      if (biz?.name) setBusinessName(biz.name);

      // Get transactions for period
      const now = new Date();
      const startDate = new Date();
      if (period === 'today') startDate.setHours(0, 0, 0, 0);
      else if (period === 'week') startDate.setDate(now.getDate() - 7);
      else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 1);

      const { data: txs } = await supabase
        .from('business_transactions')
        .select('*')
        .eq('business_id', id || user.id)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      const revenue = (txs || []).filter(t => t.status === 'completed').reduce((s, t) => s + (t.amount || 0), 0);
      const txCount = (txs || []).length;
      const uniqueCustomers = new Set((txs || []).map(t => t.customer_id).filter(Boolean)).size;
      const avgOrder = txCount > 0 ? revenue / txCount : 0;

      setStats({
        period,
        revenue,
        transactions: txCount,
        customers: uniqueCustomers,
        avgOrderValue: avgOrder,
      });

      // Mock top products (replace with real query when products table exists)
      setTopProducts([
        { name: 'Product A', sales: 45, revenue: 22500 },
        { name: 'Product B', sales: 32, revenue: 16000 },
        { name: 'Product C', sales: 28, revenue: 14000 },
        { name: 'Product D', sales: 19, revenue: 9500 },
      ]);
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, period, id]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }, [fetchAnalytics]);

  const formatKES = (n: number) => `KES ${n.toLocaleString()}`;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{businessName}</Text>
        <Text style={styles.headerSubtitle}>Analytics</Text>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['today', 'week', 'month', 'year'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodChip, period === p && styles.periodChipActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scrollContent}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#22C55E" style={{ marginTop: 40 }} />
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Ionicons name="cash-outline" size={22} color="#22C55E" />
                <Text style={styles.statValue}>{formatKES(stats?.revenue || 0)}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="receipt-outline" size={22} color="#3B82F6" />
                <Text style={styles.statValue}>{stats?.transactions || 0}</Text>
                <Text style={styles.statLabel}>Transactions</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="people-outline" size={22} color="#8B5CF6" />
                <Text style={styles.statValue}>{stats?.customers || 0}</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
              <View style={styles.statCard}>
                <Ionicons name="trending-up-outline" size={22} color="#F59E0B" />
                <Text style={styles.statValue}>{formatKES(Math.round(stats?.avgOrderValue || 0))}</Text>
                <Text style={styles.statLabel}>Avg Order</Text>
              </View>
            </View>

            {/* Top Products */}
            <Text style={styles.sectionTitle}>Top Products</Text>
            {topProducts.map((product, i) => (
              <View key={i} style={styles.productRow}>
                <View style={styles.productRank}><Text style={styles.productRankText}>{i + 1}</Text></View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productSales}>{product.sales} sales</Text>
                </View>
                <Text style={styles.productRevenue}>{formatKES(product.revenue)}</Text>
              </View>
            ))}

            {/* Action Buttons */}
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/wallet/merchant-dashboard')}>
                <Ionicons name="storefront-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Dashboard</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]} onPress={() => router.push('/(os)/wallet/merchant-customers')}>
                <Ionicons name="people-outline" size={20} color="#fff" />
                <Text style={styles.actionBtnText}>Customers</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0F' },
  header: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { padding: 4, marginBottom: 8 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#8E8E93', marginTop: 2 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  periodChip: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#1C1C1E', alignItems: 'center' },
  periodChipActive: { backgroundColor: '#22C55E' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#8E8E93' },
  periodTextActive: { color: '#fff' },
  scrollContent: { padding: 16, paddingBottom: 40 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { width: (width - 42) / 2, backgroundColor: '#1C1C1E', borderRadius: 16, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#8E8E93', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1C1C1E', borderRadius: 12, padding: 14, marginBottom: 8 },
  productRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#22C55E20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  productRankText: { fontSize: 12, fontWeight: '700', color: '#22C55E' },
  productInfo: { flex: 1 },
  productName: { fontSize: 15, fontWeight: '600', color: '#fff' },
  productSales: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  productRevenue: { fontSize: 14, fontWeight: '700', color: '#22C55E' },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#22C55E', borderRadius: 12, paddingVertical: 14, gap: 8 },
  actionBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});
