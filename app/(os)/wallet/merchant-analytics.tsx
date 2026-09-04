import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { shopService } from '@/domains/shop/services/shopService';
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
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      // Resolve shop ID
      const shopId = id || user.id;

      // Get business name from shops table
      const shop = await shopService.getShopById(shopId);
      if (shop?.name) setBusinessName(shop.name);

      // Calculate date range
      const now = new Date();
      let startDate = new Date();
      if (period === 'today') startDate.setHours(0, 0, 0, 0);
      else if (period === 'week') startDate.setDate(now.getDate() - 7);
      else if (period === 'month') startDate.setMonth(now.getMonth() - 1);
      else startDate.setFullYear(now.getFullYear() - 1);

      const startIso = startDate.toISOString();

      // Fetch real transactions from shop_orders
      const { data: txs } = await supabase
        .from('shop_orders')
        .select('total_amount, payment_status, customer_id, created_at')
        .eq('shop_id', shopId)
        .gte('created_at', startIso)
        .order('created_at', { ascending: false });

      const revenue = (txs || [])
        .filter((t: any) => t.payment_status === 'paid')
        .reduce((s: number, t: any) => s + (t.total_amount || 0), 0);

      const txCount = (txs || []).length;
      const uniqueCustomers = new Set((txs || []).map((t: any) => t.customer_id).filter(Boolean)).size;
      const avgOrder = txCount > 0 ? revenue / txCount : 0;

      setStats({
        period,
        revenue,
        transactions: txCount,
        customers: uniqueCustomers,
        avgOrderValue: avgOrder,
      });

      // Fetch real top products from shop_order_items
      const realTop = await shopService.getTopProducts(shopId, 5);
      if (realTop.length > 0) {
        setTopProducts(realTop);
      } else {
        // Fallback: show empty state instead of fake data
        setTopProducts([]);
      }
    } catch (err: any) {
      console.error('[MerchantAnalytics] Error:', err);
      setError(err.message || 'Failed to load analytics');
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

  const formatCurrency = (n: number) => `KES ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
          <Text style={styles.headerTitle}>Analytics</Text>
          <Text style={styles.headerSub}>{businessName}</Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {(['today', 'week', 'month', 'year'] as const).map((p) => (
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

        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {loading && !stats ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#2196F3" />
            <Text style={styles.loadingText}>Loading analytics...</Text>
          </View>
        ) : (
          <>
            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(stats?.revenue || 0)}</Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.transactions || 0}</Text>
                <Text style={styles.statLabel}>Orders</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats?.customers || 0}</Text>
                <Text style={styles.statLabel}>Customers</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{formatCurrency(stats?.avgOrderValue || 0)}</Text>
                <Text style={styles.statLabel}>Avg Order</Text>
              </View>
            </View>

            {/* Top Products */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Top Products</Text>
              {topProducts.length === 0 ? (
                <Text style={styles.emptyText}>No sales data for this period</Text>
              ) : (
                topProducts.map((product, idx) => (
                  <View key={idx} style={styles.productRow}>
                    <View style={styles.productRank}>
                      <Text style={styles.productRankText}>{idx + 1}</Text>
                    </View>
                    <View style={styles.productInfo}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <Text style={styles.productSales}>{product.sales} sold</Text>
                    </View>
                    <Text style={styles.productRevenue}>{formatCurrency(product.revenue)}</Text>
                  </View>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20, paddingTop: 8 },
  backBtn: { marginBottom: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 14, color: '#64748B', marginTop: 4 },
  periodRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 8, marginBottom: 16 },
  periodBtn: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, backgroundColor: '#E2E8F0' },
  periodBtnActive: { backgroundColor: '#2196F3' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  periodTextActive: { color: '#fff' },
  errorBanner: { marginHorizontal: 20, marginBottom: 12, padding: 12, backgroundColor: '#FEF2F2', borderRadius: 8, borderWidth: 1, borderColor: '#FECACA' },
  errorText: { color: '#DC2626', fontSize: 14 },
  centered: { paddingVertical: 40, alignItems: 'center' },
  loadingText: { marginTop: 12, color: '#64748B' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 12, marginBottom: 24 },
  statCard: { width: (width - 52) / 2, backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  statValue: { fontSize: 16, fontWeight: '700', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4 },
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0F172A', marginBottom: 12 },
  emptyText: { color: '#94A3B8', fontSize: 14, textAlign: 'center', paddingVertical: 20 },
  productRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  productRank: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  productRankText: { fontSize: 12, fontWeight: '700', color: '#2196F3' },
  productInfo: { flex: 1, marginLeft: 12 },
  productName: { fontSize: 14, fontWeight: '600', color: '#0F172A' },
  productSales: { fontSize: 12, color: '#64748B', marginTop: 2 },
  productRevenue: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
});
