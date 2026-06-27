import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl,
  ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { CreatorEarningsService } from '@/lib/profile/services/creator-earnings-service';
import type { CreatorEarningSummary, CreatorEarning, CreatorWithdrawal } from '@/lib/profile/services/types';

const { width: SCREEN_W } = Dimensions.get('window');

export default function CreatorEarningsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<CreatorEarningSummary | null>(null);
  const [earnings, setEarnings] = useState<CreatorEarning[]>([]);
  const [withdrawals, setWithdrawals] = useState<CreatorWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'withdrawals'>('overview');

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [s, e, w] = await Promise.all([
        CreatorEarningsService.getEarningsSummary(user.id),
        CreatorEarningsService.getEarnings(user.id, { limit: 20 }),
        CreatorEarningsService.getWithdrawals(user.id),
      ]);
      setSummary(s);
      setEarnings(e.data);
      setWithdrawals(w);
    } catch (e: any) {
      console.error('fetchData error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleWithdraw = () => {
    if (!summary || summary.availableBalance <= 0) {
      Alert.alert('No Balance', 'You have no available earnings to withdraw.');
      return;
    }
    router.push('/profile/creator/withdraw');
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Earnings</Text>
        <TouchableOpacity onPress={() => router.push('/profile/creator/analytics')}>
          <Ionicons name="stats-chart-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} tintColor="#00d4ff" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Available Balance</Text>
          <Text style={styles.balanceAmount}>{formatKES(summary?.availableBalance || 0)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Total Earned</Text>
              <Text style={styles.balanceItemValue}>{formatKES(summary?.totalGross || 0)}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Total Withdrawn</Text>
              <Text style={styles.balanceItemValue}>{formatKES(summary?.totalWithdrawn || 0)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.withdrawButton} onPress={handleWithdraw}>
            <Ionicons name="cash-outline" size={18} color="#000" />
            <Text style={styles.withdrawButtonText}>Withdraw Earnings</Text>
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {[
            { label: 'Pending', value: summary?.pendingCount || 0, icon: 'time-outline', color: '#ffaa00' },
            { label: 'Available', value: summary?.availableCount || 0, icon: 'checkmark-circle-outline', color: '#00ff88' },
            { label: 'Withdrawn', value: summary?.withdrawnCount || 0, icon: 'arrow-down-circle-outline', color: '#00d4ff' },
            { label: 'Total Net', value: formatKES(summary?.totalNet || 0), icon: 'wallet-outline', color: '#ff00ff' },
          ].map(stat => (
            <View key={stat.label} style={[styles.statCard, { borderColor: stat.color + '44' }]}>
              <Ionicons name={stat.icon as any} size={22} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Earnings by Module */}
        {summary?.earningsByModule && Object.keys(summary.earningsByModule).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Earnings by Module</Text>
            {Object.entries(summary.earningsByModule).map(([module, amount]) => (
              <View key={module} style={styles.moduleRow}>
                <View style={styles.moduleIcon}>
                  <Ionicons name={getModuleIcon(module)} size={18} color="#00d4ff" />
                </View>
                <Text style={styles.moduleName}>{module.charAt(0).toUpperCase() + module.slice(1)}</Text>
                <Text style={styles.moduleAmount}>{formatKES(Number(amount))}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Recent Earnings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="cash-outline" size={40} color="#333" />
              <Text style={styles.emptyText}>No earnings yet</Text>
              <Text style={styles.emptySub}>Create content to start earning</Text>
            </View>
          ) : (
            earnings.slice(0, 10).map(earning => (
              <View key={earning.id} style={styles.earningRow}>
                <View style={[styles.earningStatus, { backgroundColor: getStatusColor(earning.status) + '22' }]}>
                  <Ionicons name={getStatusIcon(earning.status)} size={16} color={getStatusColor(earning.status)} />
                </View>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningType}>{formatSourceType(earning.source_type)}</Text>
                  <Text style={styles.earningModule}>{earning.source_module} · {new Date(earning.created_at).toLocaleDateString()}</Text>
                </View>
                <View style={styles.earningAmount}>
                  <Text style={styles.earningGross}>{formatKES(earning.gross_amount)}</Text>
                  <Text style={styles.earningNet}>+{formatKES(earning.net_amount)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

// Helpers
function getModuleIcon(module: string): string {
  const icons: Record<string, string> = {
    streets: 'videocam-outline',
    mtaxi: 'car-outline',
    mtruck: 'bus-outline',
    shop: 'cart-outline',
    marketplace: 'storefront-outline',
    jobs: 'briefcase-outline',
    property: 'home-outline',
    restaurant: 'restaurant-outline',
    education: 'school-outline',
    tribes: 'people-outline',
    wallet: 'wallet-outline',
  };
  return icons[module] || 'cash-outline';
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: '#ffaa00',
    available: '#00ff88',
    withdrawn: '#00d4ff',
    held: '#ff4444',
    disputed: '#ff6600',
    refunded: '#888',
  };
  return colors[status] || '#888';
}

function getStatusIcon(status: string): string {
  const icons: Record<string, string> = {
    pending: 'time-outline',
    available: 'checkmark-circle-outline',
    withdrawn: 'arrow-down-circle-outline',
    held: 'lock-closed-outline',
    disputed: 'warning-outline',
    refunded: 'return-down-back-outline',
  };
  return icons[status] || 'help-outline';
}

function formatSourceType(type: string): string {
  return type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  balanceCard: {
    backgroundColor: '#111',
    margin: 16,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#00d4ff33',
  },
  balanceLabel: { color: '#888', fontSize: 13, marginBottom: 4 },
  balanceAmount: { color: '#fff', fontSize: 36, fontWeight: '800', marginBottom: 16 },
  balanceRow: { flexDirection: 'row', gap: 24, marginBottom: 16 },
  balanceItem: { flex: 1 },
  balanceItemLabel: { color: '#666', fontSize: 11, marginBottom: 2 },
  balanceItemValue: { color: '#fff', fontSize: 14, fontWeight: '600' },
  withdrawButton: {
    backgroundColor: '#00d4ff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  withdrawButtonText: { color: '#000', fontSize: 15, fontWeight: '700' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: (SCREEN_W - 56) / 2,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  statValue: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 8 },
  statLabel: { color: '#888', fontSize: 11, marginTop: 4 },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  moduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
  moduleIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#00d4ff15', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  moduleName: { color: '#fff', fontSize: 14, flex: 1 },
  moduleAmount: { color: '#00ff88', fontSize: 14, fontWeight: '600' },
  earningRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1a1a1a',
  },
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
