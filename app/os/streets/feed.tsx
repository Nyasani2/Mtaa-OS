import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, useColorScheme } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { Ionicons } from '@expo/vector-icons';

interface Post {
  id: string;
  content: string;
  creator_id: string;
  created_at: string;
  likes: number;
  comments: number;
}

export default function StreetsFeed() {
  const router = useRouter();
  const theme = useColorScheme();
  const isDark = theme === 'dark';
  const { user } = useAuthStore();

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error('[StreetsFeed] Failed to fetch posts:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const renderPost = ({ item }: { item: Post }) => (
    <TouchableOpacity
      style={[styles.postCard, { backgroundColor: isDark ? '#1a1a2e' : '#fff' }]}
      onPress={() => router.push(`/os/streets/post/${item.id}`)}
    >
      <Text style={[styles.postContent, { color: isDark ? '#fff' : '#1a1a2e' }]} numberOfLines={3}>
        {item.content}
      </Text>
      <View style={styles.postMeta}>
        <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12 }}>
          {new Date(item.created_at).toLocaleDateString()}
        </Text>
        <View style={styles.stats}>
          <Ionicons name="heart-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, marginLeft: 4 }}>{item.likes || 0}</Text>
          <Ionicons name="chatbubble-outline" size={14} color={isDark ? '#9ca3af' : '#6b7280'} style={{ marginLeft: 12 }} />
          <Text style={{ color: isDark ? '#9ca3af' : '#6b7280', fontSize: 12, marginLeft: 4 }}>{item.comments || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: isDark ? '#0a0a0f' : '#f8f9fa' }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: isDark ? '#fff' : '#1a1a2e' }]}>Streets</Text>
        <TouchableOpacity onPress={() => router.push('/os/streets/create')} style={styles.createBtn}>
          <Ionicons name="add" size={24} color="#6366f1" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366f1" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>No posts yet. Be the first!</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: { fontSize: 24, fontWeight: '700' },
  createBtn: { padding: 8 },
  list: { padding: 16 },
  postCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postContent: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  stats: { flexDirection: 'row', alignItems: 'center' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
});
