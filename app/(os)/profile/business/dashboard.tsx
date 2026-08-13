import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface BusinessProfile {
  id: string;
  name: string;
  category: string | null;
  description: string | null;
  rating: number | null;
  is_verified: boolean;
}

interface BusinessStats {
  revenue: number;
  orders: number;
  customers: number;
  rating: number;
  profile: BusinessProfile | null;
}

export default function BusinessDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<BusinessStats>({ revenue: 0, orders: 0, customers: 0, rating: 0, profile: null });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchStats(); }, [user?.id]);

  const fetchStats = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      // Get business profile from businesses table (owner_id = user.id)
      const { data: business, error: bizErr } = await supabase
        .from('businesses')
        .select('id, name, category, description, rating, is_verified')
        .eq('owner_id', user.id)
        .single();

      if (bizErr && bizErr.code !== 'PGRST116') console.error('Business error:', bizErr);

      let revenue = 0, orders = 0, customers = 0;

      if (business) {
        // Revenue from orders table where business_id = business.id
        const { data: orderData, error: ordErr } = await supabase
          .from('orders')
          .select('total_amount, buyer_id')
          .eq('business_id', business.id)
          .eq('status', 'completed');

        if (orderData) {
          revenue = orderData.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);
          orders = orderData.length;
          // Distinct customers
          const uniqueBuyers = new Set(orderData.map((o: any) => o.buyer_id).filter(Boolean));
          customers = uniqueBuyers.size;
        }
        if (ordErr) console.error('Orders error:', ordErr);
      }

      setStats({
        revenue,
        orders,
        customers,
        rating: business?.rating || 0,
        profile: business || null,
      });
    } catch (err) { console.error('Dashboard error:', err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); fetchStats(); };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Business Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Business Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/business/edit' as any)}>
          <Ionicons name="create-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}><Ionicons name="business" size={40} color="#94a3b8" /></View>
        <Text style={styles.name}>{stats.profile?.name || 'Your Business'}</Text>
        {stats.profile?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        {stats.profile?.category && <Text style={styles.category}>{stats.profile.category}</Text>}
        {stats.profile?.description && <Text style={styles.bio}>{stats.profile.description}</Text>}
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="cash-outline" size={24} color="#10b981" />
          <Text style={styles.statValue}>${stats.revenue.toLocaleString()}</Text>
          <Text style={styles.statLabel}>Revenue</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="cart-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{stats.orders}</Text>
          <Text style={styles.statLabel}>Orders</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{stats.customers}</Text>
          <Text style={styles.statLabel}>Customers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="star-outline" size={24} color="#ef4444" />
          <Text style={styles.statValue}>{stats.rating > 0 ? stats.rating.toFixed(1) : 'N/A'}</Text>
          <Text style={styles.statLabel}>Rating</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/shop/orders' as any)}>
          <Ionicons name="list-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>View Orders</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/business/edit' as any)}>
          <Ionicons name="create-outline" size={20} color="#10b981" />
          <Text style={styles.actionText}>Edit Business</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileCard: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  verifiedText: { color: '#fff', fontWeight: '600', fontSize: 12, marginLeft: 4 },
  category: { fontSize: 14, color: '#64748b', marginTop: 4 },
  bio: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 12, paddingHorizontal: 32 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, width: '47%', alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#f1f5f9', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12 },
});
