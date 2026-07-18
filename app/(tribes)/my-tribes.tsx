// app/(os)/tribes/my-tribes.tsx
// My Tribes Screen — tribes user has joined

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { identityEngine } from '@/lib/kernel/identity-engine';

export default function MyTribesScreen() {
  const router = useRouter();
  const [tribes, setTribes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMyTribes = async () => {
    const user = await identityEngine.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from('tribe_members')
      .select(`
        tribe_id,
        role,
        joined_at,
        tribes:tribe_id (*, tribe_categories:category_id (name, icon))
      `)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .order('joined_at', { ascending: false });

    if (!error) {
      setTribes((data || []).map((m: any) => ({
        ...m.tribes,
        my_role: m.role,
        joined_at: m.joined_at,
      })));
    }
    setLoading(false);
  };

  useEffect(() => {
    loadMyTribes();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backBtn}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Tribes</Text>
        <View style={{ width: 30 }} />
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadMyTribes} tintColor="#007AFF" />}
        contentContainerStyle={styles.scroll}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 60 }} />
        ) : tribes.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏕️</Text>
            <Text style={styles.emptyTitle}>You haven't joined any tribes</Text>
            <TouchableOpacity style={styles.discoverBtn} onPress={() => router.push('/(os)/tribes')}>
              <Text style={styles.discoverBtnText}>Discover Tribes</Text>
            </TouchableOpacity>
          </View>
        ) : (
          tribes.map((tribe) => (
            <TouchableOpacity
              key={tribe.id}
              style={styles.tribeCard}
              onPress={() => router.push(`/(os)/tribes/${tribe.id}`)}
            >
              <Image source={{ uri: tribe.avatar_url || 'https://via.placeholder.com/56' }} style={styles.tribeAvatar} />
              <View style={styles.tribeInfo}>
                <Text style={styles.tribeName}>{tribe.name}</Text>
                <Text style={styles.tribeMeta}>{tribe.category?.icon} {tribe.category?.name} • {tribe.my_role}</Text>
                <Text style={styles.tribeJoined}>Joined {new Date(tribe.joined_at).toLocaleDateString()}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  scroll: { padding: 16, paddingBottom: 40 },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 16 },
  discoverBtn: { backgroundColor: '#007AFF', borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12 },
  discoverBtnText: { color: '#fff', fontWeight: '700' },
  tribeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a2e', borderRadius: 14, padding: 14, marginBottom: 10 },
  tribeAvatar: { width: 56, height: 56, borderRadius: 28, marginRight: 14 },
  tribeInfo: { flex: 1 },
  tribeName: { fontSize: 15, fontWeight: '700', color: '#fff' },
  tribeMeta: { fontSize: 12, color: '#888', marginTop: 4 },
  tribeJoined: { fontSize: 11, color: '#666', marginTop: 2 },
  chevron: { fontSize: 20, color: '#666', marginLeft: 8 },
});
