import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

interface CreatorProfile {
  id: string;
  display_name: string | null;
  bio: string | null;
  niche: string | null;
  follower_count: number;
  post_count: number;
  is_verified: boolean;
  monetization_enabled: boolean;
}

export default function CreatorProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { fetchProfile(); }, [user?.id]);

  const fetchProfile = async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      const { data, error } = await supabase
        .from('creator_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Creator profile error:', error);
      }
      setProfile(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchProfile(); };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Profile</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#f1f5f9" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Profile</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/creator/edit' as any)}>
          <Ionicons name="create-outline" size={22} color="#3b82f6" />
        </TouchableOpacity>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={40} color="#94a3b8" />
        </View>
        <Text style={styles.name}>{profile?.display_name || user?.user_metadata?.display_name || 'Creator'}</Text>
        {profile?.is_verified && (
          <View style={styles.verifiedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#fff" />
            <Text style={styles.verifiedText}>Verified</Text>
          </View>
        )}
        <Text style={styles.bio}>{profile?.bio || 'No bio yet. Tap edit to add one.'}</Text>
        {profile?.niche && <Text style={styles.niche}>{profile.niche}</Text>}
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.follower_count || 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.post_count || 0}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{profile?.monetization_enabled ? 'On' : 'Off'}</Text>
          <Text style={styles.statLabel}>Monetization</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Creator Tools</Text>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/creator/earnings' as any)}>
          <Ionicons name="cash-outline" size={20} color="#10b981" />
          <Text style={styles.actionText}>Earnings</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/creator/dashboard' as any)}>
          <Ionicons name="analytics-outline" size={20} color="#3b82f6" />
          <Text style={styles.actionText}>Analytics Dashboard</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/streets/create' as any)}>
          <Ionicons name="add-circle-outline" size={20} color="#f59e0b" />
          <Text style={styles.actionText}>Create Post</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionRow} onPress={() => router.push('/(os)/profile/creator/edit' as any)}>
          <Ionicons name="create-outline" size={20} color="#8b5cf6" />
          <Text style={styles.actionText}>Edit Profile</Text>
          <Ionicons name="chevron-forward" size={18} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Monetization */}
      {!profile?.monetization_enabled && (
        <View style={[styles.card, { borderColor: '#f59e0b', borderWidth: 1 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Ionicons name="sparkles" size={20} color="#f59e0b" />
            <Text style={[styles.cardTitle, { marginBottom: 0, marginLeft: 8 }]}>Enable Monetization</Text>
          </View>
          <Text style={styles.hintText}>Turn on monetization to start earning from your content.</Text>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#f59e0b' }]} onPress={() => router.push('/(os)/profile/creator/earnings' as any)}>
            <Text style={styles.actionBtnText}>Get Started</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  profileCard: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 22, fontWeight: '700', color: '#f1f5f9', marginTop: 16 },
  verifiedBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3b82f6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, marginTop: 8 },
  verifiedText: { color: '#fff', fontWeight: '600', fontSize: 12, marginLeft: 4 },
  bio: { fontSize: 14, color: '#94a3b8', textAlign: 'center', marginTop: 12, paddingHorizontal: 32 },
  niche: { fontSize: 13, color: '#64748b', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  statBox: { alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#f1f5f9' },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#334155' },
  actionText: { flex: 1, fontSize: 15, color: '#f1f5f9', marginLeft: 12 },
  actionBtn: { backgroundColor: '#3b82f6', paddingVertical: 12, borderRadius: 8, marginTop: 12, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  hintText: { fontSize: 13, color: '#94a3b8', marginBottom: 8 },
});
