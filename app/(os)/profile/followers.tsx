// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';

interface FollowerUser {
  id: string;
  follower_id: string;
  following_id: string;
  created_at: string;
  profiles: {
    user_id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    is_verified: boolean;
  } | null;
}

export default function FollowersScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [followers, setFollowers] = useState<FollowerUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowers = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    const { data, error } = await supabase
      .from('streets_follows')
      .select('*, profiles:follower_id(user_id, display_name, username, avatar_url, is_verified)')
      .eq('following_id', user.id)
      .order('created_at', { ascending: false });
    if (error) console.warn('[Followers]', error.message);
    setFollowers(data || []);
    setLoading(false);
    setRefreshing(false);
  }, [user?.id]);

  useEffect(() => { fetchFollowers(); }, [fetchFollowers]);

  const handleFollowBack = async (targetId: string) => {
    if (!user?.id) return;
    const { error } = await supabase.from('streets_follows').insert({ follower_id: user.id, following_id: targetId });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Success', 'You are now following this user');
    fetchFollowers();
  };

  const renderItem = ({ item }: { item: FollowerUser }) => {
    const p = item.profiles;
    const name = p?.display_name || p?.username || 'User';
    return (
      <TouchableOpacity style={styles.row} onPress={() => router.push(`/(os)/profile/${p?.user_id || item.follower_id}` as any)}>
        {p?.avatar_url ? (
          <Image source={{ uri: p.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{name.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{name}</Text>
            {p?.is_verified && <Ionicons name="checkmark-circle" size={14} color="#2563EB" />}
          </View>
          <Text style={styles.username}>@{p?.username || 'user'}</Text>
        </View>
        <TouchableOpacity style={styles.followBtn} onPress={() => handleFollowBack(item.follower_id)}>
          <Text style={styles.followBtnText}>Follow Back</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (loading) return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Followers</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#2563EB" /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#0f172a" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Followers</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={followers}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFollowers(); }} />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="people-outline" size={48} color="#cbd5e1" />
            <Text style={styles.emptyTitle}>No followers yet</Text>
            <Text style={styles.emptySubtitle}>Your followers will appear here</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  avatar: { width: 48, height: 48, borderRadius: 24 },
  avatarFallback: { backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center' },
  avatarInitial: { color: '#fff', fontSize: 18, fontWeight: '700' },
  info: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  name: { fontSize: 15, fontWeight: '600', color: '#0f172a' },
  username: { fontSize: 13, color: '#64748b', marginTop: 2 },
  followBtn: { backgroundColor: '#2563EB', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  followBtnText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  empty: { alignItems: 'center', paddingVertical: 80 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 16 },
  emptySubtitle: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
});
