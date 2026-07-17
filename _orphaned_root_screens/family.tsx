import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileFamilyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFamily = async () => {
    if (!user?.id) { setLoading(false); return; }
    // Query civic_family_network or similar — using child_profiles as fallback
    const { data, error } = await supabase.from('child_profiles').select('*').eq('parent_id', user.id).order('created_at', { ascending: false });
    if (error) console.warn('[ProfileFamily]', error.message);
    setMembers(data || []);
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => { fetchFamily(); }, [user?.id]);

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Family</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Family Network</Text>
        <TouchableOpacity onPress={() => Alert.alert('Add Member', 'Family member registration coming soon')}>
          <Ionicons name="add-circle" size={28} color="#2563EB" />
        </TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFamily(); }} />}
        contentContainerStyle={{ padding: 16 }}
      >
        {members.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No family members</Text>
            <Text style={styles.emptySubtitle}>Add family members to manage their profiles and safety</Text>
          </View>
        ) : (
          members.map(m => (
            <View key={m.id} style={styles.memberCard}>
              <View style={styles.memberIcon}>
                <Ionicons name="person" size={24} color="#2563EB" />
              </View>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>{m.name || 'Unnamed'}</Text>
                <Text style={styles.memberRole}>{m.relationship || 'Family Member'}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push(`/(os)/health?child_id=${m.id}` as any)}>
                <Ionicons name="medical-outline" size={20} color="#059669" />
              </TouchableOpacity>
            </View>
          ))
        )}

        <TouchableOpacity style={styles.safetyBtn} onPress={() => router.push('/(os)/health')}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#fff" />
          <Text style={styles.safetyBtnText}>Family Safety Center</Text>
        </TouchableOpacity>
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
  memberCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#e2e8f0' },
  memberIcon: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#eff6ff', justifyContent: 'center', alignItems: 'center' },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  memberRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
  safetyBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', paddingVertical: 14, borderRadius: 24, marginTop: 24, gap: 8 },
  safetyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
});
