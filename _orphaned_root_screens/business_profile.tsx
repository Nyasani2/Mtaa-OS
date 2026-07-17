import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface BusinessData {
  id: string;
  business_name: string;
  description: string;
  category: string;
  phone: string;
  email: string;
  website: string;
  verified: boolean;
  status: string;
  rating: number;
  review_count: number;
  products_count: number;
  services_count: number;
  employees_count: number;
  branches_count: number;
  revenue_month: number;
  address: string;
  city: string;
  logo_url: string;
}

export default function BusinessScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [bizData, setBizData] = useState<BusinessData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadBusinessData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('owner_id', user.id)
        .single();
      if (error && error.code !== 'PGRST116') console.error('[Business] Load error:', error);
      setBizData(data || null);
    } catch (err) {
      console.error('[Business] Load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadBusinessData(); }, [loadBusinessData]);

  if (!user?.id) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="storefront-outline" size={64} color="#333" />
        <Text style={styles.emptyTitle}>Sign in to view your Business Profile</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.push('/auth/sign-in')}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/business/edit')}>
          <Ionicons name="create-outline" size={22} color="#00d4ff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#00d4ff" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadBusinessData(); }} tintColor="#00d4ff" />}
          contentContainerStyle={{ padding: 16 }}
        >
          {!bizData ? (
            <View style={styles.empty}>
              <Ionicons name="business-outline" size={48} color="#333" />
              <Text style={styles.emptyTitle}>No business profile yet</Text>
              <Text style={styles.emptySubtitle}>Set up your business to start selling</Text>
              <TouchableOpacity style={styles.button} onPress={() => router.push('/(os)/profile/business/edit')}>
                <Text style={styles.buttonText}>Create Business Profile</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Business Header */}
              <View style={styles.bizHeader}>
                <View style={styles.logoPlaceholder}>
                  <Ionicons name="storefront" size={32} color="#00d4ff" />
                </View>
                <View style={styles.bizHeaderInfo}>
                  <Text style={styles.bizName}>{bizData.business_name}</Text>
                  <Text style={styles.bizCategory}>{bizData.category || 'Uncategorized'}</Text>
                  <View style={styles.bizMetaRow}>
                    {bizData.verified && (
                      <View style={styles.verifiedBadge}>
                        <Ionicons name="shield-checkmark" size={12} color="#00ff88" />
                        <Text style={styles.verifiedText}>Verified</Text>
                      </View>
                    )}
                    <View style={[styles.statusBadge, { backgroundColor: bizData.status === 'active' ? '#00ff8822' : '#ffaa0022' }]}>
                      <Text style={[styles.statusText, { color: bizData.status === 'active' ? '#00ff88' : '#ffaa00' }]}>{bizData.status}</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Description */}
              {bizData.description && (
                <View style={styles.card}>
                  <Text style={styles.cardTitle}>About</Text>
                  <Text style={styles.cardText}>{bizData.description}</Text>
                </View>
              )}

              {/* Contact */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Contact</Text>
                {bizData.phone && <Text style={styles.cardText}>📞 {bizData.phone}</Text>}
                {bizData.email && <Text style={styles.cardText}>✉️ {bizData.email}</Text>}
                {bizData.website && <Text style={styles.cardText}>🌐 {bizData.website}</Text>}
                {bizData.address && <Text style={styles.cardText}>📍 {bizData.address}{bizData.city ? `, ${bizData.city}` : ''}</Text>}
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{bizData.products_count || 0}</Text>
                  <Text style={styles.statLabel}>Products</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{bizData.services_count || 0}</Text>
                  <Text style={styles.statLabel}>Services</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{bizData.employees_count || 0}</Text>
                  <Text style={styles.statLabel}>Employees</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statNum}>{bizData.branches_count || 0}</Text>
                  <Text style={styles.statLabel}>Branches</Text>
                </View>
              </View>

              {/* Rating */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Rating</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  {[1,2,3,4,5].map(star => (
                    <Ionicons key={star} name={star <= Math.round(bizData.rating || 0) ? 'star' : 'star-outline'} size={20} color="#ffaa00" />
                  ))}
                  <Text style={[styles.cardText, { marginLeft: 8 }]}>{(bizData.rating || 0).toFixed(1)} / 5 ({bizData.review_count || 0} reviews)</Text>
                </View>
              </View>

              {/* Revenue */}
              <View style={styles.revenueCard}>
                <Text style={styles.revenueLabel}>Monthly Revenue</Text>
                <Text style={styles.revenueValue}>KES {(bizData.revenue_month || 0).toLocaleString()}</Text>
              </View>

              {/* Actions */}
              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/shop')}>
                <Ionicons name="cart-outline" size={20} color="#00d4ff" />
                <Text style={styles.actionText}>Go to Shop</Text>
                <Ionicons name="chevron-forward" size={16} color="#444" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/market')}>
                <Ionicons name="storefront-outline" size={20} color="#00d4ff" />
                <Text style={styles.actionText}>Go to Market</Text>
                <Ionicons name="chevron-forward" size={16} color="#444" />
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginTop: 16 },
  emptySubtitle: { fontSize: 14, color: '#666', marginTop: 8, textAlign: 'center', paddingHorizontal: 32 },
  button: { backgroundColor: '#00d4ff', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 10, marginTop: 16 },
  buttonText: { color: '#000', fontSize: 16, fontWeight: '600' },
  bizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  logoPlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#00d4ff11', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  bizHeaderInfo: { flex: 1, marginLeft: 16 },
  bizName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  bizCategory: { color: '#888', fontSize: 13, marginTop: 2 },
  bizMetaRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00ff8811', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  verifiedText: { color: '#00ff88', fontSize: 11, fontWeight: '600', marginLeft: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: '600' },
  card: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#1a1a1a' },
  cardTitle: { fontSize: 12, fontWeight: '700', color: '#888', letterSpacing: 1, marginBottom: 8, textTransform: 'uppercase' },
  cardText: { color: '#ccc', fontSize: 14, lineHeight: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  statBox: { width: '48%', backgroundColor: '#111', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  statNum: { fontSize: 24, fontWeight: '700', color: '#00d4ff' },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  revenueCard: { backgroundColor: '#00d4ff11', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#00d4ff33' },
  revenueLabel: { color: '#00d4ff', fontSize: 12, fontWeight: '600' },
  revenueValue: { color: '#00d4ff', fontSize: 24, fontWeight: '700', marginTop: 4 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  actionText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#fff', marginLeft: 12 },
});
