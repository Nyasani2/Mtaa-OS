// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Flame } from 'lucide-react-native';
import { VideoCard } from '@/domains/studio/components/video-card';
import { supabase } from '@/lib/supabase';

export default function TrendingScreen() {
  const router = useRouter();
  const [period, setPeriod] = useState<'Today'|'Week'|'Month'>('Today');
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTrending(); }, [period]);

  async function fetchTrending() {
    setLoading(true);
    try {
      const now = new Date();
      const fromDate = new Date();
      if (period === 'Today') fromDate.setDate(now.getDate() - 1);
      else if (period === 'Week') fromDate.setDate(now.getDate() - 7);
      else fromDate.setDate(now.getDate() - 30);

      const { data, error } = await supabase
        .from('studio_videos_with_creator')
        .select('id, title, thumbnail_url, video_url, view_count, duration_seconds, created_at, creator_name, creator_avatar')
        .eq('status', 'published')
        .gte('created_at', fromDate.toISOString())
        .order('view_count', { ascending: false })
        .limit(20);
      if (error) throw error;

      setVideos(data || []);
    } catch (e: any) { console.error(e); }
    finally { setLoading(false); }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 22 }}>←</Text>
        </Pressable>
        <Text style={styles.title}>Trending</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.filterRow}>
        {(['Today','Week','Month'] as const).map((p: any) => (
          <Pressable key={p} onPress={() => setPeriod(p)}
            style={[styles.filterBtn, period === p && styles.filterActive]}>
            <Text style={[styles.filterText, period === p && styles.filterTextActive]}>{p}</Text>
          </Pressable>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#dc143c" />
      ) : videos.length === 0 ? (
        <View style={styles.empty}>
          <Flame size={40} color="#333" />
          <Text style={styles.emptyText}>No trending content yet</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          {videos.map((v: any) => (
            <VideoCard key={v.id} id={v.id} title={v.title}
              thumbnail_url={v.thumbnail_url} video_url={v.video_url}
              creator_name={v.creator_name || 'Unknown'}
              creator_avatar={v.creator_avatar}
              view_count={v.view_count}
              duration_seconds={v.duration_seconds}
              created_at={v.created_at} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 12 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#1a1a1a', borderRadius: 20 },
  filterActive: { backgroundColor: '#dc143c' },
  filterText: { color: '#aaa', fontSize: 13 },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: '#555', marginTop: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 40 },
});
