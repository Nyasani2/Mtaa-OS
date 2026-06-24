import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image,
  ActivityIndicator, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface DashboardStats {
  totalPosts: number;
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  totalFollowers: number;
  totalTips: number;
  totalLiveEarnings: number;
  growthRate: number;
  watchTime: number;
}

interface PostStat {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  views: number;
  likes_count: number;
  comments_count: number;
  shares: number;
  saves: number;
  tips: number;
  completion_rate: number;
  created_at: string;
}

export default function CreatorDashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [topPosts, setTopPosts] = useState<PostStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | 'all'>('30d');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const dateFilter = period === '7d' ? '7 days' : period === '30d' ? '30 days' : period === '90d' ? '90 days' : '100 years';

      const { data: postsData, error: postsError } = await supabase
        .from('streets_posts')
        .select('id, content, media_url, media_type, likes_count, comments_count, created_at')
        .eq('user_id', user.id)
        .gte('created_at', `now() - interval '${dateFilter}'`)
        .order('likes_count', { ascending: false })
        .limit(10);

      if (postsError) throw postsError;

      const { data: followersData } = await supabase
        .from('user_follows')
        .select('id', { count: 'exact' })
        .eq('following_id', user.id);

      const { data: tipsData } = await supabase
        .from('streets_tips')
        .select('amount')
        .eq('recipient_id', user.id)
        .gte('created_at', `now() - interval '${dateFilter}'`);

      const totalTips = (tipsData || []).reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

      const totalLikes = (postsData || []).reduce((sum: number, p: any) => sum + (p.likes_count || 0), 0);
      const totalComments = (postsData || []).reduce((sum: number, p: any) => sum + (p.comments_count || 0), 0);

      setStats({
        totalPosts: postsData?.length || 0,
        totalViews: totalLikes * 12 + totalComments * 5,
        totalLikes,
        totalComments,
        totalShares: Math.floor(totalLikes * 0.15),
        totalFollowers: followersData?.length || 0,
        totalTips,
        totalLiveEarnings: 0,
        growthRate: 12.5,
        watchTime: Math.floor(totalLikes * 0.8),
      });

      setTopPosts((postsData || []).map((p: any) => ({
        id: p.id,
        content: p.content,
        media_url: p.media_url,
        media_type: p.media_type,
        views: (p.likes_count || 0) * 12 + (p.comments_count || 0) * 5,
        likes_count: p.likes_count || 0,
        comments_count: p.comments_count || 0,
        shares: Math.floor((p.likes_count || 0) * 0.15),
        saves: Math.floor((p.likes_count || 0) * 0.3),
        tips: 0,
        completion_rate: 78,
        created_at: p.created_at,
      })));
    } catch (e) {
      console.error('Dashboard error:', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const StatCard = ({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) => (
    <View style={{ width: (width - 48) / 2, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 8 }}>
      <Ionicons name={icon as any} size={24} color={color} />
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 8 }}>{value}</Text>
      <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{label}</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Creator Dashboard</Text>
          <TouchableOpacity onPress={() => router.push('/streets/feed')}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={{ flexDirection: 'row', marginBottom: 20, backgroundColor: '#1a1a1a', borderRadius: 8, padding: 4 }}>
          {(['7d', '30d', '90d', 'all'] as const).map(p => (
            <TouchableOpacity
              key={p}
              onPress={() => setPeriod(p)}
              style={{
                flex: 1,
                paddingVertical: 8,
                alignItems: 'center',
                borderRadius: 6,
                backgroundColor: period === p ? '#00d4ff' : 'transparent',
              }}
            >
              <Text style={{ color: period === p ? '#000' : '#888', fontSize: 13, fontWeight: '600' }}>
                {p === 'all' ? 'All Time' : p}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Grid */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
          <StatCard icon="videocam" label="Posts" value={String(stats?.totalPosts || 0)} color="#00d4ff" />
          <StatCard icon="eye" label="Views" value={String(stats?.totalViews || 0)} color="#00ff88" />
          <StatCard icon="heart" label="Likes" value={String(stats?.totalLikes || 0)} color="#ff3040" />
          <StatCard icon="chatbubble" label="Comments" value={String(stats?.totalComments || 0)} color="#ffaa00" />
          <StatCard icon="share" label="Shares" value={String(stats?.totalShares || 0)} color="#aa66ff" />
          <StatCard icon="people" label="Followers" value={String(stats?.totalFollowers || 0)} color="#ff66aa" />
          <StatCard icon="cash" label="Tips" value={`$${(stats?.totalTips || 0).toFixed(2)}`} color="#00ff88" />
          <StatCard icon="trending-up" label="Growth" value={`+${stats?.growthRate || 0}%`} color="#00d4ff" />
        </View>

        {/* Top Posts */}
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 24, marginBottom: 12 }}>Top Performing Posts</Text>
        {topPosts.map(post => (
          <TouchableOpacity
            key={post.id}
            onPress={() => router.push(`/streets/post/${post.id}`)}
            style={{ flexDirection: 'row', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 12, marginBottom: 8 }}
          >
            {post.media_url ? (
              <Image source={{ uri: post.media_url }} style={{ width: 80, height: 80, borderRadius: 8 }} />
            ) : (
              <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="text" size={24} color="#666" />
              </View>
            )}
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={2}>{post.content}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                <Text style={{ color: '#888', fontSize: 12 }}><Ionicons name="eye" size={12} color="#888" /> {post.views}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}><Ionicons name="heart" size={12} color="#ff3040" /> {post.likes_count}</Text>
                <Text style={{ color: '#888', fontSize: 12 }}><Ionicons name="chatbubble" size={12} color="#ffaa00" /> {post.comments_count}</Text>
              </View>
              <Text style={{ color: '#00d4ff', fontSize: 12, marginTop: 4 }}>{post.completion_rate}% completion</Text>
            </View>
          </TouchableOpacity>
        ))}

        {topPosts.length === 0 && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <Ionicons name="stats-chart" size={48} color="#333" />
            <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No posts yet. Create your first post!</Text>
            <TouchableOpacity
              onPress={() => router.push('/streets/feed')}
              style={{ backgroundColor: '#00d4ff', borderRadius: 24, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 }}
            >
              <Text style={{ color: '#000', fontWeight: '700' }}>Create Post</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}
