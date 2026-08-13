// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, useColorScheme, Image, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface Post {
  id: string;
  content: string;
  media_url: string | null;
  media_type: string | null;
  thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function ProfilePosts() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('*')
        .eq('creator_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error('[ProfilePosts] Failed to fetch posts:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [user?.id]);

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}
      onPress={() => router.push(`/os/streets/post/${item.id}` as any)}
    >
      {item.media_url && item.media_type === 'image' && (
        <Image source={{ uri: item.media_url }} style={styles.mediaImage} resizeMode="cover" />
      )}
      {item.media_url && item.media_type === 'video' && (
        <View style={styles.videoThumbnail}>
          <Image source={{ uri: item.thumbnail_url || item.media_url }} style={styles.mediaImage} resizeMode="cover" />
          <View style={styles.playOverlay}>
            <Ionicons name="play-circle" size={40} color="#fff" />
          </View>
        </View>
      )}
      <Text style={[styles.content, { color: isDark ? '#fff' : '#1a1a2e' }]} numberOfLines={2}>
        {item.content}
      </Text>
      <View style={styles.meta}>
        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <View style={styles.stats}>
          <Ionicons name="heart-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, marginLeft: 4 }}>{item.likes_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8f9fa' }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#fff' : '#1a1a2e'} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? '#fff' : '#1a1a2e' }]}>My Posts</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No posts yet.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 18, fontWeight: '600' },
  list: { padding: 8 },
  row: { justifyContent: 'space-between', paddingHorizontal: 8 },
  postCard: {
    width: (width - 48) / 2,
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mediaImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    marginBottom: 8,
  },
  videoThumbnail: {
    position: 'relative',
  },
  playOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 8,
  },
  content: { fontSize: 12, lineHeight: 16, marginBottom: 8 },
  meta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
});
