import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image, RefreshControl } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMStudios, useMVideos, useMLiveStreams, useMDashboard } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioDashboardScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { list: studios, loadAll: loadStudios, loading: studiosLoading } = useMStudios();
  const { list: videos, loadFeed: loadVideos, loading: videosLoading } = useMVideos();
  const { list: streams, loadAll: loadStreams, loading: streamsLoading } = useMLiveStreams();
  const { stats, load: loadStats, loading: statsLoading } = useMDashboard(studios[0]?.id);

  useEffect(() => {
    loadStudios(10);
    loadVideos({ limit: 10 });
    loadStreams('live');
  }, []);

  useEffect(() => {
    if (studios[0]?.id) loadStats();
  }, [studios[0]?.id]);

  const refreshing = studiosLoading || videosLoading || streamsLoading || statsLoading;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      {/* Header */}
      <View style={{ padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>MStudio</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Your creative dashboard</Text>
      </View>

      {/* Stats Row */}
      {stats && (
        <View style={{ flexDirection: 'row', padding: 12, gap: 8 }}>
          <StatCard label="Subscribers" value={stats.subscribers?.toLocaleString() || '0'} />
          <StatCard label="Views" value={stats.total_views?.toLocaleString() || '0'} />
          <StatCard label="Revenue" value={`KES ${stats.total_revenue?.toLocaleString() || '0'}`} />
          <StatCard label="Videos" value={stats.total_videos?.toString() || '0'} />
        </View>
      )}

      {/* Live Now */}
      <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Live Now</Text>
        {streams.length === 0 ? (
          <Text style={{ color: '#666', padding: 16, textAlign: 'center' }}>No active streams</Text>
        ) : (
          <FlatList
            horizontal
            data={streams}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/(os)/studio/live-active?id=${item.id}`)}
                style={{ width: 200, marginRight: 12, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}
              >
                <Image source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/200x112' }} style={{ width: 200, height: 112 }} />
                <View style={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#ff0000', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontWeight: 'bold' }}>LIVE</Text>
                </View>
                <View style={{ padding: 10 }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }} numberOfLines={1}>{item.title}</Text>
                  <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{item.current_viewers} viewers</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Recent Videos */}
      <View style={{ flex: 1, paddingHorizontal: 16, marginTop: 16 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 }}>Recent Videos</Text>
        <FlatList
          data={videos}
          keyExtractor={item => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { loadStudios(10); loadVideos({ limit: 10 }); loadStreams('live'); if (studios[0]?.id) loadStats(); }} tintColor="#fff" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/(os)/studio/video-player?id=${item.id}`)}
              style={{ flexDirection: 'row', marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}
            >
              <Image source={{ uri: item.thumbnail_url || 'https://via.placeholder.com/120x68' }} style={{ width: 120, height: 68 }} />
              <View style={{ flex: 1, padding: 10, justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }} numberOfLines={2}>{item.title}</Text>
                <Text style={{ color: '#888', fontSize: 11, marginTop: 4 }}>{item.view_count?.toLocaleString()} views • {item.processing_status}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No videos yet. Create your first video!</Text>}
        />
      </View>

      {/* FAB */}
      <TouchableOpacity
        onPress={() => router.push('/(os)/studio/recording')}
        style={{ position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: '#ff0000', alignItems: 'center', justifyContent: 'center', elevation: 8 }}
      >
        <Text style={{ color: '#fff', fontSize: 28 }}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 10, alignItems: 'center' }}>
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{value}</Text>
      <Text style={{ color: '#888', fontSize: 10, marginTop: 2 }}>{label}</Text>
    </View>
  );
}
