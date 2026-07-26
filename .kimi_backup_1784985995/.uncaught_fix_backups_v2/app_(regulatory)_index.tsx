import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

export default function RegulatoryIndexScreen() {
  const { user, session } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    async function loadData() {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      if (profileData) setProfile(profileData);

      const { data: bizData } = await supabase
        .from('businesses')
        .select('*')
        .eq('owner_id', user.id)
        .limit(10);
      if (bizData) setBusinesses(bizData);

      setLoading(false);
    }
    loadData();
  }, [user]);

  if (!user) {
    return (
      <View style={styles.center}>
        <Ionicons name="shield-checkmark" size={64} color="#0a7ea4" />
        <Text style={styles.title}>Regulatory Portal</Text>
        <Text style={styles.subtitle}>Sign in to manage your business licenses and compliance</Text>
        <TouchableOpacity style={styles.btn} onPress={() => router.push('/auth')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.name || user.email?.split('@')[0] || 'User'}</Text>
          <Text style={styles.subGreeting}>Regulatory & Compliance Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.profileBtn} onPress={() => router.push('/(os)/profile')}>
          <Ionicons name="person-circle" size={40} color="#0a7ea4" />
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{businesses.length}</Text>
          <Text style={styles.statLabel}>Businesses</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{businesses.filter((b) => b.status === 'verified').length}</Text>
          <Text style={styles.statLabel}>Verified</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{businesses.filter((b) => b.status === 'pending').length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/regulatory/business-register')}>
          <Ionicons name="business" size={28} color="#0a7ea4" />
          <Text style={styles.actionText}>Register Business</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/wallet/business-documents')}>
          <Ionicons name="document-text" size={28} color="#0a7ea4" />
          <Text style={styles.actionText}>Documents</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/wallet/regulatory')}>
          <Ionicons name="cash" size={28} color="#0a7ea4" />
          <Text style={styles.actionText}>Pay Fees</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/settings/security-center')}>
          <Ionicons name="shield-checkmark" size={28} color="#0a7ea4" />
          <Text style={styles.actionText}>Compliance</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>My Businesses</Text>
      {businesses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="storefront-outline" size={48} color="#9BA1A6" />
          <Text style={styles.emptyText}>No businesses registered yet</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push('/(os)/regulatory/business-register')}>
            <Text style={styles.btnText}>Register Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        businesses.map((biz) => (
          <TouchableOpacity key={biz.id} style={styles.bizCard} onPress={() => router.push(`/(os)/wallet/business/${biz.id}`)}>
            <View style={styles.bizHeader}>
              <Text style={styles.bizName}>{biz.name}</Text>
              <View style={[styles.statusBadge, biz.status === 'verified' ? styles.verified : styles.pending]}>
                <Text style={styles.statusText}>{biz.status}</Text>
              </View>
            </View>
            <Text style={styles.bizMeta}>{biz.type} • {biz.location}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#687076', textAlign: 'center', marginBottom: 24, paddingHorizontal: 20 },
  btn: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#0a7ea4', borderRadius: 8, marginTop: 8 },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E1E3E5' },
  greeting: { fontSize: 20, fontWeight: '700' },
  subGreeting: { fontSize: 13, color: '#687076', marginTop: 2 },
  profileBtn: { padding: 4 },
  statsRow: { flexDirection: 'row', padding: 16, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E1E3E5' },
  statNumber: { fontSize: 24, fontWeight: '700', color: '#0a7ea4' },
  statLabel: { fontSize: 12, color: '#687076', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginTop: 20, marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 12 },
  actionCard: { width: '47%', backgroundColor: '#fff', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E1E3E5' },
  actionText: { fontSize: 13, fontWeight: '600', marginTop: 8, color: '#111' },
  emptyState: { alignItems: 'center', padding: 24, backgroundColor: '#fff', margin: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E1E3E5' },
  emptyText: { fontSize: 14, color: '#687076', marginTop: 12, marginBottom: 16 },
  bizCard: { backgroundColor: '#fff', marginHorizontal: 16, marginBottom: 12, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E1E3E5' },
  bizHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bizName: { fontSize: 16, fontWeight: '700' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  verified: { backgroundColor: '#E6F9F0' },
  pending: { backgroundColor: '#FFF4E6' },
  statusText: { fontSize: 11, fontWeight: '600', textTransform: 'capitalize' },
  bizMeta: { fontSize: 13, color: '#687076', marginTop: 4 },
});
