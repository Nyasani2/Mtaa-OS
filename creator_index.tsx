import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface CreatorData {
  posts: number;
  followers: number;
  following: number;
  earnings: number;
  views: number;
  likes: number;
}

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [data, setData] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    setLoading(true);
    try {
      const [
        { count: posts },
        { count: followers },
        { count: following },
        { data: earnings },
        { data: postStats },
      ] = await Promise.all([
        supabase.from('streets_posts').select('*', { count: 'exact', head: true }).eq('creator_id', user.id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id),
        supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('follower_id', user.id),
        supabase.from('content_earnings').select('creator_amount').eq('user_id', user.id),
        supabase.from('post_stats').select('views, likes_count').in('post_id', (await supabase.from('streets_posts').select('id').eq('creator_id', user.id)).data?.map(p => p.id) || []),
      ]);

      const totalEarnings = (earnings || []).reduce((sum, e) => sum + (e.creator_amount || 0), 0);
      const totalViews = postStats?.reduce((sum, p) => sum + (p.views || 0), 0) || 0;
      const totalLikes = postStats?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;

      setData({ posts: posts || 0, followers: followers || 0, following: following || 0, earnings: totalEarnings, views: totalViews, likes: totalLikes });
    } catch (err) {
      console.error('Creator load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} tintColor="#00d4ff" />}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Creator Dashboard</Text>
          <Text style={styles.headerSubtitle}>Manage your content and profile</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data?.posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data?.followers || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{data?.following || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{(data?.views || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{(data?.likes || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>KES {(data?.earnings || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#00d4ff' }]} onPress={() => router.push('/(os)/streets/create')}>
            <Ionicons name="add-circle-outline" size={24} color="#000" />
            <Text style={styles.actionButtonText}>New Post</Text>
            <Text style={styles.actionButtonSubtext}>Create content on Streets</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#00ff88' }]} onPress={() => router.push('/(os)/profile/edit')}>
            <Ionicons name="create-outline" size={24} color="#000" />
            <Text style={styles.actionButtonText}>Edit Profile</Text>
            <Text style={styles.actionButtonSubtext}>Update your profile info</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ff00ff' }]} onPress={() => router.push('/(os)/profile/creator/earnings')}>
            <Ionicons name="cash-outline" size={24} color="#fff" />
            <Text style={[styles.actionButtonText, { color: '#fff' }]}>Earnings</Text>
            <Text style={[styles.actionButtonSubtext, { color: '#fff' }]}>View and withdraw earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionButton, { backgroundColor: '#ffaa00' }]} onPress={() => router.push('/(os)/profile/creator/dashboard')}>
            <Ionicons name="analytics-outline" size={24} color="#000" />
            <Text style={styles.actionButtonText}>Analytics</Text>
            <Text style={styles.actionButtonSubtext}>Detailed creator stats</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Getting Started</Text>
          <Text style={styles.infoText}>Create content on Streets to build your audience. Share photos, videos, and articles. Earn from tips, ads, and subscriptions through the creator program.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 32 },
  header: { paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#111', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#888', marginTop: 4 },
  statsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 8, gap: 12 },
  statCard: { flex: 1, backgroundColor: '#111', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  statNumber: { fontSize: 20, fontWeight: '700', color: '#00d4ff' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4 },
  actionsContainer: { paddingHorizontal: 16, gap: 12, marginTop: 8 },
  actionButton: { borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center' },
  actionButtonText: { color: '#000', fontSize: 16, fontWeight: '600', marginLeft: 12, flex: 1 },
  actionButtonSubtext: { color: '#000', fontSize: 12, opacity: 0.7 },
  infoCard: { marginHorizontal: 16, marginTop: 20, backgroundColor: '#111', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 8 },
  infoText: { fontSize: 14, color: '#888', lineHeight: 20 },
});
