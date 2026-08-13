// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { UserCheck } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { VideoCard } from '@/domains/studio/components/video-card';
import { supabase } from '@/lib/supabase';

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [subs, setSubs] = useState<string[]>([]);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      setLoading(true);
      try {
        const { data: rows } = await supabase
          .from('studio_subscriptions').select('creator_id').eq('user_id', user.id);
        const ids = (rows || []).map((r: any) => r.creator_id).filter(Boolean);
        setSubs(ids);
        if (ids.length > 0) {
          const { data, error } = await supabase
            .from('studio_videos_with_creator')
            .select('id, title, thumbnail_url, video_url, view_count, duration_seconds, created_at, creator_name, creator_avatar')
            .in('creator_id', ids)
            .eq('status', 'published')
            .order('created_at', { ascending: false }).limit(20);
          if (error) throw error;
          setVideos(data || []);
        }
      } catch (e: any) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [user?.id]);

  if (loading) return (
    <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
      <ActivityIndicator color="#dc143c" />
    </View>
  );

  if (subs.length === 0) return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 22 }}>←</Text>
        </Pressable>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={styles.empty}>
        <UserCheck size={40} color="#333" />
        <Text style={styles.emptyTitle}>No subscriptions yet</Text>
        <Text style={styles.emptySub}>Subscribe to creators to see their updates</Text>
        <Pressable onPress={() => router.push('/(os)/studio/feed' as any)} style={styles.discoverBtn}>
          <Text style={styles.discoverText}>Discover Creators</Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#fff', fontSize: 22 }}>←</Text>
        </Pressable>
        <Text style={styles.title}>Subscriptions</Text>
        <View style={{ width: 40 }} />
      </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { color: '#fff', fontSize: 18, fontWeight: '700' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginTop: 12 },
  emptySub: { color: '#666', fontSize: 13, marginTop: 4 },
  discoverBtn: { marginTop: 20, backgroundColor: '#dc143c', paddingHorizontal: 24,
    paddingVertical: 12, borderRadius: 24 },
  discoverText: { color: '#fff', fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingBottom: 40 },
});
