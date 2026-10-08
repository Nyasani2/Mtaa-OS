// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function UnifiedBusinessDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBusinesses = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data: bizData, error: bizErr } = await supabase
        .from('businesses')
        .select('id, name, category, business_type, is_verified, status')
        .eq('owner_id', user.id);

      if (bizErr) throw bizErr;

      const enrichedBiz = (bizData || []).map((b: any) => ({
        ...b,
        icon: getBusinessIcon(b.category || b.business_type),
        route: getBusinessRoute(b.category || b.business_type, b.id),
      }));

      setBusinesses(enrichedBiz);
    } catch (err) {
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchBusinesses(); }, [user?.id]);
  const onRefresh = () => { setRefreshing(true); fetchBusinesses(); };

  const getBusinessIcon = (type: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('restaurant') || t.includes('food')) return 'restaurant';
    if (t.includes('shop') || t.includes('retail')) return 'storefront';
    if (t.includes('taxi') || t.includes('transport')) return 'car';
    if (t.includes('stay') || t.includes('hotel')) return 'bed';
    return 'business';
  };

  const getBusinessRoute = (type: string, id: string) => {
    const t = (type || '').toLowerCase();
    if (t.includes('restaurant')) return `/(os)/restaurant/dashboard`;
    if (t.includes('shop') || t.includes('retail')) return `/(os)/wallet/merchant-dashboard?id=${id}`;
    if (t.includes('taxi') || t.includes('transport')) return `/(mtaxi)/driver/dashboard`;
    return `/(os)/business/${id}`; // Fallback to generic business profile
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Businesses</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/business/create')}><Ionicons name="add-circle" size={28} color="#3b82f6" /></TouchableOpacity>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Business Portfolio</Text>
        <Text style={styles.summaryValue}>{businesses.length}</Text>
        <Text style={styles.summaryLabel}>Active Ventures</Text>
        <TouchableOpacity style={styles.addViewBtn} onPress={() => router.push('/(os)/profile/business/create')}>
          <Ionicons name="add" size={16} color="#fff" />
          <Text style={styles.addViewText}>Add New Business</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>Your Ventures</Text>
      {businesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="business-outline" size={64} color="#334155" />
          <Text style={styles.emptyText}>No businesses yet.</Text>
          <Text style={styles.emptySubtext}>Create your first shop, restaurant, or service to start managing your accounts.</Text>
        </View>
      ) : (
        businesses.map((biz) => (
          <TouchableOpacity key={biz.id} style={styles.bizCard} onPress={() => router.push(biz.route as any)}>
            <View style={[styles.bizIconBox, { backgroundColor: '#3b82f620' }]}>
              <Ionicons name={biz.icon as any} size={28} color="#3b82f6" />
            </View>
            <View style={styles.bizInfo}>
              <Text style={styles.bizName}>{biz.name}</Text>
              <Text style={styles.bizCategory}>{biz.category || biz.business_type || 'Business'}</Text>
              {biz.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                  <Text style={styles.verifiedText}>Verified</Text>
                </View>
              )}
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  summaryCard: { backgroundColor: '#1e293b', margin: 16, borderRadius: 16, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  summaryTitle: { fontSize: 14, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1 },
  summaryValue: { fontSize: 36, fontWeight: '800', color: '#f1f5f9', marginTop: 8 },
  summaryLabel: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  addViewBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginTop: 16, gap: 6 },
  addViewText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginHorizontal: 16, marginBottom: 12 },
  bizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', marginHorizontal: 16, marginBottom: 12, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#334155' },
  bizIconBox: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 16, fontWeight: '700', color: '#f1f5f9' },
  bizCategory: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  verifiedText: { fontSize: 11, color: '#10b981', fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40, marginTop: 20 },
  emptyText: { fontSize: 18, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  emptySubtext: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 8, lineHeight: 20 },
});
