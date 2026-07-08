import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface AnalyticsSummary {
  totalVideos: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalSubscribers: number;
  totalWatchTime: number;
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [summary, setSummary] = useState<AnalyticsSummary>({
    totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalSubscribers: 0, totalWatchTime: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const fetchAnalytics = async () => {
    if (!user?.id) return;
    try {
      const { data: videos } = await supabase
        .from('studio_videos')
        .select('views_count, likes_count, comments_count, duration_seconds')
        .eq('creator_id', user.id)
        .eq('status', 'published');

      const { count: subsCount } = await supabase
        .from('studio_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      const totals = (videos || []).reduce((acc, v) => ({
        totalVideos: acc.totalVideos + 1,
        totalViews: acc.totalViews + (v.views_count || 0),
        totalLikes: acc.totalLikes + (v.likes_count || 0),
        totalComments: acc.totalComments + (v.comments_count || 0),
        totalSubscribers: subsCount || 0,
        totalWatchTime: acc.totalWatchTime + ((v.views_count || 0) * (v.duration_seconds || 0)),
      }), { totalVideos: 0, totalViews: 0, totalLikes: 0, totalComments: 0, totalSubscribers: subsCount || 0, totalWatchTime: 0 });

      setSummary(totals);
    } catch (e) {
      console.error('Analytics error:', e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, [user?.id]);

  const formatNumber = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    if (h >= 1000) return (h / 1000).toFixed(1) + 'K hrs';
    if (h > 0) return h + ' hrs';
    const m = Math.floor(seconds / 60);
    return m + ' min';
  };

  const stats = [
    { label: 'Videos', value: summary.totalVideos, icon: 'film', color: '#6366f1' },
    { label: 'Views', value: summary.totalViews, icon: 'eye', color: '#22c55e' },
    { label: 'Likes', value: summary.totalLikes, icon: 'heart', color: '#ef4444' },
    { label: 'Comments', value: summary.totalComments, icon: 'message-circle', color: '#f59e0b' },
    { label: 'Subscribers', value: summary.totalSubscribers, icon: 'users', color: '#8b5cf6' },
    { label: 'Watch Time', value: formatTime(summary.totalWatchTime), icon: 'clock', color: '#06b6d4', isString: true },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['7d', '30d', '90d', 'all'] as const).map(p => (
          <TouchableOpacity
            key={p}
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
          >
            <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
              {p === 'all' ? 'All Time' : p}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnalytics(); }} tintColor="#6366f1" />}
        contentContainerStyle={{ padding: 16 }}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {stats.map(stat => (
            <View key={stat.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: stat.color + '20' }]}>
                <Feather name={stat.icon as any} size={20} color={stat.color} />
              </View>
              <Text style={styles.statValue}>
                {stat.isString ? stat.value : formatNumber(stat.value as number)}
              </Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/studio/dashboard')}>
            <Feather name="film" size={24} color="#6366f1" />
            <Text style={styles.actionText}>My Videos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/studio/monetization')}>
            <Feather name="dollar-sign" size={24} color="#22c55e" />
            <Text style={styles.actionText}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(os)/studio/comments')}>
            <Feather name="message-square" size={24} color="#f59e0b" />
            <Text style={styles.actionText}>Comments</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  periodRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a' },
  periodBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  periodText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  periodTextActive: { color: '#fff' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, marginBottom: 6 },
  statIcon: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  statValue: { color: '#fff', fontSize: 22, fontWeight: '800' },
  statLabel: { color: '#9ca3af', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginTop: 24, marginBottom: 12 },
  actionGrid: { flexDirection: 'row', gap: 10 },
  actionCard: { flex: 1, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 },
  actionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
