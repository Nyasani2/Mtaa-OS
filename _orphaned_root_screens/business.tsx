import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

interface BusinessProfile {
  id: string;
  name: string;
  type: string;
  status: string;
  verified: boolean;
  revenue_month: number;
}

export default function ProfileBusinessScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businesses, setBusinesses] = useState<BusinessProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBusinesses = async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data, error } = await supabase.from('businesses').select('*').eq('owner_id', user.id).order('created_at', { ascending: false });
    if (error) console.warn('[ProfileBusiness]', error.message);
    setBusinesses(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchBusinesses(); }, [user?.id]);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/business-register')}>
          <Ionicons name="add-circle" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>My Business</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/wallet/business-register')}>
          <Ionicons name="add-circle" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchBusinesses(); }} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {businesses.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="business-outline" size={48} color="#cbd5e1" />
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
                  <Ionicons name="storefront" size={24} color="#2563EB" />
                </View>
                <View style={styles.bizInfo}>
                  <Text style={styles.bizName}>{biz.name}</Text>
                  <Text style={styles.bizType}>{biz.type}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: biz.status === 'active' ? '#dcfce7' : '#fef3c7' }]}>
                  <Text style={[styles.statusText, { color: biz.status === 'active' ? '#059669' : '#d97706' }]}>{biz.status}</Text>
                </View>
              </View>
              <View style={styles.bizStats}>
                <Text style={styles.bizStat}>Revenue: KES {(biz.revenue_month || 0).toLocaleString()}</Text>
                {biz.verified && <Ionicons name="shield-checkmark" size={16} color="#2563EB" />}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', paddingHorizontal: 32 },
  registerBtn: { backgroundColor: '#2563EB', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24, marginTop: 20 },
  registerBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  bizCard: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  bizHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  bizIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  bizInfo: { flex: 1, marginLeft: 12 },
  bizName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  bizType: { fontSize: 13, color: '#64748b', marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  statusText: { fontSize: 11, fontWeight: '600' },
  bizStats: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bizStat: { fontSize: 13, color: '#334155' },
});
