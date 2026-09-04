import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Filter } from 'lucide-react-native';
import { useStudio } from '@/domains/studio/hooks/useStudio';
import VideoCard from '@/domains/studio/components/video-card';

const CATEGORIES = ['All', 'Music', 'Gaming', 'News', 'Education', 'Sports', 'Comedy', 'Technology', 'Live', 'Podcasts', 'Fashion', 'Animals'];

export default function FeedScreen() {
  const router = useRouter();
  const { videos, loading, fetchVideos } = useStudio();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    fetchVideos(activeCategory, search);
  }, [activeCategory, search]);

  const displayVideos = (videos || []).filter((v: any) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (v.title || '').toLowerCase().includes(s) || (v.creator_name || '').toLowerCase().includes(s);
  });

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <View style={styles.searchBox}>
          <Search size={16} color="#666" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search MStudio"
            placeholderTextColor="#666"
            value={search}
            onChangeText={setSearch}
          />
        </View>
        <Pressable>
          <Filter size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        {CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            style={[styles.chip, activeCategory === cat && styles.chipActive]}
            onPress={() => setActiveCategory(cat)}
          >
            <Text style={[styles.chipText, activeCategory === cat && styles.chipTextActive]}>{cat}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {displayVideos.map((v: any) => (
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
            />
          ))}
        </View>
        {displayVideos.length === 0 && !loading && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No videos found</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 12,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 24,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  searchInput: { flex: 1, color: '#fff', fontSize: 14 },
  chipScroll: { paddingHorizontal: 12, marginBottom: 8, maxHeight: 44 },
  chip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1a1a1a', marginHorizontal: 4, height: 32 },
  chipActive: { backgroundColor: '#fff' },
  chipText: { color: '#ccc', fontSize: 12, fontWeight: '600' },
  chipTextActive: { color: '#000' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', paddingHorizontal: 16 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 14 },
});
