import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface FamilyMember { id: string; name: string; relationship: string; avatar_url: string | null; is_primary: boolean; created_at: string; }

export default function FamilyIndexScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFamily = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase.from('family_members').select('*').eq('user_id', user.id).order('is_primary', { ascending: false }).order('created_at', { ascending: true });
      if (error) throw error;
      setMembers(data || []);
    } catch (err) { console.error(err); Alert.alert('Error', 'Failed to load family members'); }
    finally { setLoading(false); setRefreshing(false); }
  }, [user?.id]);

  useEffect(() => { fetchFamily(); }, [fetchFamily]);

  const renderMember = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity style={styles.memberCard} onPress={() => router.push(`/(os)/profile/family/${item.id}`)}>
      <View style={styles.avatar}>
        {item.avatar_url ? <Image source={{ uri: item.avatar_url }} style={styles.avatarImg} /> : <Ionicons name="person" size={28} color="#94a3b8" />}
      </View>
      <View style={styles.memberInfo}>
        <Text style={styles.memberName}>{item.name}</Text>
        <Text style={styles.memberRel}>{item.relationship}</Text>
        {item.is_primary && <View style={styles.primaryBadge}><Text style={styles.primaryText}>Primary</Text></View>}
      </View>
      <Ionicons name="chevron-forward" size={20} color="#64748b" />
    </TouchableOpacity>
  );

  if (loading) return <View style={styles.container}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Family</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/family/add')}><Ionicons name="add" size={24} color="#3b82f6" /></TouchableOpacity>
      </View>
      <FlatList data={members} keyExtractor={(item) => item.id} renderItem={renderMember}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFamily(); }} tintColor="#3b82f6" />}
        contentContainerStyle={members.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people" size={48} color="#334155" />
            <Text style={styles.emptyTitle}>No Family Members</Text>
            <Text style={styles.emptySub}>Add family members to build your family tree</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(os)/profile/family/add')}><Text style={styles.addBtnText}>Add Member</Text></TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  memberCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b', backgroundColor: '#1e293b', marginHorizontal: 12, marginTop: 8, borderRadius: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  avatarImg: { width: 48, height: 48, borderRadius: 24 },
  memberInfo: { flex: 1, marginLeft: 12 },
  memberName: { fontSize: 16, fontWeight: '600', color: '#f1f5f9' },
  memberRel: { fontSize: 13, color: '#94a3b8', marginTop: 2 },
  primaryBadge: { backgroundColor: '#3b82f6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 },
  primaryText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center' },
  emptyState: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#f1f5f9', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center' },
  addBtn: { backgroundColor: '#3b82f6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8, marginTop: 20 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
