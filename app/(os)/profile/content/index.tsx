import React, { useState, useEffect } from 'react';
import { View, Text, Image, FlatList, TouchableOpacity, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '@/lib/supabase/client';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { ChevronLeft, Play } from 'lucide-react-native';

const { width: W } = Dimensions.get('window');
const COLS = 3;
const GAP = 2;
const ITEM_W = (W - (COLS + 1) * GAP) / COLS;

type ContentItem = {
  id: string;
  table: string;
  thumbnail_url?: string;
  media_url?: string;
  video_url?: string;
  title?: string;
  caption?: string;
  created_at?: string;
};

export default function ProfileContentScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) loadContent();
  }, [user?.id]);

  async function loadContent() {
    setLoading(true);
    const userId = user!.id;
    const all: ContentItem[] = [];

    // ── Streets posts ──
    try {
      const { data: streets } = await supabase
        .from('streets_posts')
        .select('id,thumbnail_url,media_url,title,caption,created_at')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });
      if (streets) {
        streets.forEach((p: any) => all.push({ ...p, table: 'streets_posts' }));
      }
    } catch (e) { console.log('streets query error', e); }

    // ── MStudio videos ──
    try {
      const { data: videos } = await supabase
        .from('mstudio_videos')
        .select('id,thumbnail_url,media_url,video_url,title,caption,created_at')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });
      if (videos) {
        videos.forEach((v: any) => all.push({ ...v, table: 'mstudio_videos' }));
      }
    } catch (e) { console.log('mstudio query error', e); }

    // Sort combined by date desc
    all.sort((a, b) => {
      const ta = new Date(a.created_at || 0).getTime();
      const tb = new Date(b.created_at || 0).getTime();
      return tb - ta;
    });

    setItems(all);
    setLoading(false);
  }

  function renderItem({ item }: { item: ContentItem }) {
    const thumb = item.thumbnail_url || item.media_url;
    const isVideo = !!item.video_url || (item.media_url?.match(/\.(mp4|mov|avi)$/i));

    return (
      <TouchableOpacity
        style={[styles.gridItem, { width: ITEM_W, height: ITEM_W }]}
        onPress={() => router.push(`/profile/content/${item.id}?table=${item.table}` as any)}
      >
        {thumb ? (
          <Image source={{ uri: thumb }} style={styles.thumb} resizeMode="cover" />
        ) : (
          <View style={[styles.thumb, styles.emptyThumb]}>
            <Text style={styles.emptyLabel}>No image</Text>
          </View>
        )}
        {isVideo && (
          <View style={styles.badge}>
            <Play size={14} color="#fff" fill="#fff" />
          </View>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Content</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#fff" />
        </View>
      ) : (
        <FlatList
          data={items}
          numColumns={COLS}
          keyExtractor={(item) => `${item.table}-${item.id}`}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>No posts yet</Text>
              <Text style={styles.emptySub}>Your Streets posts and MStudio videos will appear here</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: '#222',
  },
  backBtn: { padding: 6 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  list: { padding: GAP },
  gridItem: { margin: GAP, backgroundColor: '#111' },
  thumb: { width: '100%', height: '100%' },
  emptyThumb: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1a1a1a' },
  emptyLabel: { color: '#666', fontSize: 12 },
  badge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 3,
  },
  emptyTitle: { color: '#888', fontSize: 16, fontWeight: '600' },
  emptySub: { color: '#555', fontSize: 13, marginTop: 8, textAlign: 'center' },
});
