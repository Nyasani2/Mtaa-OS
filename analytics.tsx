import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

type Period = '7' | '30' | '90' | 'all';

interface AnalyticsData {
  profile_views: number;
  content_views: number;
  business_views: number;
  service_views: number;
  product_views: number;
  new_followers: number;
  new_connections: number;
  post_likes: number;
  post_comments: number;
  post_shares: number;
  wallet_txs: number;
}

const DEFAULT_DATA: AnalyticsData = {
  profile_views: 0, content_views: 0, business_views: 0, service_views: 0,
  product_views: 0, new_followers: 0, new_connections: 0, post_likes: 0,
  post_comments: 0, post_shares: 0, wallet_txs: 0,
};

const PERIODS: { key: Period; label: string }[] = [
  { key: '7', label: '7 Days' },
  { key: '30', label: '30 Days' },
  { key: '90', label: '90 Days' },
  { key: 'all', label: 'All Time' },
];

// Helper: query with timeout
async function queryWithTimeout<T>(
  promise: Promise<{ data?: T; count?: number | null; error?: any }>,
  fallback: any,
  timeoutMs = 3000
): Promise<any> {
  return Promise.race([
    promise.then(r => r.data ?? r.count ?? fallback).catch(() => fallback),
    new Promise(resolve => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
}

export default function ProfileAnalyticsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [period, setPeriod] = useState<Period>('30');
  const [analytics, setAnalytics] = useState<AnalyticsData>(DEFAULT_DATA);
  const [prevAnalytics, setPrevAnalytics] = useState<AnalyticsData>(DEFAULT_DATA);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const getDateFilter = (p: Period) => {
    if (p === 'all') return null;
    const days = parseInt(p);
    const date = new Date();
    date.setDate(date.getDate() - days);
    return date.toISOString();
  };

  const loadAnalytics = async (targetPeriod: Period, isPrev: boolean = false) => {
    if (!user?.id) return;
    const since = getDateFilter(targetPeriod);
    const sincePrev = isPrev ? null : getDateFilter(targetPeriod === '7' ? '14' : targetPeriod === '30' ? '60' : targetPeriod === '90' ? '180' : 'all');

    try {
      // Each query has its own 3-second timeout — if table missing or RLS blocks, returns 0
      const profileViews = await queryWithTimeout(
        supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('event', 'profile_view').gte('created_at', since || '1970-01-01'),
        0
      );

      const contentViews = await queryWithTimeout(
        supabase.from('content_engagement').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('action', 'view').gte('created_at', since || '1970-01-01'),
        0
      );

      const postStats = await queryWithTimeout(
        supabase.from('post_stats').select('views, likes_count, comments_count, saves_count').gte('updated_at', since || '1970-01-01'),
        []
      );

      const newFollowers = await queryWithTimeout(
        supabase.from('user_follows').select('id', { count: 'exact', head: true }).eq('following_id', user.id).gte('created_at', since || '1970-01-01'),
        0
      );

      const walletTxs = await queryWithTimeout(
        supabase.from('wallet_transactions').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', since || '1970-01-01'),
        0
      );

      const businessViews = await queryWithTimeout(
        supabase.from('analytics_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('event', 'business_view').gte('created_at', since || '1970-01-01'),
        0
      );

      const totalPostViews = (postStats || []).reduce((sum: number, p: any) => sum + (p.views || 0), 0);
      const totalLikes = (postStats || []).reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0);
      const totalComments = (postStats || []).reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0);
      const totalShares = (postStats || []).reduce((sum: number, p: any) => sum + (p.saves_count || 0), 0);

      const data: AnalyticsData = {
        profile_views: Number(profileViews) || 0,
        content_views: (Number(contentViews) || 0) + totalPostViews,
        business_views: Number(businessViews) || 0,
        service_views: 0,
        product_views: 0,
        new_followers: Number(newFollowers) || 0,
        new_connections: Number(newFollowers) || 0,
        post_likes: totalLikes,
        post_comments: totalComments,
        post_shares: totalShares,
        wallet_txs: Number(walletTxs) || 0,
      };

      if (isPrev) {
        setPrevAnalytics(data);
      } else {
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([
      loadAnalytics(period),
      loadAnalytics(period === '7' ? '14' : period === '30' ? '60' : period === '90' ? '180' : 'all', true)
    ]).finally(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [period]); // Only depend on period, not on callback reference

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics(period);
    setRefreshing(false);
  };

  const getChange = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  const chartData = [
    { label: 'Profile Views', value: analytics.profile_views, color: '#00d4ff', prev: prevAnalytics.profile_views },
    { label: 'Content Views', value: analytics.content_views, color: '#00ff88', prev: prevAnalytics.content_views },
    { label: 'Post Likes', value: analytics.post_likes, color: '#ff00ff', prev: prevAnalytics.post_likes },
    { label: 'Comments', value: analytics.post_comments, color: '#ffaa00', prev: prevAnalytics.post_comments },
    { label: 'New Followers', value: analytics.new_followers, color: '#ff4444', prev: prevAnalytics.new_followers },
    { label: 'Wallet Txs', value: analytics.wallet_txs, color: '#aa66ff', prev: prevAnalytics.wallet_txs },
  ];

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Analytics</Text>
        <TouchableOpacity onPress={onRefresh}><Ionicons name="refresh" size={22} color="#00d4ff" /></TouchableOpacity>
      </View>
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d4ff" />}>
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map(p => (
            <TouchableOpacity key={p.key} style={[styles.periodBtn, period === p.key && styles.periodBtnActive]} onPress={() => setPeriod(p.key)}>
              <Text style={[styles.periodText, period === p.key && styles.periodTextActive]}>{p.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={styles.chartCard}>
          {chartData.map(item => {
            const change = getChange(item.value, item.prev);
            return (
              <View key={item.label} style={styles.chartRow}>
                <View style={styles.chartLabelCol}>
                  <Text style={styles.chartLabel}>{item.label}</Text>
                  <Text style={[styles.changeText, change >= 0 ? styles.changeUp : styles.changeDown]}>
                    {change >= 0 ? '▲' : '▼'} {Math.abs(change)}%
                  </Text>
                </View>
                <View style={styles.chartBarBg}>
                  <View style={[styles.chartBarFill, { width: `${Math.max(4, (item.value / maxValue) * 100)}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={[styles.chartValue, { color: item.color }]}>{item.value.toLocaleString()}</Text>
              </View>
            );
          })}
        </View>

        {/* Insights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Insights</Text>
          <View style={styles.insightCard}>
            <Ionicons name="trending-up-outline" size={24} color="#00ff88" />
            <View style={styles.insightInfo}>
              <Text style={styles.insightTitle}>Profile Views {getChange(analytics.profile_views, prevAnalytics.profile_views) >= 0 ? '+' : ''}{getChange(analytics.profile_views, prevAnalytics.profile_views)}%</Text>
              <Text style={styles.insightSub}>Compared to previous period</Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="people-outline" size={24} color="#00d4ff" />
            <View style={styles.insightInfo}>
              <Text style={styles.insightTitle}>Follower Growth {getChange(analytics.new_followers, prevAnalytics.new_followers) >= 0 ? '+' : ''}{getChange(analytics.new_followers, prevAnalytics.new_followers)}%</Text>
              <Text style={styles.insightSub}>New followers this period</Text>
            </View>
          </View>
          <View style={styles.insightCard}>
            <Ionicons name="heart-outline" size={24} color="#ff00ff" />
            <View style={styles.insightInfo}>
              <Text style={styles.insightTitle}>Engagement Rate {analytics.content_views > 0 ? Math.round((analytics.post_likes / analytics.content_views) * 100) : 0}%</Text>
              <Text style={styles.insightSub}>Likes per view</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  periodSelector: { flexDirection: 'row', padding: 16, gap: 8 },
  periodBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14, backgroundColor: '#111', borderWidth: 1, borderColor: '#1a1a1a' },
  periodBtnActive: { backgroundColor: '#00d4ff22', borderColor: '#00d4ff' },
  periodText: { color: '#888', fontSize: 12 },
  periodTextActive: { color: '#00d4ff', fontWeight: '600' },
  chartCard: { margin: 16, backgroundColor: '#111', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#1a1a1a' },
  chartRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  chartLabelCol: { width: 100 },
  chartLabel: { color: '#888', fontSize: 11 },
  changeText: { fontSize: 10, marginTop: 2 },
  changeUp: { color: '#00ff88' },
  changeDown: { color: '#ff4444' },
  chartBarBg: { flex: 1, height: 8, backgroundColor: '#222', borderRadius: 4, overflow: 'hidden', marginHorizontal: 10 },
  chartBarFill: { height: '100%', borderRadius: 4 },
  chartValue: { fontSize: 12, fontWeight: '700', width: 50, textAlign: 'right' },
  section: { paddingHorizontal: 16, marginTop: 8, marginBottom: 24 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#1a1a1a' },
  insightInfo: { flex: 1, marginLeft: 12 },
  insightTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  insightSub: { color: '#888', fontSize: 12, marginTop: 2 },
});
