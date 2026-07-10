import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface TrendingItem {
  id: string;
  title: string;
  thumbnail_url: string;
  view_count: number;
  creator_name: string;
  trend_score: number;
  rank: number;
  type: 'video' | 'music' | 'livestream';
}

export default function TrendingScreen() {
  const router = useRouter();
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');

  const fetchTrending = async () => {
    setLoading(true);
    const now = new Date();
    let startDate = new Date();
    if (timeFilter === 'today') startDate.setHours(0, 0, 0, 0);
    else if (timeFilter === 'week') startDate.setDate(now.getDate() - 7);
    else startDate.setDate(now.getDate() - 30);

    const { data, error } = await supabase
      .from('studio_videos')
      .select('id, title, thumbnail_url, view_count, creator:creator_id (full_name), type, created_at')
      .gte('created_at', startDate.toISOString())
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .limit(50);

    if (!error) {
      const mapped = (data || []).map((v: any, idx: number) => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        view_count: v.view_count || 0,
        creator_name: v.creator?.full_name || 'Unknown',
        trend_score: Math.floor((v.view_count || 0) * (1 + Math.random())),
        rank: idx + 1,
        type: v.type || 'video',
      }));
      setItems(mapped);
    }
    setLoading(false);
  };

  useEffect(() => { fetchTrending(); }, [timeFilter]);

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count}`;
  };

  const getRankColor = (rank: number) => {
    if (rank === 1) return '#FFD700';
    if (rank === 2) return '#C0C0C0';
    if (rank === 3) return '#CD7F32';
    return '#666';
  };

  const renderItem = ({ item }: { item: TrendingItem }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/video-player?id=${item.id}`)}
      style={{ flexDirection: 'row', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' }}
    >
      <Text style={{ color: getRankColor(item.rank), fontSize: 18, fontWeight: 'bold', width: 32 }}>{item.rank}</Text>
      <View style={{ width: 120, height: 68, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a1a1a', marginRight: 12 }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="film" size={20} color="#444" />
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }} numberOfLines={2}>{item.title}</Text>
        <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{item.creator_name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
          <Feather name="eye" size={10} color="#666" />
          <Text style={{ color: '#666', fontSize: 11, marginLeft: 4 }}>{formatViews(item.view_count)} views</Text>
          <MaterialCommunityIcons name="fire" size={12} color="#ff6b6b" style={{ marginLeft: 8 }} />
          <Text style={{ color: '#ff6b6b', fontSize: 11, marginLeft: 2 }}>Trending</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Trending</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Time Filter */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginBottom: 8 }}>
        {(['today', 'week', 'month'] as const).map(f => (
          <TouchableOpacity
            key={f}
            onPress={() => setTimeFilter(f)}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: timeFilter === f ? '#ff0000' : '#1a1a1a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }}>{f}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={items}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrending().then(() => setRefreshing(false)); }} tintColor="#ff0000" />}
        renderItem={renderItem}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <MaterialCommunityIcons name="fire-off" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16 }}>No trending content yet</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
