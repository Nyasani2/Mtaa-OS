// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function BusinessManagerScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBusinesses();
  }, [user?.id]);

  const loadBusinesses = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
      
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setBusinesses(data || []);
    }
    setLoading(false);
  };

  const createBusiness = () => {
    router.push('/(os)/profile/business/edit');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Businesses</Text>
        <TouchableOpacity onPress={createBusiness}>
          <Ionicons name="add-circle" size={28} color="#10b981" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsBar}>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{businesses.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{businesses.filter(b => b.business_type === 'restaurant').length}</Text>
          <Text style={styles.statLabel}>Restaurants</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statNum}>{businesses.filter(b => b.business_type === 'retail').length}</Text>
          <Text style={styles.statLabel}>Shops</Text>
        </View>
      </View>

      {businesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={64} color="#64748b" />
          <Text style={styles.emptyTitle}>No Businesses Yet</Text>
          <Text style={styles.emptyText}>Create your first business profile to start accepting payments, managing inventory, and building your brand on MTAA.</Text>
          <TouchableOpacity style={styles.createButton} onPress={createBusiness}>
            <Ionicons name="add-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.createButtonText}>Create Your First Business</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {businesses.map((biz) => (
            <View key={biz.id} style={styles.bizCard}>
              <View style={[styles.bizIcon, { backgroundColor: biz.theme_color || '#8b5cf6' }]}>
                <Ionicons name={biz.business_type === 'restaurant' ? 'restaurant' : 'storefront'} size={24} color="#fff" />
              </View>
              <View style={styles.bizInfo}>
                <Text style={styles.bizName}>{biz.business_name}</Text>
                <Text style={styles.bizType}>{biz.business_type} • {biz.address || 'No address'}</Text>
              </View>
              <View style={styles.bizActions}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(os)/business/${biz.id}`)}>
                  <Ionicons name="eye" size={18} color="#8b5cf6" />
                  <Text style={styles.actionBtnText}>Open Website</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn} onPress={() => router.push(`/(os)/profile/business/edit?id=${biz.id}`)}>
                  <Ionicons name="pencil" size={18} color="#10b981" />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}
      
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, paddingTop: 60, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statsBar: { flexDirection: 'row', padding: 20, gap: 12 },
  statBox: { flex: 1, backgroundColor: '#1e293b', padding: 16, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  statNum: { fontSize: 24, fontWeight: '800', color: '#8b5cf6' },
  statLabel: { fontSize: 11, color: '#94a3b8', marginTop: 4, textAlign: 'center' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 40 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  createButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#8b5cf6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  createButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  list: { padding: 20 },
  bizCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#334155' },
  bizIcon: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  bizInfo: { flex: 1 },
  bizName: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 4 },
  bizType: { fontSize: 13, color: '#94a3b8' },
  bizActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#0f172a' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#fff', marginLeft: 4 },
});
