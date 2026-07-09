import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, RefreshControl,
  ActivityIndicator, TextInput, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const THUMB_WIDTH = width / 2 - 18;
const THUMB_HEIGHT = THUMB_WIDTH * 0.56;

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
  view_count: number;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  category: string;
  published_at: string;
  is_live: boolean;
}

const CATEGORIES = ['All', 'Music', 'Gaming', 'News', 'Education', 'Sports', 'Comedy', 'Tech', 'Afrobeat', 'Live'];

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchVideos = useCallback(async (isRefresh = false, category = selectedCategory) => {
    if (isRefresh) setRefreshing(true);
    else if (page === 0) setLoading(true);

    const pageNum = isRefresh ? 0 : page;
    const from = pageNum * 20;
    const to = from + 19;

    let query = supabase
      .from('mstudio_videos')
      .select('id, title, thumbnail_url, duration_seconds, view_count, creator_id, category, published_at, is_live, creator:creator_id (full_name, avatar_url)')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .range(from, to);

    if (category !== 'All') {
      query = query.eq('category', category.toLowerCase());
    }

    if (searchQuery.trim()) {
      query = query.ilike('title', `%${searchQuery.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Feed fetch error:', error);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    const mapped: Video[] = (data || []).map((v: any) => ({
      id: v.id,
      title: v.title,
      thumbnail_url: v.thumbnail_url,
      duration_seconds: v.duration_seconds,
      view_count: v.view_count || 0,
      creator_id: v.creator_id,
      creator_name: v.creator?.full_name || 'Unknown',
      creator_avatar: v.creator?.avatar_url || '',
      category: v.category,
      published_at: v.published_at,
      is_live: v.is_live || false,
    }));

    if (isRefresh) {
      setVideos(mapped);
      setPage(1);
    } else {
      setVideos(prev => pageNum === 0 ? mapped : [...prev, ...mapped]);
      setPage(pageNum + 1);
    }

    setHasMore((data || []).length === 20);
    setLoading(false);
    setRefreshing(false);
  }, [page, selectedCategory, searchQuery]);

  useEffect(() => {
    fetchVideos(true);
  }, []);

  useEffect(() => {
    fetchVideos(true);
  }, [selectedCategory]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const formatViews = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count}`;
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  };

  const renderVideo = ({ item }: { item: Video }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/video-player?id=${item.id}`)}
      style={{ width: THUMB_WIDTH, marginBottom: 16 }}
    >
      <View style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={{ width: THUMB_WIDTH, height: THUMB_HEIGHT }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="play-circle" size={32} color="#555" />
          </View>
        )}
        {!item.is_live && (
          <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{formatDuration(item.duration_seconds)}</Text>
          </View>
        )}
        {item.is_live && (
          <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: '#ff0000', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff', marginRight: 4 }} />
            <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
          </View>
        )}
      </View>

      <View style={{ flexDirection: 'row', marginTop: 8 }}>
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#333' }} />
        <View style={{ flex: 1, marginLeft: 8 }}>
          <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600', lineHeight: 18 }} numberOfLines={2}>{item.title}</Text>
          <Text style={{ color: '#888', fontSize: 11, marginTop: 2 }}>{item.creator_name}</Text>
          <Text style={{ color: '#666', fontSize: 11 }}>{formatViews(item.view_count)} views • {timeAgo(item.published_at)}</Text>
        </View>
        <TouchableOpacity style={{ padding: 4 }}>
          <Feather name="more-vertical" size={16} color="#888" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderHeader = () => (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, paddingTop: 48, backgroundColor: '#0a0a0a' }}>
        <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10 }}>
          <Feather name="search" size={18} color="#888" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => fetchVideos(true)}
            placeholder="Search MStudio"
            placeholderTextColor="#555"
            style={{ flex: 1, color: '#fff', fontSize: 14, marginLeft: 10 }}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchQuery(''); fetchVideos(true); }}>
              <Feather name="x" size={16} color="#888" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={{ marginLeft: 12, padding: 8 }} onPress={() => router.push('/(os)/studio/camera')}>
          <Feather name="video" size={22} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={{ marginLeft: 8, padding: 8 }} onPress={() => router.push('/(os)/profile')}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#333' }} />
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, paddingBottom: 8, backgroundColor: '#0a0a0a' }}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 6,
              borderRadius: 16,
              marginRight: 8,
              backgroundColor: selectedCategory === cat ? '#fff' : '#1a1a1a',
              borderWidth: 1,
              borderColor: selectedCategory === cat ? '#fff' : '#333',
            }}
          >
            <Text style={{ color: selectedCategory === cat ? '#000' : '#fff', fontSize: 12, fontWeight: '500' }}>{cat}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderFooter = () => {
    if (!hasMore) return null;
    return (
      <View style={{ padding: 20, alignItems: 'center' }}>
        <ActivityIndicator size="small" color="#ff0000" />
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 }}>
      <Feather name="film" size={48} color="#333" />
      <Text style={{ color: '#666', fontSize: 16, marginTop: 16 }}>No videos yet</Text>
      <Text style={{ color: '#444', fontSize: 13, marginTop: 4 }}>Be the first to create content</Text>
      <TouchableOpacity
        onPress={() => router.push('/(os)/studio/camera')}
        style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 10 }}
      >
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Create Video</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading && videos.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
        {renderHeader()}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ff0000" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchVideos(true)} tintColor="#ff0000" />}
        onEndReached={() => { if (hasMore && !loading) fetchVideos(); }}
        onEndReachedThreshold={0.5}
        renderItem={renderVideo}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
