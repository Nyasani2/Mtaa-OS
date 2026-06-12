// app/(os)/pulse/creator.tsx
// MTAA Pulse — Creator Dashboard (ported from old CreatorDashboard.tsx)

import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { rankingEngine } from '@/domains/pulse/services/rankingEngine';

interface CreatorStats {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_shares: number;
  total_comments: number;
  followers: number;
  earnings: number;
  overall_score: number;
}

interface ContentItem {
  id: string;
  content: string;
  media_url?: string;
  created_at: string;
  views: number;
  likes: number;
  shares: number;
  score: number;
}

export default function CreatorDashboard() {
  const { user } = useAuth();
  const params = useLocalSearchParams();
  const targetUserId = (params.user_id as string) || user?.id;

  const [stats, setStats] = useState<CreatorStats | null>(null);
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'content' | 'analytics' | 'earnings'>('overview');

  useEffect(() => {
    if (targetUserId) loadData();
  }, [targetUserId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: scoreData } = await supabase
        .from('pulse_creator_scores')
        .select('*')
        .eq('creator_id', targetUserId)
        .single();

      const { data: posts } = await supabase
        .from('pulse_events')
        .select('*')
        .eq('source', 'feed')
        .eq('event_type', 'post_created')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      let totalViews = 0, totalLikes = 0, totalShares = 0, totalComments = 0;
      const contentItems: ContentItem[] = (posts || []).map(post => {
        const p = post.payload || {};
        totalViews += p.views_count || 0;
        totalLikes += p.likes_count || 0;
        totalShares += p.shares_count || 0;
        totalComments += p.comments_count || 0;

        const ranked = rankingEngine.scoreContent({
          watch_time: p.watch_time || 0,
          duration: p.duration || 1,
          likes: p.likes_count || 0,
          comments: p.comments_count || 0,
          shares: p.shares_count || 0,
          views: p.views_count || 0,
        }, post.created_at);

        return {
          id: post.id,
          content: p.content || '',
          media_url: p.media_url,
          created_at: post.created_at,
          views: p.views_count || 0,
          likes: p.likes_count || 0,
          shares: p.shares_count || 0,
          score: ranked.score,
        };
      });

      setStats({
        total_posts: posts?.length || 0,
        total_views: totalViews,
        total_likes: totalLikes,
        total_shares: totalShares,
        total_comments: totalComments,
        followers: scoreData?.follower_count || 0,
        earnings: scoreData?.total_revenue || 0,
        overall_score: scoreData?.overall_score || 0,
      });

      setContent(contentItems.sort((a, b) => b.score - a.score));
    } catch (e) {
      console.error('Creator dashboard error:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading creator dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Creator Dashboard</Text>
        <Text style={styles.score}>Score: {stats?.overall_score.toFixed(1) || '0.0'}</Text>
      </View>

      <View style={styles.tabs}>
        {(['overview', 'content', 'analytics', 'earnings'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && (
        <View style={styles.overview}>
          <View style={styles.statsGrid}>
            <StatCard label="Posts" value={stats?.total_posts || 0} />
            <StatCard label="Views" value={stats?.total_views || 0} />
            <StatCard label="Likes" value={stats?.total_likes || 0} />
            <StatCard label="Shares" value={stats?.total_shares || 0} />
            <StatCard label="Comments" value={stats?.total_comments || 0} />
            <StatCard label="Followers" value={stats?.followers || 0} />
          </View>
          <View style={styles.earningsCard}>
            <Text style={styles.earningsLabel}>Total Earnings</Text>
            <Text style={styles.earningsValue}>KES {stats?.earnings.toLocaleString() || '0'}</Text>
          </View>
        </View>
      )}

      {activeTab === 'content' && (
        <View style={styles.contentList}>
          {content.map(item => (
            <View key={item.id} style={styles.contentCard}>
              <Text style={styles.contentText} numberOfLines={2}>{item.content}</Text>
              <View style={styles.contentStats}>
                <Text style={styles.statText}>Eyes {item.views}</Text>
                <Text style={styles.statText}>Heart {item.likes}</Text>
                <Text style={styles.statText}>Arrows {item.shares}</Text>
                <Text style={styles.statText}>Star {item.score.toFixed(1)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'analytics' && (
        <View style={styles.analytics}>
          <Text style={styles.sectionTitle}>Top Performing Content</Text>
          {content.slice(0, 5).map((item, index) => (
            <View key={item.id} style={styles.rankRow}>
              <Text style={styles.rankNumber}>#{index + 1}</Text>
              <Text style={styles.rankText} numberOfLines={1}>{item.content}</Text>
              <Text style={styles.rankScore}>{item.score.toFixed(1)}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'earnings' && (
        <View style={styles.earnings}>
          <Text style={styles.sectionTitle}>Earnings Breakdown</Text>
          <View style={styles.earningsRow}>
            <Text>Ad Revenue</Text>
            <Text>KES {((stats?.earnings || 0) * 0.6).toFixed(0)}</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text>Tips and Gifts</Text>
            <Text>KES {((stats?.earnings || 0) * 0.3).toFixed(0)}</Text>
          </View>
          <View style={styles.earningsRow}>
            <Text>Brand Deals</Text>
            <Text>KES {((stats?.earnings || 0) * 0.1).toFixed(0)}</Text>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value.toLocaleString()}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 24, fontWeight: 'bold' },
  score: { fontSize: 16, color: '#ff6b00', marginTop: 4 },
  tabs: { flexDirection: 'row', padding: 12, backgroundColor: '#fff', gap: 8 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#f0f0f0' },
  tabActive: { backgroundColor: '#ff6b00' },
  tabText: { fontSize: 14, color: '#666' },
  tabTextActive: { color: '#fff', fontWeight: '600' },
  overview: { padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { width: '30%', backgroundColor: '#fff', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#ff6b00' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  earningsCard: { backgroundColor: '#fff', marginTop: 16, padding: 20, borderRadius: 12 },
  earningsLabel: { fontSize: 14, color: '#666' },
  earningsValue: { fontSize: 28, fontWeight: 'bold', marginTop: 8 },
  contentList: { padding: 16 },
  contentCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  contentText: { fontSize: 14, marginBottom: 8 },
  contentStats: { flexDirection: 'row', gap: 16 },
  statText: { fontSize: 12, color: '#666' },
  analytics: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  rankRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  rankNumber: { width: 40, fontSize: 16, fontWeight: 'bold', color: '#ff6b00' },
  rankText: { flex: 1, fontSize: 14 },
  rankScore: { fontSize: 14, fontWeight: '600' },
  earnings: { padding: 16 },
  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
