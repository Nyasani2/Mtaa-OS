// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

interface EarningRecord {
  id: string;
  source: string;
  gross_amount: number;
  creator_amount: number;
  platform_amount: number;
  tax_reserved: number;
  created_at: string;
}

interface EarningSummary {
  totalGross: number;
  totalNet: number;
  totalPlatformFee: number;
  totalTax: number;
  count: number;
  bySource: Record<string, number>;
}

export default function CreatorEarningsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<EarningSummary | null>(null);
  const [earnings, setEarnings] = useState<EarningRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: rows } = await supabase
        .from('content_earnings')
        .select('id, source, gross_amount, creator_amount, platform_amount, tax_reserved, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      const data = rows || [];
      const totalGross = data.reduce((s, r) => s + (r.gross_amount || 0), 0);
      const totalNet = data.reduce((s, r) => s + (r.creator_amount || 0), 0);
      const totalPlatform = data.reduce((s, r) => s + (r.platform_amount || 0), 0);
      const totalTax = data.reduce((s, r) => s + (r.tax_reserved || 0), 0);

      const bySource: Record<string, number> = {};
      data.forEach(r => {
        bySource[r.source] = (bySource[r.source] || 0) + (r.creator_amount || 0);
      });

      setSummary({ totalGross, totalNet, totalPlatformFee: totalPlatform, totalTax, count: data.length, bySource });
      setEarnings(data.slice(0, 20));
    } catch (e: any) {
      console.error('fetchData error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWithdraw = () => {
    if (!summary || summary.totalNet <= 0) {
      Alert.alert('No Balance', 'You have no available earnings to withdraw.');
      return;
    }
    router.push('/(os)/wallet/withdraw' as any);
  };

  const formatKES = (amount: number) => `KES ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`;

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Earnings</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/analytics' as any)}>
          <Ionicons name="stats-chart-outline" size={22} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#00d4ff" />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Total Net Earnings</Text>
          <Text style={styles.balanceAmount}>{formatKES(summary?.totalNet || 0)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Gross</Text>
              <Text style={styles.balanceItemValue}>{formatKES(summary?.totalGross || 0)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Platform Fee</Text>
              <Text style={styles.balanceItemValue}>{formatKES(summary?.totalPlatformFee || 0)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Tax</Text>
              <Text style={styles.balanceItemValue}>{formatKES(summary?.totalTax || 0)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <Ionicons name="cash-outline" size={18} color="#000" />
            <Text style={styles.withdrawButtonText}>Withdraw to Wallet</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsGrid}>
          {[
            { label: 'Transactions', value: summary?.count || 0, icon: 'receipt-outline', color: '#ffaa00' },
            { label: 'Gross', value: formatKES(summary?.totalGross || 0), icon: 'trending-up-outline', color: '#00ff88' },
            { label: 'Platform', value: formatKES(summary?.totalPlatformFee || 0), icon: 'business-outline', color: '#ff4444' },
            { label: 'Net', value: formatKES(summary?.totalNet || 0), icon: 'wallet-outline', color: '#00d4ff' },
          ].map((stat: any) => (
            <View key={stat.label} style={[styles.statCard, { borderColor: stat.color + '44' }]}>
              <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {summary?.bySource && Object.keys(summary.bySource).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings by Source</Text>
            {Object.entries(summary.bySource).map(([source, amount]) => (
              <View key={source} style={styles.moduleRow}>
                <View style={styles.moduleIcon}>
                  <Ionicons name={getSourceIcon(source)} size={18} color="#00d4ff" />
                </View>
                <Text style={styles.moduleName}>{source.charAt(0).toUpperCase() + source.slice(1)}</Text>
                <Text style={styles.moduleAmount}>{formatKES(Number(amount))}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySub}>Create content to start earning</Text>
            </View>
          ) : (
            earnings.map((earning: any) => (
              <View key={earning.id} style={styles.earningRow}>
                <View style={[styles.earningStatus, { backgroundColor: '#00ff8822' }]}>
                  <Ionicons name="checkmark-circle" size={16} color="#00ff88" />
                </View>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningType}>{earning.source?.charAt(0).toUpperCase() + (earning.source?.slice(1) || '')}</Text>
                  <Text style={styles.earningModule}>{new Date(earning.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.earningAmount}>
                  <Text style={styles.earningGross}>{formatKES(earning.gross_amount)}</Text>
                  <Text style={styles.earningNet}>+{formatKES(earning.creator_amount)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function getSourceIcon(source: string): string {
  const icons: Record<string, string> = {
    ads: 'megaphone-outline', tips: 'heart-outline', subscription: 'people-outline',
    sponsor: 'briefcase-outline', music: 'musical-notes-outline', education: 'school-outline',
    live: 'videocam-outline', marketplace_sale: 'cart-outline', job_payment: 'construct-outline',
    cash_point_commission: 'storefront-outline', referral_bonus: 'person-add-outline',
    platform_bonus: 'gift-outline',
  };
  return icons[source] || 'cash-outline';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  balanceCard: { backgroundColor: '#111', margin: 16, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: '#00d4ff33' },
  balanceLabel: { color: '#888', fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', gap: 16, marginBottom: 16 },
  balanceItem: { flex: 1 },
  balanceItemLabel: { color: '#666', fontSize: 11, marginBottom: 2 },
  balanceItemValue: { color: '#fff', fontSize: 13, fontWeight: '600' },
  withdrawButton: { backgroundColor: '#00d4ff', borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  withdrawButtonText: { color: '#000', fontSize: 15, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12, marginBottom: 16 },
  statCard: { width: (SCREEN_W - 56) / 2, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  moduleRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  moduleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00d4ff15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  moduleName: { color: '#fff', fontSize: 14, flex: 1 },
  moduleAmount: { color: '#00ff88', fontSize: 14, fontWeight: '600' },
  earningRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 14, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  earningStatus: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  earningInfo: { flex: 1 },
  earningType: { color: '#fff', fontSize: 14, fontWeight: '500' },
  earningModule: { color: '#666', fontSize: 11, marginTop: 2 },
  earningAmount: { alignItems: 'flex-end' },
  earningGross: { color: '#888', fontSize: 11, textDecorationLine: 'line-through' },
  earningNet: { color: '#00ff88', fontSize: 14, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { color: '#666', fontSize: 16, marginTop: 12 },
  emptySub: { color: '#444', fontSize: 13, marginTop: 4 },
});
