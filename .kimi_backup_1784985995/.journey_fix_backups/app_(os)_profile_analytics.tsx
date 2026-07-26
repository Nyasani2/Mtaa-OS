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
      // Profile views: analytics_events where event='profile_view' and user_id=current user
      // NOTE: analytics_events.user_id = the VIEWER, not the target. We use metadata->>'target_id' for target.
      let profileQuery = supabase
        .from('analytics_events')
        .select('*', { count: 'exact', head: true })
        .eq('event', 'profile_view')
        .filter('metadata->>target_id', 'eq', user.id);
      if (since) profileQuery = profileQuery.gte('created_at', since);
      const { count: profileViews, error: pvErr } = await profileQuery;

      // Post views: sum of views from post_stats for user's posts
      // First get user's post IDs from streets_posts
      let postsQuery = supabase
        .from('streets_posts')
        .select('id, title')
        .eq('creator_id', user.id);
      if (since) postsQuery = postsQuery.gte('created_at', since);
      const { data: userPosts, error: postsErr } = await postsQuery;

      let postViews = 0;
      let topPosts: any[] = [];

      if (userPosts && userPosts.length > 0) {
        const postIds = userPosts.map(p => p.id);

        // Get stats for these posts
        const { data: statsData, error: statsErr } = await supabase
          .from('post_stats')
          .select('post_id, views, likes_count, comments_count')
          .in('post_id', postIds)
          .order('views', { ascending: false })
          .limit(5);

        if (statsData) {
          postViews = statsData.reduce((sum, s) => sum + (Number(s.views) || 0), 0);
          topPosts = statsData.map(s => {
            const post = userPosts.find(p => p.id === s.post_id);
            return {
              id: s.post_id,
              title: post?.title || 'Untitled',
              views: Number(s.views) || 0,
              likes: s.likes_count || 0,
              comments: s.comments_count || 0,
            };
          });
        }
        if (statsErr) console.error('Post stats error:', statsErr);
      }

      // Follower growth
      let followerQuery = supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id);
      if (since) followerQuery = followerQuery.gte('created_at', since);
      const { count: followerGrowth, error: flwErr } = await followerQuery;

      // Engagement rate: (likes + comments) / views * 100
      let engagementRate = 0;
      if (userPosts && userPosts.length > 0) {
        const { data: allStats } = await supabase
          .from('post_stats')
          .select('views, likes_count, comments_count')
          .in('post_id', userPosts.map(p => p.id));
        if (allStats && allStats.length > 0) {
          const totalViews = allStats.reduce((s, p) => s + (Number(p.views) || 0), 0);
          const totalEngagement = allStats.reduce((s, p) => s + (p.likes_count || 0) + (p.comments_count || 0), 0);
          engagementRate = totalViews > 0 ? Math.round((totalEngagement / totalViews) * 100) : 0;
        }
      }

      if (pvErr) console.error('Profile views error:', pvErr);
      if (postsErr) console.error('Posts error:', postsErr);
      if (flwErr) console.error('Follower error:', flwErr);

      setData({
        profileViews: profileViews || 0,
        postViews,
        followerGrowth: followerGrowth || 0,
        engagementRate,
        topPosts,
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

      <View style={styles.periodRow}>
        {(['7d', '30d', '90d', 'all'] as Period[]).map((p) => (
          <TouchableOpacity key={p} style={[styles.periodBtn, period === p && styles.periodBtnActive]} onPress={() => setPeriod(p)}>
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{periodLabel[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>

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
