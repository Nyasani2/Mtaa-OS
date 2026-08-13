import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface BusinessProfile { id: string; name: string; business_type: string | null; description: string | null; location: string | null; phone: string | null; email: string | null; website: string | null; verified: boolean; is_public: boolean; }

export default function BusinessIndexScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchProfile = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.from('business_profiles').select('*').eq('user_id', user.id).single();
      if (error && error.code !== 'PGRST116') throw error;
      setProfile(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
          <Text style={styles.headerTitle}>Business Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="business" size={48} color="#334155" />
          <Text style={styles.emptyTitle}>No Business Profile</Text>
          <Text style={styles.emptySub}>Set up your business profile to attract customers</Text>
          <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(os)/profile/business/edit' as any)}><Text style={styles.createBtnText}>Create Profile</Text></TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.name}</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/business/edit' as any)}><Ionicons name="create-outline" size={22} color="#3b82f6" /></TouchableOpacity>
      </View>
      <View style={styles.card}>
        <Text style={styles.bizName}>{profile.name}</Text>
        {profile.business_type && <Text style={styles.bizType}>{profile.business_type}</Text>}
        {profile.verified && <View style={styles.verifiedBadge}><Ionicons name="checkmark-circle" size={14} color="#fff" /><Text style={styles.verifiedText}>Verified</Text></View>}
      </View>
      {profile.description && <View style={styles.section}><Text style={styles.sectionTitle}>About</Text><Text style={styles.descText}>{profile.description}</Text></View>}
      <View style={styles.section}>
        {profile.location && <View style={styles.infoRow}><Ionicons name="location-outline" size={18} color="#64748b" /><Text style={styles.infoText}>{profile.location}</Text></View>}
        {profile.phone && <View style={styles.infoRow}><Ionicons name="call-outline" size={18} color="#64748b" /><Text style={styles.infoText}>{profile.phone}</Text></View>}
        {profile.email && <View style={styles.infoRow}><Ionicons name="mail-outline" size={18} color="#64748b" /><Text style={styles.infoText}>{profile.email}</Text></View>}
        {profile.website && <View style={styles.infoRow}><Ionicons name="globe-outline" size={18} color="#64748b" /><Text style={styles.infoText}>{profile.website}</Text></View>}
      </View>
      <View style={styles.section}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(os)/profile/business/dashboard' as any)}>
          <Ionicons name="stats-chart" size={20} color="#3b82f6" /><Text style={styles.actionText}>Business Dashboard</Text><Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  createBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  createBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  card: { backgroundColor: '#1e293b', margin: 16, padding: 20, borderRadius: 12 },
  bizName: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  bizType: { fontSize: 14, color: '#94a3b8', marginTop: 4 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start', marginTop: 10, gap: 4 },
  verifiedText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  section: { paddingHorizontal: 16, marginTop: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 10 },
  descText: { fontSize: 14, color: '#94a3b8', lineHeight: 22 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 10 },
  infoText: { fontSize: 14, color: '#f1f5f9' },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', padding: 16, borderRadius: 10 },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12, fontWeight: '500' },
});
