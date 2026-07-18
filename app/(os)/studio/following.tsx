import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, RefreshControl,
  ActivityIndicator, Dimensions
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
  published_at: string;
  is_live: boolean;
}

export default function FollowingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFollowingContent = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);

    // Get followed creators
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followingIds = follows?.map(f => f.following_id) || [];
    if (followingIds.length === 0) {
      setVideos([]);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('studio_videos_with_creator')
      .select('id, title, thumbnail_url, duration_seconds, view_count, creator_id, published_at, is_live, creator_name, creator_avatar')
      .in('creator_id', followingIds)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(40);

    if (!error) {
      setVideos((data || []).map((v: any) => ({
        id: v.id,
        title: v.title,
        thumbnail_url: v.thumbnail_url,
        duration_seconds: v.duration_seconds,
        view_count: v.view_count || 0,
        creator_id: v.creator_id,
        creator_name: v.creator?.full_name || 'Unknown',
        creator_avatar: v.creator?.avatar_url || '',
        published_at: v.published_at,
        is_live: v.is_live || false,
      })));
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => { fetchFollowingContent(); }, [fetchFollowingContent]);

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
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
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
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff0000" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Following</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={videos}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchFollowingContent().then(() => setRefreshing(false)); }} tintColor="#ff0000" />}
        renderItem={renderVideo}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Feather name="users" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16, fontSize: 16 }}>No content from people you follow</Text>
            <Text style={{ color: '#444', marginTop: 4, fontSize: 13 }}>Follow creators to see their content here</Text>
            <TouchableOpacity
              onPress={() => router.push('/(os)/studio/feed')}
              style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Discover Creators</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
