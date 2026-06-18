import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { useWalletStore } from '@/lib/stores/wallet-store';
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
  const { balance } = useWalletStore();

  const [business, setBusiness] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStat[]>([]);
  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('today');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) loadBusinessData(id);
  }, [id, period]);

  const loadBusinessData = async (bizId: string) => {
    setLoading(true);
    const { data: bizData } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('id', bizId)
      .single();
    if (bizData) setBusiness(bizData);

    const { data: txData } = await supabase
      .from('business_transactions')
      .select('*')
      .eq('business_id', bizId)
      .order('created_at', { ascending: false })
      .limit(20);
    if (txData) setTransactions(txData);

    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const stats: DailyStat[] = days.map((day) => ({
      day,
      revenue: Math.floor(Math.random() * 50000) + 5000,
      transactions: Math.floor(Math.random() * 30) + 5,
    }));
    setDailyStats(stats);
    setLoading(false);
  };

  const getPeriodRevenue = () => {
    if (period === 'today') return business?.revenue_today || 0;
    if (period === 'week') return (business?.revenue_month || 0) * 0.25;
    return business?.revenue_month || 0;
  };

  const getPeriodTxCount = () => {
    if (period === 'today') return Math.floor((business?.transaction_count || 0) * 0.05);
    if (period === 'week') return Math.floor((business?.transaction_count || 0) * 0.25);
    return business?.transaction_count || 0;
  };

  const getTxIcon = (type: string) => {
    switch (type) {
      case 'payment_received': return { name: 'arrow-down-circle', color: '#22C55E' };
      case 'payment_sent': return { name: 'arrow-up-circle', color: '#EF4444' };
      case 'refund': return { name: 'return-up-back', color: '#F59E0B' };
      default: return { name: 'cash', color: '#6B7280' };
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

  const maxRevenue = Math.max(...dailyStats.map((s) => s.revenue), 1);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>{business?.name || 'Dashboard'}</Text>
          <Text style={styles.headerSub}>{business?.type || 'Business'}</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/business-documents')}>
          <Ionicons name="document-text" size={22} color="#60A5FA" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
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

        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Text style={styles.revenueLabel}>Revenue ({period})</Text>
            <View style={styles.revenueBadge}>
              <Text style={styles.revenueBadgeText}>+12.5%</Text>
            </View>
          </View>
          <Text style={styles.revenueValue}>KES {getPeriodRevenue().toLocaleString()}</Text>
          <Text style={styles.revenueSub}>{getPeriodTxCount()} transactions</Text>

          <View style={styles.chartRow}>
            {dailyStats.map((stat, i) => (
              <View key={i} style={styles.chartCol}>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${(stat.revenue / maxRevenue) * 100}%` },
                      i === dailyStats.length - 1 && { backgroundColor: '#3B82F6' },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{stat.day}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="cash-plus" size={22} color="#22C55E" />
            <Text style={styles.statValue}>KES {(business?.revenue_today || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="account-group" size={22} color="#60A5FA" />
            <Text style={styles.statValue}>{transactions.length}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="trending-up" size={22} color="#F59E0B" />
            <Text style={styles.statValue}>KES {Math.round((business?.revenue_month || 0) / 30).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Avg Daily</Text>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/merchant-analytics")}>
            <View style={[styles.actionIcon, { backgroundColor: '#1E3A5F' }]}>
              <Ionicons name="qr-code" size={20} color="#60A5FA" />
            </View>
            <Text style={styles.actionText}>Receive</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/merchant-analytics")}>
            <View style={[styles.actionIcon, { backgroundColor: '#064E3B' }]}>
              <Ionicons name="send" size={20} color="#34D399" />
            </View>
            <Text style={styles.actionText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/merchant-analytics")}>
            <View style={[styles.actionIcon, { backgroundColor: '#451A03' }]}>
              <Ionicons name="people" size={20} color="#FBBF24" />
            </View>
            <Text style={styles.actionText}>Customers</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push("/(os)/wallet/merchant-customers")}>
            <View style={[styles.actionIcon, { backgroundColor: '#312E81' }]}>
              <Ionicons name="settings" size={20} color="#A78BFA" />
            </View>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="receipt-text-outline" size={40} color="#6B7280" />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          ) : (
            transactions.slice(0, 10).map((tx) => {
              const icon = getTxIcon(tx.type);
              return (
                <View key={tx.id} style={styles.txCard}>
                  <View style={[styles.txIcon, { backgroundColor: icon.color + '15' }]}>
                    <Ionicons name={icon.name as any} size={20} color={icon.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txName}>{tx.customer_name || 'Customer'}</Text>
                    <Text style={styles.txDesc}>{tx.description}</Text>
                    <Text style={styles.txTime}>{new Date(tx.created_at).toLocaleString()}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={[styles.txAmount, { color: icon.color }]}>
                      {tx.type === 'payment_received' ? '+' : '-'}KES {tx.amount.toLocaleString()}
                    </Text>
                    <View style={[styles.txStatusBadge, { backgroundColor: getTxStatusColor(tx.status) + '20' }]}>
                      <Text style={[styles.txStatusText, { color: getTxStatusColor(tx.status) }]}>
                        {tx.status}
                      </Text>
                    </View>
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
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerCenter: { flex: 1, marginLeft: 12 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  periodRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 12,
    gap: 8,
  },
  periodBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#1E293B',
    alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: '#3B82F6' },
  periodText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  periodTextActive: { color: '#fff' },
  revenueCard: {
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  revenueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueLabel: { fontSize: 13, color: '#94A3B8' },
  revenueBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  revenueBadgeText: { fontSize: 11, fontWeight: '700', color: '#34D399' },
  revenueValue: { fontSize: 28, fontWeight: '800', color: '#fff', marginTop: 8 },
  revenueSub: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  chartRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 18,
    height: 80,
    alignItems: 'flex-end',
  },
  chartCol: { alignItems: 'center', flex: 1 },
  barBg: {
    width: 16,
    height: 60,
    backgroundColor: '#334155',
    borderRadius: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: { fontSize: 10, color: '#6B7280', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 14,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: { fontSize: 13, fontWeight: '700', color: '#fff', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2, textAlign: 'center' },
  actionsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    marginTop: 16,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 11, fontWeight: '600', color: '#E2E8F0', marginTop: 6 },
  section: { paddingHorizontal: 16, marginTop: 20, paddingBottom: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  seeAll: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  emptyText: { fontSize: 13, color: '#6B7280', marginTop: 8 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txInfo: { flex: 1, marginLeft: 10 },
  txName: { fontSize: 13, fontWeight: '600', color: '#fff' },
  txDesc: { fontSize: 11, color: '#94A3B8', marginTop: 1 },
  txTime: { fontSize: 10, color: '#6B7280', marginTop: 2 },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 13, fontWeight: '700' },
  txStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  txStatusText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
});

