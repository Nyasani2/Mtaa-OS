// app/(os)/wallet/treasury-hub.tsx
// MTAA Treasury Hub -- Revenue collection, expenditure tracking, budget monitoring

import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getTreasuryDashboard,
  getRevenueCollections,
  getExpenditures,
  getBudgets,
  getMtaaTreasury,
} from '@/lib/services/treasury-service';

export default function TreasuryHubScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);
  const [revenue, setRevenue] = useState<any[]>([]);
  const [expenditures, setExpenditures] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [treasury, setTreasury] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'expenditure' | 'budgets'>('overview');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [dash, rev, exp, bud, treas] = await Promise.allSettled([
        getTreasuryDashboard(),
        getRevenueCollections({ limit: 10 }),
        getExpenditures({ limit: 10 }),
        getBudgets(),
        getMtaaTreasury(),
      ]);
      if (dash.status === 'fulfilled') setDashboard(dash.value);
      if (rev.status === 'fulfilled') setRevenue(rev.value?.collections || []);
      if (exp.status === 'fulfilled') setExpenditures(exp.value?.expenditures || []);
      if (bud.status === 'fulfilled') setBudgets(bud.value?.budgets || []);
      if (treas.status === 'fulfilled') setTreasury(treas.value);
    } catch (err) { console.error('[TreasuryHub] Load error:', err); }
    finally { setLoading(false); }
  }

  const totalRevenue = revenue.reduce((sum, r) => sum + (r.amount || 0), 0);
  const totalExpenditure = expenditures.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Treasury Hub</Text>
        <TouchableOpacity onPress={loadData}>
          <Ionicons name="refresh" size={22} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        {(['overview', 'revenue', 'expenditure', 'budgets'] as const).map((tab) => (
          <TouchableOpacity key={tab} onPress={() => setActiveTab(tab)} style={[styles.tab, activeTab === tab && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#6366f1" />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && (
            <View>
              <View style={styles.summaryRow}>
                <View style={[styles.summaryCard, { backgroundColor: '#dcfce7' }]}>
                  <Ionicons name="trending-up" size={24} color="#059669" />
                  <Text style={styles.summaryLabel}>Total Revenue</Text>
                  <Text style={styles.summaryValue}>KSh {totalRevenue.toLocaleString('en-KE')}</Text>
                </View>
                <View style={[styles.summaryCard, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="trending-down" size={24} color="#dc2626" />
                  <Text style={styles.summaryLabel}>Total Spent</Text>
                  <Text style={styles.summaryValue}>KSh {totalExpenditure.toLocaleString('en-KE')}</Text>
                </View>
              </View>

              <View style={[styles.summaryCard, { backgroundColor: '#e0e7ff', marginHorizontal: 16, marginTop: 12 }]}>
                <Ionicons name="wallet" size={24} color="#4338ca" />
                <Text style={styles.summaryLabel}>MTAA Treasury Balance</Text>
                <Text style={styles.summaryValue}>KSh {(treasury?.total_raised || 0).toLocaleString('en-KE')}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Recent Revenue</Text>
                {revenue.slice(0, 5).map((r) => (
                  <View key={r.id} style={styles.listItem}>
                    <View style={styles.listIcon}>
                      <Ionicons name="cash-outline" size={18} color="#059669" />
                    </View>
                    <View style={styles.listInfo}>
                      <Text style={styles.listTitle}>{r.source || 'Revenue'}</Text>
                      <Text style={styles.listMeta}>{new Date(r.collected_at).toLocaleDateString('en-KE')}</Text>
                    </View>
                    <Text style={[styles.listAmount, { color: '#059669' }]}>+KSh {(r.amount || 0).toLocaleString('en-KE')}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {activeTab === 'revenue' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Revenue Collections</Text>
              {revenue.map((r) => (
                <View key={r.id} style={styles.listItem}>
                  <View style={[styles.listIcon, { backgroundColor: '#dcfce7' }]}>
                    <Ionicons name="cash-outline" size={18} color="#059669" />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{r.source || 'Revenue'}</Text>
                    <Text style={styles.listMeta}>{r.status} &middot; {new Date(r.collected_at).toLocaleDateString('en-KE')}</Text>
                  </View>
                  <Text style={[styles.listAmount, { color: '#059669' }]}>+KSh {(r.amount || 0).toLocaleString('en-KE')}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'expenditure' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>All Expenditures</Text>
              {expenditures.map((e) => (
                <View key={e.id} style={styles.listItem}>
                  <View style={[styles.listIcon, { backgroundColor: '#fee2e2' }]}>
                    <Ionicons name="card-outline" size={18} color="#dc2626" />
                  </View>
                  <View style={styles.listInfo}>
                    <Text style={styles.listTitle}>{e.category || 'Expense'}</Text>
                    <Text style={styles.listMeta}>{e.status} &middot; {e.description?.slice(0, 30)}</Text>
                  </View>
                  <Text style={[styles.listAmount, { color: '#dc2626' }]}>-KSh {(e.amount || 0).toLocaleString('en-KE')}</Text>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'budgets' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Budget Allocations</Text>
              {budgets.map((b) => {
                const pct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
                return (
                  <View key={b.id} style={styles.budgetCard}>
                    <View style={styles.budgetHeader}>
                      <Text style={styles.budgetDept}>{b.department || 'General'}</Text>
                      <Text style={styles.budgetYear}>FY {b.fiscal_year}</Text>
                    </View>
                    <View style={styles.budgetBarBg}>
                      <View style={[styles.budgetBarFill, { width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981' }]} />
                    </View>
                    <View style={styles.budgetStats}>
                      <Text style={styles.budgetStat}>Allocated: KSh {(b.allocated || 0).toLocaleString('en-KE')}</Text>
                      <Text style={styles.budgetStat}>Spent: KSh {(b.spent || 0).toLocaleString('en-KE')}</Text>
                      <Text style={[styles.budgetStat, { color: '#059669' }]}>Remaining: KSh {(b.remaining || 0).toLocaleString('en-KE')}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  tabs: { flexDirection: 'row', paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
  tab: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#e2e8f0' },
  tabActive: { backgroundColor: '#6366f1' },
  tabText: { fontSize: 12, fontWeight: '600', color: '#64748b' },
  tabTextActive: { color: '#fff' },
  summaryRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 12 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16 },
  summaryLabel: { fontSize: 12, color: '#475569', marginTop: 8 },
  summaryValue: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 4 },
  section: { marginTop: 16, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', padding: 14, borderRadius: 12, marginBottom: 8 },
  listIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listInfo: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  listMeta: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  listAmount: { fontSize: 14, fontWeight: '700' },
  budgetCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 10 },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  budgetDept: { fontSize: 14, fontWeight: '700', color: '#0f172a' },
  budgetYear: { fontSize: 12, color: '#64748b' },
  budgetBarBg: { height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginBottom: 10 },
  budgetBarFill: { height: 8, borderRadius: 4 },
  budgetStats: { flexDirection: 'row', justifyContent: 'space-between' },
  budgetStat: { fontSize: 11, color: '#64748b' },
});
