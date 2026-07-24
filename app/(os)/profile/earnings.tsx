import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, ArrowRight } from 'lucide-react-native';

interface EarningsData {
  total_earnings: number;
  available_balance: number;
  pending_balance: number;
  lifetime_payouts: number;
  this_month: number;
  last_month: number;
}

interface EarningRecord {
  id: string;
  source: string;
  amount: number;
  status: 'pending' | 'available' | 'paid';
  created_at: string;
}

// Timeout wrapper for Supabase queries
async function withTimeout<T>(promise: Promise<T>, fallback: T, ms = 4000): Promise<T> {
  return Promise.race([
    promise.catch(() => fallback),
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export default function CreatorEarnings() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [data, setData] = useState<EarningsData | null>(null);
  const [records, setRecords] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // FIXED: Inline fetch, no useCallback dependency loop
  useEffect(() => {
    if (!user?.id) { setLoading(false); return; }
    let cancelled = false;

    const load = async () => {
      try {
        const profile = await withTimeout(
          supabase.from('user_profiles').select('creator_earnings, creator_balance, creator_pending').eq('user_id', user.id).single().then(r => r.data),
          null,
          4000
        );
        const txs = await withTimeout(
          supabase.from('wallet_transactions')
            .select('*').eq('user_id', user.id).eq('type', 'credit').eq('category', 'creator')
            .order('created_at', { ascending: false }).limit(20)
            .then(r => r.data || []),
          [],
          4000
        );

        if (cancelled) return;

        const total = profile?.creator_earnings || 0;
        const available = profile?.creator_balance || 0;
        const pending = profile?.creator_pending || 0;
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();
        const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
        const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

        setData({
          total_earnings: total,
          available_balance: available,
          pending_balance: pending,
          lifetime_payouts: Math.max(0, total - available - pending),
          this_month: txs.filter((t: any) => {
            const d = new Date(t.created_at);
            return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
          }).reduce((s: number, t: any) => s + (t.amount || 0), 0),
          last_month: txs.filter((t: any) => {
            const d = new Date(t.created_at);
            return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
          }).reduce((s: number, t: any) => s + (t.amount || 0), 0),
        });
        setRecords((txs || []).map((t: any) => ({
          id: t.id,
          source: t.description || 'Creator earnings',
          amount: t.amount,
          status: t.status || 'available',
          created_at: t.created_at
        })));
      } catch (err) {
        console.error('Earnings load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [user?.id]);

  const onRefresh = async () => {
    if (!user?.id) return;
    setRefreshing(true);
    try {
      const { data: profile } = await supabase.from('user_profiles').select('creator_earnings, creator_balance, creator_pending').eq('user_id', user.id).single();
      const { data: txs } = await supabase.from('wallet_transactions')
        .select('*').eq('user_id', user.id).eq('type', 'credit').eq('category', 'creator')
        .order('created_at', { ascending: false }).limit(20);

      const total = profile?.creator_earnings || 0;
      const available = profile?.creator_balance || 0;
      const pending = profile?.creator_pending || 0;
      const now = new Date();
      const thisMonth = now.getMonth();
      const thisYear = now.getFullYear();
      const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
      const lastMonthYear = thisMonth === 0 ? thisYear - 1 : thisYear;

      setData({
        total_earnings: total,
        available_balance: available,
        pending_balance: pending,
        lifetime_payouts: Math.max(0, total - available - pending),
        this_month: (txs || []).filter((t: any) => {
          const d = new Date(t.created_at);
          return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
        }).reduce((s: number, t: any) => s + (t.amount || 0), 0),
        last_month: (txs || []).filter((t: any) => {
          const d = new Date(t.created_at);
          return d.getMonth() === lastMonth && d.getFullYear() === lastMonthYear;
        }).reduce((s: number, t: any) => s + (t.amount || 0), 0),
      });
      setRecords((txs || []).map((t: any) => ({
        id: t.id,
        source: t.description || 'Creator earnings',
        amount: t.amount,
        status: t.status || 'available',
        created_at: t.created_at
      })));
    } catch (err) {
      console.error('Refresh error:', err);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#f8fafc" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Creator Earnings</Text>
          <View style={{ width: 24 }} />
        </View>
        <ActivityIndicator style={{ marginTop: 60 }} size="large" color="#38bdf8" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Earnings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#38bdf8" />}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>KSh {(data?.available_balance || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Pending</Text>
              <Text style={styles.balanceItemValue}>KSh {(data?.pending_balance || 0).toLocaleString()}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Lifetime</Text>
              <Text style={styles.balanceItemValue}>KSh {(data?.total_earnings || 0).toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawBtn} onPress={() => router.push('/(os)/wallet/withdraw') }>
            <Text style={styles.withdrawText}>Withdraw to Wallet</Text>
            <ArrowRight size={16} color="#0f172a" />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <TrendingUp size={20} color="#10b981" />
            <Text style={styles.statValue}>KSh {(data?.this_month || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
          <View style={styles.statCard}>
            <TrendingDown size={20} color="#f59e0b" />
            <Text style={styles.statValue}>KSh {(data?.last_month || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Last Month</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {records.length === 0 ? (
            <View style={styles.empty}>
              <DollarSign size={40} color="#475569" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySub}>Start creating content to earn</Text>
            </View>
          ) : (
            records.map(r => (
              <View key={r.id} style={styles.record}>
                <View style={styles.recordLeft}>
                  <View style={[styles.recordIcon, { backgroundColor: r.status === 'available' ? '#10b98120' : r.status === 'pending' ? '#f59e0b20' : '#38bdf820' }]}>
                    <DollarSign size={16} color={r.status === 'available' ? '#10b981' : r.status === 'pending' ? '#f59e0b' : '#38bdf8'} />
                  </View>
                  <View>
                    <Text style={styles.recordSource}>{r.source}</Text>
                    <Text style={styles.recordDate}>{new Date(r.created_at).toLocaleDateString('en-KE')}</Text>
                  </View>
                </View>
                <View style={styles.recordRight}>
                  <Text style={[styles.recordAmount, { color: '#10b981' }]}>+KSh {r.amount.toLocaleString()}</Text>
                  <Text style={[styles.recordStatus, { color: r.status === 'available' ? '#10b981' : r.status === 'pending' ? '#f59e0b' : '#38bdf8' }]}>{r.status}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 60, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f8fafc' },
  scroll: { flex: 1 },
  balanceCard: { margin: 16, padding: 20, backgroundColor: '#1e293b', borderRadius: 16, borderWidth: 1, borderColor: '#334155' },
  balanceLabel: { fontSize: 13, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5 },
  balanceAmount: { fontSize: 32, fontWeight: '700', color: '#f8fafc', marginTop: 8 },
  balanceRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  balanceItem: { flex: 1 },
  balanceItemLabel: { fontSize: 12, color: '#64748b' },
  balanceItemValue: { fontSize: 16, fontWeight: '600', color: '#e2e8f0', marginTop: 2 },
  withdrawBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 20, padding: 14, backgroundColor: '#38bdf8', borderRadius: 12 },
  withdrawText: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  statsRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, marginTop: 8 },
  statCard: { flex: 1, padding: 16, backgroundColor: '#1e293b', borderRadius: 12, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: '#f8fafc', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#64748b', marginTop: 4 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#94a3b8', marginTop: 12 },
  emptySub: { fontSize: 13, color: '#64748b', marginTop: 4 },
  record: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  recordLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordIcon: { width: 36, height: 36, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  recordSource: { fontSize: 14, fontWeight: '500', color: '#e2e8f0' },
  recordDate: { fontSize: 12, color: '#64748b', marginTop: 2 },
  recordRight: { alignItems: 'flex-end' },
  recordAmount: { fontSize: 14, fontWeight: '600' },
  recordStatus: { fontSize: 11, textTransform: 'capitalize', marginTop: 2 },
});
