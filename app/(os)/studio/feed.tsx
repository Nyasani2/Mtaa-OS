import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface FeedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string | null;
  creator_id: string;
  views_count: number;
  duration_seconds: number | null;
  created_at: string;
  creator?: { full_name: string | null; avatar_url: string | null };
}

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<FeedVideo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('studio_videos')
        .select('*, user_profiles(full_name, avatar_url)')
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setVideos(data || []);
    } catch (e) {
      console.error('Feed error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchVideos(); }, []);

  const formatDuration = (s: number | null) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const formatViews = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const renderItem = ({ item }: { item: FeedVideo }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => router.push(`/(os)/studio/video-player?videoId=${item.id}`)}
    >
      <View style={styles.thumbnailBox}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Feather name="film" size={32} color="#666" />
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration_seconds)}</Text>
        </View>
      </View>
      <View style={styles.infoRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.creator?.full_name?.charAt(0).toUpperCase() || 'U'}</Text>
        </View>
        <View style={styles.textInfo}>
          <Text style={styles.videoTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
          <Text style={styles.videoMeta}>
            {item.creator?.full_name || 'Creator'} • {formatViews(item.views_count || 0)} views
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Discover</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/studio/dashboard')}>
          <Feather name="tv" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={videos}
        keyExtractor={v => v.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVideos(); }} tintColor="#6366f1" />}
        contentContainerStyle={{ padding: 16 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '800' },
  videoCard: { marginBottom: 20 },
  thumbnailBox: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1f1f1f' },
  thumbnail: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  durationBadge: { position: 'absolute', bottom: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  infoRow: { flexDirection: 'row', marginTop: 10, gap: 10 },
  avatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  textInfo: { flex: 1 },
  videoTitle: { color: '#fff', fontSize: 14, fontWeight: '600', lineHeight: 20 },
  videoMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
});
