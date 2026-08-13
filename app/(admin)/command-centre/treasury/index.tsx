import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface TreasuryAccount {
  id: string;
  account_code: string;
  account_name: string;
  account_type: string;
  current_balance: number;
  currency: string;
  status: string;
}

interface TreasuryRevenue {
  id: string;
  revenue_type: string;
  amount: number;
  source_module: string;
  description: string;
  status: string;
  created_at: string;
}

interface TreasuryCashflow {
  id: string;
  flow_type: string;
  amount: number;
  description: string;
  period: string;
}

export default function TreasuryDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [accounts, setAccounts] = useState<TreasuryAccount[]>([]);
  const [revenues, setRevenues] = useState<TreasuryRevenue[]>([]);
  const [cashflows, setCashflows] = useState<TreasuryCashflow[]>([]);
  const [stats, setStats] = useState({
    totalBalance: 0,
    totalRevenue: 0,
    totalExpenditure: 0,
    netCashflow: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Get treasury accounts
      const { data: accts } = await supabase
        .from('treasury_accounts')
        .select('*')
        .order('current_balance', { ascending: false });
      if (accts) setAccounts(accts);

      const totalBal = accts?.reduce((sum, a) => sum + (a.current_balance || 0), 0) || 0;

      // Get recent revenue
      const { data: revs } = await supabase
        .from('treasury_revenue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (revs) setRevenues(revs);

      const totalRev = revs?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // Get cashflow
      const { data: flows } = await supabase
        .from('treasury_cashflow')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (flows) setCashflows(flows);

      const inflow = flows?.filter((f: any) => f.flow_type === 'inflow').reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
      const outflow = flows?.filter((f: any) => f.flow_type === 'outflow').reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

      // Get expenditures
      const { data: exps } = await supabase
        .from('treasury_expenditures')
        .select('amount')
        .eq('status', 'approved');
      const totalExp = exps?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      setStats({
        totalBalance: totalBal,
        totalRevenue: totalRev,
        totalExpenditure: totalExp,
        netCashflow: inflow - outflow,
      });
    } catch (err) {
      console.error('Treasury dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);
  const onRefresh = () => { setRefreshing(true); loadData(); };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#00d4ff" />
        <Text style={styles.loadingText}>Loading Treasury...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MTAA Treasury</Text>
        <Text style={styles.headerSub}>Central Revenue & Expenditure Hub</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatBox title="Total Balance" value={`KES ${stats.totalBalance.toLocaleString()}`} icon="wallet-outline" color="#00d4ff" />
        <StatBox title="Revenue" value={`KES ${stats.totalRevenue.toLocaleString()}`} icon="trending-up-outline" color="#00cc66" />
        <StatBox title="Expenditure" value={`KES ${stats.totalExpenditure.toLocaleString()}`} icon="trending-down-outline" color="#ff4444" />
        <StatBox title="Net Cashflow" value={`KES ${stats.netCashflow.toLocaleString()}`} icon="swap-horizontal-outline" color="#ffaa00" />
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickRow}>
          <QuickAction icon="business-outline" label="Central Bank" onPress={() => router.push('/command-centre/treasury/central-bank' as any)} />
          <QuickAction icon="shield-checkmark-outline" label="Credit & Reg" onPress={() => router.push('/command-centre/treasury/credit-regulatory' as any)} />
          <QuickAction icon="cash-outline" label="Revenue" onPress={() => router.push('/command-centre/revenue' as any)} />
          <QuickAction icon="document-text-outline" label="Reports" onPress={() => router.push("/command-centre/reports" as any)} />
        </View>
      </View>

      {/* Treasury Accounts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Treasury Accounts</Text>
        {accounts.length === 0 ? (
          <Text style={styles.emptyText}>No accounts found</Text>
        ) : (
          accounts.map((account: any) => (
            <View key={account.id} style={styles.accountCard}>
              <View style={styles.accountLeft}>
                <View style={[styles.accountIcon, { backgroundColor: getAccountColor(account.account_type) + '22' }]}>
                  <Ionicons name={getAccountIcon(account.account_type) as any} size={20} color={getAccountColor(account.account_type)} />
                </View>
                <View>
                  <Text style={styles.accountName}>{account.account_name}</Text>
                  <Text style={styles.accountCode}>{account.account_code} · {account.account_type}</Text>
                </View>
              </View>
              <View style={styles.accountRight}>
                <Text style={styles.accountBalance}>KES {(account.current_balance || 0).toLocaleString()}</Text>
                <View style={[styles.statusBadge, account.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>{account.status}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Recent Revenue */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Revenue</Text>
        {revenues.length === 0 ? (
          <Text style={styles.emptyText}>No revenue recorded</Text>
        ) : (
          revenues.map((rev: any) => (
            <View key={rev.id} style={styles.revenueCard}>
              <View style={styles.revenueLeft}>
                <View style={[styles.revenueIcon, { backgroundColor: getModuleColor(rev.source_module) + '22' }]}>
                  <Ionicons name={getModuleIcon(rev.source_module) as any} size={16} color={getModuleColor(rev.source_module)} />
                </View>
                <View>
                  <Text style={styles.revenueDesc}>{rev.description || rev.revenue_type}</Text>
                  <Text style={styles.revenueSource}>{rev.source_module}</Text>
                </View>
              </View>
              <Text style={styles.revenueAmount}>+KES {(rev.amount || 0).toLocaleString()}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatBox({ title, value, icon, color }: { title: string; value: string; icon: string; color: string }) {
  return (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={22} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress}>
      <Ionicons name={icon as any} size={22} color="#00d4ff" />
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function getAccountIcon(type: string): string {
  const icons: Record<string, string> = {
    general: 'wallet-outline',
    revenue: 'trending-up-outline',
    expenditure: 'trending-down-outline',
    reserve: 'shield-outline',
    development: 'hammer-outline',
  };
  return icons[type] || 'wallet-outline';
}

function getAccountColor(type: string): string {
  const colors: Record<string, string> = {
    general: '#00d4ff',
    revenue: '#00cc66',
    expenditure: '#ff4444',
    reserve: '#ffaa00',
    development: '#8855ff',
  };
  return colors[type] || '#00d4ff';
}

function getModuleColor(module: string): string {
  const colors: Record<string, string> = {
    streets: '#ff0055',
    mtaxi: '#00cc66',
    shop: '#ffaa00',
    marketplace: '#00d4ff',
    jobs: '#8855ff',
    property: '#ff6600',
    restaurant: '#ff3366',
    education: '#3366ff',
    creator: '#ff00ff',
  };
  return colors[module] || '#888';
}

function getModuleIcon(module: string): string {
  const icons: Record<string, string> = {
    streets: 'videocam-outline',
    mtaxi: 'car-outline',
    shop: 'cart-outline',
    marketplace: 'storefront-outline',
    jobs: 'briefcase-outline',
    property: 'home-outline',
    restaurant: 'restaurant-outline',
    education: 'school-outline',
    creator: 'person-outline',
  };
  return icons[module] || 'cash-outline';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingText: { color: '#fff', fontSize: 16, marginTop: 16 },
  header: { padding: 20, paddingTop: 60, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#222' },
  backBtn: { marginBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 26, fontWeight: 'bold' },
  headerSub: { color: '#888', fontSize: 14, marginTop: 4 },
  statsRow: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, justifyContent: 'space-between' },
  statCard: { width: '48%', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, alignItems: 'center' },
  statValue: { fontSize: 16, fontWeight: 'bold', marginTop: 8 },
  statTitle: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { padding: 16, marginBottom: 8 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 12 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 8 },
  quickBtn: { alignItems: 'center', padding: 12 },
  quickLabel: { color: '#ccc', fontSize: 11, marginTop: 6 },
  emptyText: { color: '#666', fontSize: 14, fontStyle: 'italic' },
  accountCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 10 },
  accountLeft: { flexDirection: 'row', alignItems: 'center' },
  accountIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  accountName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  accountCode: { color: '#888', fontSize: 12, marginTop: 2 },
  accountRight: { alignItems: 'flex-end' },
  accountBalance: { color: '#fff', fontSize: 15, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginTop: 4 },
  statusActive: { backgroundColor: '#00cc6622' },
  statusInactive: { backgroundColor: '#ff444422' },
  statusText: { fontSize: 10, fontWeight: '600' },
  revenueCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 },
  revenueLeft: { flexDirection: 'row', alignItems: 'center' },
  revenueIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  revenueDesc: { color: '#fff', fontSize: 14, fontWeight: '500' },
  revenueSource: { color: '#888', fontSize: 11, marginTop: 2 },
  revenueAmount: { color: '#00cc66', fontSize: 14, fontWeight: '600' },
});
