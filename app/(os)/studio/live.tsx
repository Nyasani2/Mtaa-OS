import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface LiveStream {
  id: string;
  title: string;
  thumbnail_url: string;
  creator_name: string;
  creator_avatar: string;
  current_viewers: number;
  category: string;
  started_at: string;
}

export default function LiveScreen() {
  const router = useRouter();
  const [streams, setStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('All');

  const CATEGORIES = ['All', 'Music', 'Gaming', 'Education', 'News', 'Sports', 'Comedy', 'Tech', 'Church', 'Radio', 'TV'];

  const fetchLive = async () => {
    setLoading(true);
    let query = supabase
      .from('mstudio_live_streams')
      .select('id, title, thumbnail_url, current_viewers, category, started_at, creator:creator_id (full_name, avatar_url)')
      .eq('is_live', true)
      .order('current_viewers', { ascending: false });

    if (categoryFilter !== 'All') {
      query = query.eq('category', categoryFilter.toLowerCase());
    }

    const { data, error } = await query.limit(50);

    if (!error) {
      setStreams((data || []).map((s: any) => ({
        id: s.id,
        title: s.title,
        thumbnail_url: s.thumbnail_url,
        creator_name: s.creator?.full_name || 'Unknown',
        creator_avatar: s.creator?.avatar_url || '',
        current_viewers: s.current_viewers || 0,
        category: s.category,
        started_at: s.started_at,
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchLive(); }, [categoryFilter]);

  const formatViewers = (count: number) => {
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count}`;
  };

  const timeSince = (date: string) => {
    const mins = Math.floor((Date.now() - new Date(date).getTime()) / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    return `${hours}h`;
  };

  const renderStream = ({ item }: { item: LiveStream }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/live-active?id=${item.id}`)}
      style={{ marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a' }}
    >
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: '#222' }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="video" size={32} color="#444" />
          </View>
        )}
        {/* Live Badge */}
        <View style={{ position: 'absolute', top: 10, left: 10, backgroundColor: '#ff0000', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 6 }} />
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 11 }}>LIVE</Text>
        </View>
        {/* Viewer Count */}
        <View style={{ position: 'absolute', bottom: 10, left: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center' }}>
          <Feather name="eye" size={12} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 11, marginLeft: 4 }}>{formatViewers(item.current_viewers)} watching</Text>
        </View>
        {/* Duration */}
        <View style={{ position: 'absolute', bottom: 10, right: 10, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4 }}>
          <Text style={{ color: '#fff', fontSize: 11 }}>{timeSince(item.started_at)}</Text>
        </View>
      </View>
      <View style={{ padding: 12, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#333' }} />
        <View style={{ marginLeft: 10, flex: 1 }}>
          <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }} numberOfLines={1}>{item.title}</Text>
          <Text style={{ color: '#888', fontSize: 12 }}>{item.creator_name} • {item.category}</Text>
        </View>
        <TouchableOpacity style={{ padding: 8 }}>
          <Feather name="bell" size={18} color="#888" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Live</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ff0000', marginRight: 4 }} />
            <Text style={{ color: '#ff6b6b', fontSize: 11 }}>{streams.length} active now</Text>
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      {/* Category Filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        {CATEGORIES.map(c => (
          <TouchableOpacity
            key={c}
            onPress={() => setCategoryFilter(c)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: categoryFilter === c ? '#ff0000' : '#1a1a1a',
            }}
          >
            <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500' }}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={streams}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchLive().then(() => setRefreshing(false)); }} tintColor="#ff0000" />}
        renderItem={renderStream}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <MaterialCommunityIcons name="broadcast-off" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16 }}>No live streams right now</Text>
            <TouchableOpacity
              onPress={() => router.push('/(os)/studio/live-setup')}
              style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Start Streaming</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
