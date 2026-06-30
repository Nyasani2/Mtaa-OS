import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function BusinessDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ orders: 0, revenue: 0, customers: 0, rating: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    if (!user?.id) return;
    try {
      const { count: orders } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user.id);
      const { count: customers } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('seller_id', user.id);
      setStats({ orders: orders || 0, revenue: 0, customers: customers || 0, rating: 0 });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const statCards = [
    { label: 'Orders', value: stats.orders, icon: 'cart', color: '#3b82f6' },
    { label: 'Revenue', value: `KSh ${stats.revenue.toLocaleString()}`, icon: 'cash', color: '#10b981' },
    { label: 'Customers', value: stats.customers, icon: 'people', color: '#f59e0b' },
    { label: 'Rating', value: stats.rating || 'N/A', icon: 'star', color: '#8b5cf6' },
  ];

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Business Dashboard</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.statsGrid}>
        {statCards.map((stat) => (
          <View key={stat.label} style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}><Ionicons name={stat.icon as any} size={24} color={stat.color} /></View>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </View>
        ))}
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/shop')}>
          <Ionicons name="storefront" size={20} color="#3b82f6" /><Text style={styles.actionText}>Manage Shop</Text><Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/business/edit')}>
          <Ionicons name="create" size={20} color="#10b981" /><Text style={styles.actionText}>Edit Business</Text><Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 12, gap: 12 },
  statCard: { width: '47%', backgroundColor: '#1e293b', borderRadius: 12, padding: 16, alignItems: 'center' },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  statLabel: { fontSize: 13, color: '#94a3b8', marginTop: 4 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 10, marginBottom: 8 },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12, fontWeight: '500' },
});
