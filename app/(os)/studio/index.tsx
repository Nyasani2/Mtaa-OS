import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, Pressable, Image,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Menu, Search, Bell, Upload } from 'lucide-react-native';
import { useStudio } from '@/domains/studio/hooks/useStudio';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import VideoCard from '@/domains/studio/components/video-card';

const CATEGORIES = ['All', 'Music', 'Gaming', 'News', 'Education', 'Sports', 'Comedy', 'Technology', 'Live', 'Podcasts', 'Fashion', 'Animals'];

export default function StudioHomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    videos, liveStreams, streetsPosts, loading, fetchVideos, fetchLive, fetchStreets,
  } = useStudio();

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [safeSearch, setSafeSearch] = useState('');

  useEffect(() => {
    fetchVideos(activeCategory);
    fetchLive();
    fetchStreets();
  }, [activeCategory]);

  useEffect(() => {
    const t = setTimeout(() => setSafeSearch(search || ''), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    fetchVideos(activeCategory, safeSearch);
  }, [safeSearch]);

  const filteredVideos = (videos || []).filter((v: any) => {
    if (!safeSearch) return true;
    const s = safeSearch.toLowerCase();
    return (
      (v.title || '').toLowerCase().includes(s) ||
      (v.creator_name || '').toLowerCase().includes(s)
    );
  });

  const hasContent = filteredVideos.length > 0 || streetsPosts.length > 0 || liveStreams.length > 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.push('/(os)/studio/feed' as any)}>
          <Menu size={24} color="#fff" />
        </Pressable>
        <Text style={styles.logo}>MStudio</Text>
        <View style={styles.headerRight}>
          <Pressable onPress={() => router.push('/(os)/studio/upload-center' as any)} style={{ marginRight: 16 }}>
            <Upload size={22} color="#fff" />
          </Pressable>
          <Pressable style={{ marginRight: 16 }}>
            <Bell size={22} color="#fff" />
          </Pressable>
          <Pressable onPress={() => router.push('/(os)/studio/creator-profile' as any)}>
            {user?.user_metadata?.avatar_url ? (
              <Image source={{ uri: user.user_metadata.avatar_url }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatar, styles.avatarFallback]}>
                <Text style={styles.avatarText}>{
                  (user?.user_metadata?.display_name || user?.email || '?').charAt(0).toUpperCase()
                }</Text>
              </View>
            )}
          </Pressable>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <Search size={16} color="#666" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search videos, creators, live streams..."
          placeholderTextColor="#666"
          value={search}
          onChangeText={setSearch}
        />
      </View>

      {/* Categories */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>
              {cat}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Live Streams */}
        {liveStreams.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Live Now</Text>
              <Pressable onPress={() => router.push('/(os)/studio/live' as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {liveStreams.map((s: any) => (
                <Pressable
                  key={s.id}
                  style={styles.liveCard}
                  onPress={() => router.push(`/(os)/studio/live-stream?id=${s.id}` as any)}
                >
                  <View style={styles.liveThumb}>
                    <Text style={styles.liveBadge}>● LIVE</Text>
                  </View>
                  <Text style={styles.liveTitle} numberOfLines={1}>{s.title}</Text>
                  <Text style={styles.liveMeta}>{s.creator_name || 'Unknown'} • {s.total_viewers || 0} watching</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* From Streets — COMPACT CARDS with video_url for frame thumbnails */}
        {streetsPosts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>From Streets</Text>
              <Pressable onPress={() => router.push('/(os)/streets' as any)}>
                <Text style={styles.seeAll}>See all</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {streetsPosts.map((p: any) => (
                <VideoCard
                  key={p.id}
                  id={p.id}
                  title={p.title || p.content || 'Post'}
                  thumbnail_url={p.thumbnail_url || p.image_url}
                  video_url={p.video_url || p.media_url}
                  creator_name={p.creator_name}
                  creator_avatar={p.creator_avatar}
                  view_count={p.view_count}
                  duration_seconds={p.duration_seconds}
                  created_at={p.created_at}
                  is_streets
                  size="compact"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Recommended — with video_url for frame thumbnails */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recommended</Text>
            <Pressable onPress={() => router.push('/(os)/studio/feed' as any)}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>

          {loading ? (
            <ActivityIndicator color="#ff0040" style={{ marginTop: 40 }} />
          ) : filteredVideos.length > 0 ? (
            <View style={styles.grid}>
              {filteredVideos.map((v: any) => (
                <VideoCard
                  key={v.id}
                  id={v.id}
                  title={v.title}
                  thumbnail_url={v.thumbnail_url}
                  video_url={v.video_url}
                  creator_name={v.creator_name}
                  creator_avatar={v.creator_avatar}
                  view_count={v.view_count}
                  duration_seconds={v.duration_seconds}
                  created_at={v.created_at}
                  size="medium"
                />
              ))}
            </View>
          ) : hasContent ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No videos in "{activeCategory}"</Text>
              <Text style={styles.emptySub}>Try a different category or search term</Text>
            </View>
          ) : (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No videos yet</Text>
              <Pressable
                style={styles.uploadBtn}
                onPress={() => router.push('/(os)/studio/upload-center' as any)}
              >
                <Text style={styles.uploadBtnText}>Upload First Video</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  logo: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  headerAvatar: { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    marginHorizontal: 16,
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  chipScroll: { paddingHorizontal: 12, marginBottom: 8, maxHeight: 44 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginHorizontal: 4,
    height: 32,
  },
  chipActive: { backgroundColor: '#fff' },
  chipText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  section: { paddingHorizontal: 16, marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  seeAll: { color: '#ff0040', fontSize: 12, fontWeight: '600' },
  liveCard: { width: 180, marginRight: 10 },
  liveThumb: {
    width: 180,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#ff0040',
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveTitle: { color: '#fff', fontSize: 13, fontWeight: '600', marginTop: 6 },
  liveMeta: { color: '#aaa', fontSize: 11, marginTop: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  empty: { alignItems: 'center', marginTop: 40 },
  emptyText: { color: '#888', fontSize: 14 },
  emptySub: { color: '#555', fontSize: 12, marginTop: 4 },
  uploadBtn: {
    backgroundColor: '#ff0040',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 12,
  },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
});
