import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface CreatorStats {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_earnings: number;
  follower_growth: number;
  top_post: { id: string; title: string; views: number } | null;
}

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    if (!user?.id) { setLoading(false); return; }
    try {
      // Get post IDs first
      const { data: posts } = await supabase.from('streets_posts').select('id, title, created_at').eq('creator_id', user.id).order('created_at', { ascending: false });
      const postIds = posts?.map((p: any) => p.id) || [];

      // Get post stats
      let postStatsData: any[] = [];
      if (postIds.length > 0) {
        const { data } = await supabase.from('post_stats').select('post_id, views, likes_count').in('post_id', postIds);
        postStatsData = data || [];
      }

      // Get follower count
      const { count: followers } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id);

      // Get earnings
      const { data: earnings } = await supabase.from('content_earnings').select('creator_amount').eq('user_id', user.id);

      // Get follower growth (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: newFollowers } = await supabase.from('user_follows').select('*', { count: 'exact', head: true }).eq('following_id', user.id).gte('created_at', thirtyDaysAgo.toISOString());

      // Find top post
      let topPost = null;
      if (postStatsData.length > 0) {
        const top = postStatsData.reduce((max, p) => (p.views || 0) > (max.views || 0) ? p : max, postStatsData[0]);
        const post = posts?.find((p: any) => p.id === top.post_id);
        if (post) topPost = { id: post.id, title: post.title || 'Untitled', views: top.views || 0 };
      }

      const totalViews = postStatsData.reduce((sum, p) => sum + (p.views || 0), 0);
      const totalLikes = postStatsData.reduce((sum, p) => sum + (p.likes_count || 0), 0);
      const totalEarnings = (earnings || []).reduce((sum, e) => sum + (e.creator_amount || 0), 0);

      setStats({
        total_posts: postIds.length,
        total_views: totalViews,
        total_likes: totalLikes,
        total_earnings: totalEarnings,
        follower_growth: newFollowers || 0,
        top_post: topPost,
      });
    } catch (e) {
      console.warn('[CreatorDashboard]', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  if (loading) return (
    <View style={[styles.container, styles.center]}>
      <ActivityIndicator size="large" color="#00d4ff" />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Creator Dashboard</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/profile/creator' as any)}>
          <Ionicons name="settings-outline" size={24} color="#00d4ff" /></TouchableOpacity>
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchStats(); }} tintColor="#00d4ff" />}
        contentContainerStyle={{ padding: 16 }}
      >
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Ionicons name="document-text-outline" size={24} color="#00d4ff" />
            <Text style={styles.statValue}>{stats?.total_posts || 0}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="eye-outline" size={24} color="#00ff88" />
            <Text style={styles.statValue}>{(stats?.total_views || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Views</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="heart-outline" size={24} color="#ff00ff" />
            <Text style={styles.statValue}>{(stats?.total_likes || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Likes</Text>
          </View>
          <View style={styles.statCard}>
            <Ionicons name="wallet-outline" size={24} color="#ffaa00" />
            <Text style={styles.statValue}>KES {(stats?.total_earnings || 0).toLocaleString()}</Text>
            <Text style={styles.statLabel}>Earnings</Text>
          </View>
        </View>

        {stats?.top_post && (
          <View style={styles.topPostCard}>
            <Text style={styles.sectionTitle}>Top Post</Text>
            <TouchableOpacity style={styles.topPostRow} onPress={() => router.push(`/(os)/streets/post/${stats.top_post?.id}` as any)}>
              <Ionicons name="trophy" size={20} color="#ffaa00" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.topPostTitle}>{stats.top_post.title}</Text>
                <Text style={styles.topPostViews}>{stats.top_post.views.toLocaleString()} views</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#444" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.growthCard}>
          <Text style={styles.sectionTitle}>Follower Growth</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="trending-up" size={24} color="#00ff88" />
            <Text style={styles.growthValue}>+{stats?.follower_growth || 0}</Text>
            <Text style={styles.growthLabel}>new followers this month</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/streets/create' as any)}>
            <Ionicons name="add-circle-outline" size={28} color="#00d4ff" />
            <Text style={styles.actionText}>New Post</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/studio' as any)}>
            <Ionicons name="videocam-outline" size={28} color="#ff00ff" />
            <Text style={styles.actionText}>Studio</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/profile/analytics' as any)}>
            <Ionicons name="analytics-outline" size={28} color="#00ff88" />
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/profile/creator/earnings' as any)}>
            <Ionicons name="cash-outline" size={28} color="#ffaa00" />
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { width: '47%', backgroundColor: '#111', padding: 16, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  statValue: { fontSize: 20, fontWeight: '700', color: '#fff', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#888', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#fff', marginBottom: 12, marginTop: 8 },
  topPostCard: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  topPostRow: { flexDirection: 'row', alignItems: 'center' },
  topPostTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  topPostViews: { color: '#888', fontSize: 12, marginTop: 2 },
  growthCard: { backgroundColor: '#111', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  growthValue: { color: '#00ff88', fontSize: 24, fontWeight: '700', marginLeft: 12 },
  growthLabel: { color: '#888', fontSize: 13, marginLeft: 8 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: '47%', backgroundColor: '#111', padding: 20, borderRadius: 16, alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a' },
  actionText: { fontSize: 13, fontWeight: '600', color: '#fff', marginTop: 8 },
});
