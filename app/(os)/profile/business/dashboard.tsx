// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { affiliateService } from '@/lib/shop/services/affiliateService';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function UnifiedBusinessDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    restaurants: 0,
    shops: 0,
    mtaxi: 0,
    affiliates: 0,
    totalRevenue: 0,
    pendingCommissions: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAllBusinesses = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      // Fetch all business types in parallel
      const [shops, restaurants, mtaxiVehicles, affiliates] = await Promise.all([
        // Shops from shop_profiles or businesses table
        supabase.from('businesses').select('*').eq('owner_id', user.id).eq('category', 'shop'),
        // Restaurants
        supabase.from('businesses').select('*').eq('owner_id', user.id).eq('category', 'restaurant'),
        // MTaxi vehicles
        supabase.from('mtaxi_vehicles').select('*').eq('owner_id', user.id),
        // Affiliate accounts
        supabase.from('affiliate_accounts').select('*').eq('user_id', user.id),
      ]);

      const allBusinesses = [
        ...(shops.data || []).map(b => ({ ...b, type: 'shop' })),
        ...(restaurants.data || []).map(b => ({ ...b, type: 'restaurant' })),
        ...(mtaxiVehicles.data || []).map(v => ({ ...v, type: 'mtaxi', name: v.plate_number || 'Vehicle' })),
        ...(affiliates.data || []).map(a => ({ ...a, type: 'affiliate', name: a.account_name || 'Affiliate' })),
      ];

      setBusinesses(allBusinesses);

      // Calculate aggregated stats
      let totalRevenue = 0;
      let pendingCommissions = 0;

      // Get revenue data for each business type
      if (shops.data?.length || restaurants.data?.length) {
        const businessIds = [...(shops.data || []), ...(restaurants.data || [])].map(b => b.id);
        const { data: orders } = await supabase
          .from('shop_orders')
          .select('total_amount, status')
          .in('business_id', businessIds)
          .eq('status', 'completed');
        totalRevenue += (orders || []).reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
      }

      if (affiliates.data?.length) {
        try {
          // Use the existing affiliate service to get real stats
          const affStats = await affiliateService.getAffiliateStats(user.id);
          pendingCommissions += affStats?.pending_commissions || 0;
          totalRevenue += affStats?.total_earnings || 0;
        } catch (e) {
          console.warn('Affiliate stats fetch failed:', e);
        }
      }

      setStats({
        total: allBusinesses.length,
        restaurants: restaurants.data?.length || 0,
        shops: shops.data?.length || 0,
        mtaxi: mtaxiVehicles.data?.length || 0,
        affiliates: affiliates.data?.length || 0,
        totalRevenue,
        pendingCommissions,
      });
    } catch (err) {
      console.error('Fetch businesses error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAllBusinesses(); }, [user?.id]);
  const onRefresh = () => { setRefreshing(true); fetchAllBusinesses(); };

  const getBusinessIcon = (type: string) => {
    switch (type) {
      case 'restaurant': return 'restaurant';
      case 'shop': return 'storefront';
      case 'mtaxi': return 'car';
      case 'affiliate': return 'trending-up';
      default: return 'business';
    }
  };

  const getBusinessRoute = (biz: any) => {
    switch (biz.type) {
      case 'restaurant': return `/(os)/restaurant/dashboard`;
      case 'shop': return `/(os)/wallet/merchant-dashboard?id=${biz.id}`;
      case 'mtaxi': return `/(mtaxi)/driver/dashboard`;
      case 'affiliate': return `/(os)/affiliate/dashboard`;
      default: return `/(os)/business/${biz.id}`;
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={20} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Businesses</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/business/create')}><Ionicons name="add-circle" size={24} color="#10b981" /></TouchableOpacity>
      </View>

      {/* Compact Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.shops}</Text>
          <Text style={styles.statLabel}>Shops</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.restaurants}</Text>
          <Text style={styles.statLabel}>Restaurants</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{stats.mtaxi}</Text>
          <Text style={styles.statLabel}>MTaxi</Text>
        </View>
      </View>

      {/* Revenue Summary */}
      <View style={styles.revenueCard}>
        <View style={styles.revenueRow}>
          <Ionicons name="cash-outline" size={20} color="#10b981" />
          <Text style={styles.revenueLabel}>Total Revenue</Text>
        </View>
        <Text style={styles.revenueValue}>KES {stats.totalRevenue.toLocaleString()}</Text>
        {stats.pendingCommissions > 0 && (
          <Text style={styles.pendingText}>Pending: KES {stats.pendingCommissions.toLocaleString()}</Text>
        )}
      </View>

      {/* Business List */}
      <Text style={styles.sectionTitle}>Your Ventures</Text>
      {businesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={48} color="#334155" />
          <Text style={styles.emptyText}>No businesses yet.</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/profile/business/create')}>
            <Text style={styles.createBtnText}>Create Your First Business</Text>
          </TouchableOpacity>
        </View>
      ) : (
        businesses.map((biz) => (
          <TouchableOpacity key={biz.id} style={styles.bizCard} onPress={() => router.push(getBusinessRoute(biz) as any)}>
            <View style={[styles.bizIcon, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name={getBusinessIcon(biz.type)} size={24} color="#3b82f6" />
            </View>
            <View style={styles.bizInfo}>
              <Text style={styles.bizName}>{biz.name || 'Unnamed Business'}</Text>
              <Text style={styles.bizType}>{biz.type} • {biz.location || biz.category || 'No location'}</Text>
            </View>
            <View style={styles.bizActions}>
              <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); router.push(`/(os)/business/${biz.id}`); }}>
                <Ionicons name="eye" size={16} color="#8b5cf6" />
                <Text style={styles.actionBtnText}>View</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn} onPress={(e) => { e.stopPropagation(); router.push(`/(os)/profile/business/edit?id=${biz.id}`); }}>
                <Ionicons name="pencil" size={16} color="#10b981" />
                <Text style={styles.actionBtnText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  statsRow: { flexDirection: 'row', padding: 12, gap: 8 },
  statBox: { flex: 1, backgroundColor: '#1e293b', padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statNum: { fontSize: 20, fontWeight: '800', color: '#8b5cf6' },
  statLabel: { fontSize: 10, color: '#94a3b8', marginTop: 2, textAlign: 'center' },
  revenueCard: { backgroundColor: '#1e293b', margin: 12, borderRadius: 12, padding: 14, borderWidth: 1, borderColor: '#334155' },
  revenueRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  revenueLabel: { fontSize: 12, color: '#94a3b8' },
  revenueValue: { fontSize: 24, fontWeight: '800', color: '#10b981', marginTop: 4 },
  pendingText: { fontSize: 11, color: '#f59e0b', marginTop: 4 },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#f1f5f9', marginHorizontal: 16, marginBottom: 8, marginTop: 8 },
  bizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 12, marginBottom: 8, padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#334155' },
  bizIcon: { width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 14, fontWeight: '700', color: '#f1f5f9' },
  bizType: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  bizActions: { flexDirection: 'row', gap: 6 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, backgroundColor: '#0f172a', gap: 4 },
  actionBtnText: { fontSize: 11, fontWeight: '600', color: '#fff' },
  emptyState: { alignItems: 'center', padding: 32, marginTop: 20 },
  emptyText: { fontSize: 14, color: '#94a3b8', marginTop: 12, textAlign: 'center' },
  createBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8, marginTop: 16 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
});
