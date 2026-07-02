import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';

type Period = '7d' | '30d' | '90d' | 'all';

interface AnalyticsData {
  profileViews: number;
  postViews: number;
  followerGrowth: number;
  engagementRate: number;
  topPosts: Array<{ id: string; title: string; views: number; likes: number; comments: number }>;
  period: Period;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('30d');
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getPeriodDate = (p: Period): string | null => {
    if (p === 'all') return null;
    const days = p === '7d' ? 7 : p === '30d' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  useEffect(() => { fetchAnalytics(); }, [period, user?.id]);

  const fetchAnalytics = async () => {
    if (!user?.id) { setLoading(false); return; }
    const since = getPeriodDate(period);

    try {
      // Profile views from analytics_events
      let profileQuery = supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event', 'profile_view')
        .eq('target_id', user.id);
      if (since) profileQuery = profileQuery.gte('created_at', since);
      const { count: profileViews, error: pvErr } = await profileQuery;

      // Post views — count post_views where viewer_id != user.id (others viewing user's posts)
      let postViewsQuery = supabase
        .from('post_views')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id); // user_id in post_views = the post owner
      if (since) postViewsQuery = postViewsQuery.gte('created_at', since);
      const { count: postViews, error: postErr } = await postViewsQuery;

      // Follower growth
      let followerQuery = supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      if (since) followerQuery = followerQuery.gte('created_at', since);
      const { count: followerGrowth, error: flwErr } = await followerQuery;

      // Post stats with user_id filter
      let postStatsQuery = supabase
        .from('post_stats')
        .select('post_id, views, likes, comments, posts(title)')
        .eq('user_id', user.id) // CRITICAL: filter by current user
        .order('views', { ascending: false })
        .limit(5);
      if (since) postStatsQuery = postStatsQuery.gte('created_at', since);
      const { data: postStats, error: statsErr } = await postStatsQuery;

      // Engagement rate: (total likes + comments) / total views * 100
      let engagementQuery = supabase
        .from('post_stats')
        .select('views, likes, comments')
        .eq('user_id', user.id);
      if (since) engagementQuery = engagementQuery.gte('created_at', since);
      const { data: engagementData, error: engErr } = await engagementQuery;

      let engagementRate = 0;
      if (engagementData && engagementData.length > 0) {
        const totalViews = engagementData.reduce((s, p) => s + (p.views || 0), 0);
        const totalEngagement = engagementData.reduce((s, p) => s + (p.likes || 0) + (p.comments || 0), 0);
        engagementRate = totalViews > 0 ? Math.round((totalEngagement / totalViews) * 100) : 0;
      }

      if (pvErr) console.error('Profile views error:', pvErr);
      if (postErr) console.error('Post views error:', postErr);
      if (flwErr) console.error('Follower error:', flwErr);
      if (statsErr) console.error('Post stats error:', statsErr);
      if (engErr) console.error('Engagement error:', engErr);

      const topPosts = (postStats || []).map((p: any) => ({
        id: p.post_id,
        title: p.posts?.title || 'Untitled Post',
        views: p.views || 0,
        likes: p.likes || 0,
        comments: p.comments || 0,
      }));

      setData({
        profileViews: profileViews || 0,
        postViews: postViews || 0,
        followerGrowth: followerGrowth || 0,
        engagementRate,
        topPosts,
        period,
      });
    } catch (err) {
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchAnalytics(); };

  const periodLabel = { '7d': 'Last 7 Days', '30d': 'Last 30 Days', '90d': 'Last 90 Days', 'all': 'All Time' };

  if (loading) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>
    </View>
  );

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#f1f5f9" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{periodLabel[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Ionicons name="eye-outline" size={24} color="#3b82f6" />
          <Text style={styles.statValue}>{data?.profileViews || 0}</Text>
          <Text style={styles.statLabel}>Profile Views</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="document-text-outline" size={24} color="#10b981" />
          <Text style={styles.statValue}>{data?.postViews || 0}</Text>
          <Text style={styles.statLabel}>Post Views</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="people-outline" size={24} color="#f59e0b" />
          <Text style={styles.statValue}>{data?.followerGrowth || 0}</Text>
          <Text style={styles.statLabel}>New Followers</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="heart-outline" size={24} color="#ef4444" />
          <Text style={styles.statValue}>{data?.engagementRate || 0}%</Text>
          <Text style={styles.statLabel}>Engagement</Text>
        </View>
      </View>

      {/* Top Posts */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Top Performing Posts</Text>
        {data?.topPosts && data.topPosts.length > 0 ? (
          data.topPosts.map((post) => (
            <View key={post.id} style={styles.postRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
                <View style={styles.postMeta}>
                  <Text style={styles.metaText}>{post.views} views</Text>
                  <Text style={styles.metaText}>{post.likes} likes</Text>
                  <Text style={styles.metaText}>{post.comments} comments</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => router.push(`/(os)/streets/post/${post.id}` as any)}>
                <Ionicons name="open-outline" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="bar-chart-outline" size={32} color="#334155" />
            <Text style={styles.emptyText}>No post data for this period</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#f1f5f9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  periodRow: { flexDirection: 'row', padding: 16, gap: 8 },
  periodBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1e293b' },
  periodBtnActive: { backgroundColor: '#3b82f6' },
  periodText: { fontSize: 12, color: '#94a3b8', fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  statCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, width: '47%', alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: '700', color: '#f1f5f9', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  card: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, margin: 16, marginBottom: 0 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#f1f5f9', marginBottom: 12 },
  postRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#334155' },
  postTitle: { fontSize: 14, fontWeight: '600', color: '#f1f5f9' },
  postMeta: { flexDirection: 'row', gap: 12, marginTop: 4 },
  metaText: { fontSize: 12, color: '#64748b' },
  emptyState: { alignItems: 'center', paddingVertical: 24 },
  emptyText: { fontSize: 14, color: '#64748b', marginTop: 8 },
});
