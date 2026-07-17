import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface BusinessProfile {
  id: string;
  business_name: string;
  category: string;
  status: string;
  verified: boolean;
  revenue_month: number;
  rating: number;
  review_count: number;
  products_count: number;
  services_count: number;
  created_at: string;
}

export default function ProfileBusinessScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBusinesses = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('id, business_name, category, status, verified, revenue_month, rating, review_count, products_count, services_count, created_at')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });
      if (error) console.warn('[ProfileBusiness]', error.message);
      setBusinesses(data || []);
    } catch (err) {
      console.error('Business fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchBusinesses(); }, [fetchBusinesses]);

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
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/business-register')}>
          <Ionicons name="add-circle" size={28} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBusinesses(); }} tintColor="#00d4ff" />}
        contentContainerStyle={{ padding: 16 }}
      >
        {businesses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color="#333" />
            <Text style={styles.emptyTitle}>No business registered</Text>
            <Text style={styles.emptySubtitle}>Register your business to manage it here</Text>
            <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(os)/wallet/business-register')}>
              <Text style={styles.registerBtnText}>Register Business</Text>
            </TouchableOpacity>
          </View>
        ) : (
          businesses.map(biz => (
            <TouchableOpacity key={biz.id} style={styles.bizCard} onPress={() => router.push(`/(os)/wallet/merchant-dashboard?id=${biz.id}` as any)}>
              <View style={styles.bizHeader}>
                <View style={styles.bizIcon}>
                  <Ionicons name="storefront" size={24} color="#00d4ff" />
                </View>
                <View style={styles.bizInfo}>
                  <Text style={styles.bizName}>{biz.business_name}</Text>
                  <Text style={styles.bizType}>{biz.category || 'General'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: biz.status === 'active' ? '#00ff8822' : '#ffaa0022', borderColor: biz.status === 'active' ? '#00ff88' : '#ffaa00' }]}>
                  <Text style={[styles.statusText, { color: biz.status === 'active' ? '#00ff88' : '#ffaa00' }]}>{biz.status}</Text>
                </View>
              </View>
              <View style={styles.bizStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>KES {(biz.revenue_month || 0).toLocaleString()}</Text>
                  <Text style={styles.statLabel}>Revenue</Text>
                </View>
                <View style={styles.statItem}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="star" size={14} color="#ffaa00" />
                    <Text style={[styles.statValue, { marginLeft: 4 }]}>{(biz.rating || 0).toFixed(1)}</Text>
                  </View>
                  <Text style={styles.statLabel}>{biz.review_count || 0} reviews</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{(biz.products_count || 0) + (biz.services_count || 0)}</Text>
                  <Text style={styles.statLabel}>Listings</Text>
                </View>
                {biz.verified && (
                  <View style={styles.verifiedBadge}>
                    <Ionicons name="shield-checkmark" size={14} color="#00ff88" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#888', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#666', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  registerBtn: { backgroundColor: '#00d4ff', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
  registerBtnText: { color: '#000', fontSize: 15, fontWeight: '700' },
  bizCard: { backgroundColor: '#111', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  bizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bizIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#00d4ff11', justifyContent: 'center', alignItems: 'center' },
  bizInfo: { flex: 1, marginLeft: 12 },
  bizName: { fontSize: 16, fontWeight: '700', color: '#fff' },
  bizType: { fontSize: 13, color: '#888', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1 },
  statusText: { fontSize: 11, fontWeight: '600' },
  bizStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  statItem: { alignItems: 'center' },
  statValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  statLabel: { color: '#666', fontSize: 10, marginTop: 2 },
  verifiedBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#00ff8811', justifyContent: 'center', alignItems: 'center' },
});
