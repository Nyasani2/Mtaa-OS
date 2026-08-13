// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { useWalletStore } from '@/domains/wallet/hooks/useWallet';
import { supabase } from '@/lib/supabase';

interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  category: string;
  registration_number: string;
  status: 'active' | 'pending' | 'suspended';
  verified: boolean;
  created_at: string;
  revenue_today: number;
  revenue_month: number;
  transaction_count: number;
}

export default function BusinessScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { balance } = useWalletStore();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'all' | 'active' | 'pending'>('all');

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setBusinesses(data);
    }
    setLoading(false);
  };

  const getFilteredBusinesses = () => {
    if (selectedTab === 'all') return businesses;
    return businesses.filter((b) => b.status === selectedTab);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#22C55E';
      case 'pending': return '#F59E0B';
      case 'suspended': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const totalRevenue = businesses.reduce((sum, b) => sum + (b.revenue_month || 0), 0);
  const activeCount = businesses.filter((b) => b.status === 'active').length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/business-register' as any)}>
          <Ionicons name="add-circle" size={28} color="#22C55E" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#1E3A5F' }]}>
            <MaterialCommunityIcons name="store" size={24} color="#60A5FA" />
            <Text style={styles.statValue}>{businesses.length}</Text>
            <Text style={styles.statLabel}>Businesses</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#064E3B' }]}>
            <FontAwesome5 name="check-circle" size={22} color="#34D399" />
            <Text style={styles.statValue}>{activeCount}</Text>
            <Text style={styles.statLabel}>Active</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#451A03' }]}>
            <FontAwesome5 name="coins" size={22} color="#FBBF24" />
            <Text style={styles.statValue}>KES {totalRevenue.toLocaleString()}</Text>
            <Text style={styles.statLabel}>This Month</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(os)/wallet/business-register' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#1E3A5F' }]}>
                <Ionicons name="add-business" size={24} color="#60A5FA" />
              </View>
              <Text style={styles.actionText}>Register Business</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(os)/wallet/merchant-dashboard' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#064E3B' }]}>
                <Ionicons name="bar-chart" size={24} color="#34D399" />
              </View>
              <Text style={styles.actionText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(os)/wallet/business-documents' as any)}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#451A03' }]}>
                <Ionicons name="document-text" size={24} color="#FBBF24" />
              </View>
              <Text style={styles.actionText}>Documents</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => Alert.alert('POS', 'POS Terminal coming in next update')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#312E81' }]}>
                <MaterialCommunityIcons name="cash-register" size={24} color="#A78BFA" />
              </View>
              <Text style={styles.actionText}>POS Terminal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabRow}>
          {(['all', 'active', 'pending'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, selectedTab === tab && styles.tabActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Business List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Businesses</Text>
          {loading ? (
            <Text style={styles.emptyText}>Loading...</Text>
          ) : getFilteredBusinesses().length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="store-off" size={48} color="#6B7280" />
              <Text style={styles.emptyText}>No businesses found</Text>
              <TouchableOpacity
                style={styles.registerBtn}
                onPress={() => router.push('/(os)/wallet/business-register' as any)}
              >
                <Text style={styles.registerBtnText}>Register Your First Business</Text>
              </TouchableOpacity>
            </View>
          ) : (
            getFilteredBusinesses().map((biz) => (
              <TouchableOpacity
                key={biz.id}
                style={styles.businessCard}
                onPress={() => router.push(`/(os)/wallet/merchant-dashboard?id=${biz.id}` as any)}
              >
                <View style={styles.bizHeader}>
                  <View style={styles.bizIcon}>
                    <MaterialCommunityIcons name="store" size={28} color="#60A5FA" />
                  </View>
                  <View style={styles.bizInfo}>
                    <Text style={styles.bizName}>{biz.name}</Text>
                    <Text style={styles.bizType}>{biz.type} · {biz.category}</Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(biz.status) + '20' }]}>
                    <Text style={[styles.statusText, { color: getStatusColor(biz.status) }]}>
                      {biz.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.bizStats}>
                  <View style={styles.bizStat}>
                    <Text style={styles.bizStatValue}>KES {(biz.revenue_today || 0).toLocaleString()}</Text>
                    <Text style={styles.bizStatLabel}>Today</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.bizStat}>
                    <Text style={styles.bizStatValue}>KES {(biz.revenue_month || 0).toLocaleString()}</Text>
                    <Text style={styles.bizStatLabel}>This Month</Text>
                  </View>
                  <View style={styles.divider} />
                  <View style={styles.bizStat}>
                    <Text style={styles.bizStatValue}>{biz.transaction_count || 0}</Text>
                    <Text style={styles.bizStatLabel}>Transactions</Text>
                  </View>
                </View>

                {biz.verified && (
                  <View style={styles.verifiedBadge}>
                    <FontAwesome5 name="check-circle" size={12} color="#22C55E" />
                    <Text style={styles.verifiedText}>Verified Business</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
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
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statValue: { fontSize: 14, fontWeight: '700', color: '#fff', marginTop: 6 },
  statLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  section: { paddingHorizontal: 16, marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12 },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '47%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { fontSize: 12, fontWeight: '600', color: '#E2E8F0', marginTop: 8 },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginTop: 20,
    gap: 8,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E293B',
  },
  tabActive: { backgroundColor: '#3B82F6' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: '#fff' },
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 14, color: '#6B7280', marginTop: 12 },
  registerBtn: {
    marginTop: 16,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  registerBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  businessCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  bizHeader: { flexDirection: 'row', alignItems: 'center' },
  bizIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1E3A5F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bizInfo: { flex: 1, marginLeft: 12 },
  bizName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  bizType: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bizStats: {
    flexDirection: 'row',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  bizStat: { flex: 1, alignItems: 'center' },
  bizStatValue: { fontSize: 13, fontWeight: '700', color: '#fff' },
  bizStatLabel: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  divider: { width: 1, backgroundColor: '#334155' },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    gap: 4,
  },
  verifiedText: { fontSize: 11, color: '#22C55E', fontWeight: '600' },
});
