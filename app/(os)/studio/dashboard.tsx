import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface StudioVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  status: string;
  created_at: string;
  views_count: number;
  duration_seconds: number | null;
}

interface LiveStream {
  id: string;
  title: string;
  status: string;
  viewer_count: number;
  started_at: string;
}

export default function StudioDashboard() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [videos, setVideos] = useState<StudioVideo[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    if (!user?.id) return;
    try {
      const { data: vData } = await supabase
        .from('studio_videos')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setVideos(vData || []);

      const { data: lData } = await supabase
        .from('studio_live_streams')
        .select('*')
        .eq('creator_id', user.id)
        .in('status', ['live', 'scheduled'])
        .order('started_at', { ascending: false });
      setLiveStreams(lData || []);
    } catch (e) {
      console.error('Studio fetch error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchData(); }, [user?.id]);

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDuration = (s: number | null) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const renderVideoItem = ({ item }: { item: StudioVideo }) => (
    <TouchableOpacity 
      style={styles.videoCard}
      onPress={() => router.push(`/(os)/studio/editor?videoId=${item.id}`)}
    >
      <View style={styles.thumbnailBox}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Feather name="film" size={24} color="#666" />
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration_seconds)}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
        <Text style={styles.videoMeta}>{item.views_count || 0} views • {item.status}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLiveItem = ({ item }: { item: LiveStream }) => (
    <TouchableOpacity 
      style={styles.liveCard}
      onPress={() => router.push(`/(os)/studio/live-active?id=${item.id}`)}
    >
      <View style={styles.liveThumb}>
        <Feather name="radio" size={28} color="#ef4444" />
      </View>
      <View style={styles.liveInfo}>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBadgeText}>LIVE</Text>
        </View>
        <Text style={styles.liveTitle} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.liveMeta}>{item.viewer_count || 0} watching</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>MStudio</Text>
          <Text style={styles.subtitle}>Your creative dashboard</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/(os)/studio/analytics')}>
          <Feather name="bar-chart-2" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={[{ type: 'live' }, { type: 'videos' }]}
        keyExtractor={item => item.type}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />}
        renderItem={({ item }) => {
          if (item.type === 'live') {
            return (
              <View>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Live Now</Text>
                  <TouchableOpacity onPress={() => router.push('/(os)/studio/live-setup')}>
                    <Text style={styles.sectionAction}>Go Live</Text>
                  </TouchableOpacity>
                </View>
                {liveStreams.length === 0 ? (
                  <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>No active streams</Text>
                    <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/studio/live-setup')}>
                      <Text style={styles.emptyBtnText}>Start Streaming</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <FlatList
                    data={liveStreams}
                    keyExtractor={s => s.id}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    renderItem={renderLiveItem}
                    contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
                  />
                )}
              </View>
            );
          }
          return (
            <View>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recent Videos</Text>
                <TouchableOpacity onPress={() => router.push('/(os)/studio/drafts')}>
                  <Text style={styles.sectionAction}>Drafts</Text>
                </TouchableOpacity>
              </View>
              {videos.length === 0 ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.emptyText}>No videos yet. Create your first video!</Text>
                </View>
              ) : (
                <FlatList
                  data={videos}
                  keyExtractor={v => v.id}
                  numColumns={2}
                  columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
                  renderItem={renderVideoItem}
                />
              )}
            </View>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(os)/studio/camera')}>
        <Feather name="plus" size={28} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 16 },
  title: { color: '#fff', fontSize: 28, fontWeight: '800' },
  subtitle: { color: '#9ca3af', fontSize: 14, marginTop: 2 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1f1f1f', alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12 },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  sectionAction: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  emptyBox: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  emptyText: { color: '#666', fontSize: 14, textAlign: 'center' },
  emptyBtn: { marginTop: 12, backgroundColor: '#6366f1', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  videoCard: { flex: 1, marginBottom: 16, maxWidth: '50%' },
  thumbnailBox: { aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1f1f1f' },
  thumbnail: { width: '100%', height: '100%' },
  thumbnailPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  videoInfo: { marginTop: 8 },
  videoTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  videoMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  liveCard: { width: 200, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
  liveThumb: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2a0a0a', alignItems: 'center', justifyContent: 'center' },
  liveInfo: { flex: 1 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' },
  liveBadgeText: { color: '#ef4444', fontSize: 10, fontWeight: '800' },
  liveTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  liveMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
});
