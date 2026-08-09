import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  emergency_contact: boolean;
}

export default function FamilyScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [members, setMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rlsError, setRlsError] = useState(false);

  const fetchMembers = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('id, name, relationship, emergency_contact')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Family fetch error:', error);
        if (error.code === '42P17' || error.message?.includes('recursion')) setRlsError(true);
        setMembers([]);
      } else {
        setRlsError(false);
        setMembers(data || []);
      }
    } catch (err: any) {
      if (err?.message?.includes('recursion')) setRlsError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchMembers(); }, [user?.id]);
  const onRefresh = () => { setRefreshing(true); fetchMembers(); };

  const renderItem = ({ item }: { item: FamilyMember }) => (
    <TouchableOpacity style={styles.card} onPress={() => router.push(`/(os)/profile/family/${item.id}` as any)}>
      <View style={styles.avatar}><Ionicons name="person" size={24} color="#64748b" /></View>
      <View style={styles.info}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.relation}>{item.relationship}</Text>
      </View>
      {item.emergency_contact && <View style={styles.badge}><Ionicons name="medical" size={12} color="#ef4444" /></View>}
      <Ionicons name="chevron-forward" size={18} color="#475569" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Family</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/family/add' as any)}>
          <Ionicons name="add-circle" size={26} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {rlsError && (
        <View style={styles.warning}>
          <Ionicons name="warning-outline" size={18} color="#f59e0b" />
          <Text style={styles.warningText}>Database policy error. Run the SQL fix in Supabase to enable family features.</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
      ) : (
        <FlatList
          data={members}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}
          contentContainerStyle={members.length === 0 ? styles.emptyContainer : { padding: 16 }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="people-outline" size={48} color="#334155" />
              <Text style={styles.emptyTitle}>No Family Members</Text>
              <Text style={styles.emptySub}>Add family members to your family tree</Text>
              <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/(os)/profile/family/add' as any)}>
                <Text style={styles.addBtnText}>Add Member</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  warning: { flexDirection: 'row', alignItems: 'center', gap: 10, margin: 16, padding: 12, backgroundColor: '#f59e0b15', borderRadius: 10, borderWidth: 1, borderColor: '#f59e0b40' },
  warningText: { flex: 1, fontSize: 12, color: '#fbbf24', lineHeight: 18 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, backgroundColor: '#1e293b', borderRadius: 12, marginBottom: 10 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#334155', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: 12 },
  name: { fontSize: 15, fontWeight: '600', color: '#f1f5f9' },
  relation: { fontSize: 13, color: '#64748b', marginTop: 2 },
  badge: { padding: 6, backgroundColor: '#ef444410', borderRadius: 12, marginRight: 8 },
  emptyContainer: { flexGrow: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#94a3b8', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  addBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3b82f6', borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});
