// domains/education/pages/feed.tsx
// Education feed page component
// Imported by: app/(education)/feed.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export interface EducationPost {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'announcement' | 'assignment' | 'resource' | 'discussion';
  school_id?: string;
  class_id?: string;
  attachments?: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  author?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function EducationFeedPage() {
  const user = useAuthStore((s) => s.user);
  const [posts, setPosts] = useState<EducationPost[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_posts')
        .select(`
          *,
          author:user_profiles(full_name, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts((data || []) as EducationPost[]);
    } catch (e: any) {
      console.error('[EducationFeed]', e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const renderPost = ({ item }: { item: EducationPost }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.author?.full_name?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <View style={styles.postMeta}>
          <Text style={styles.authorName}>{item.author?.full_name || 'Unknown'}</Text>
          <Text style={styles.postType}>{item.type}</Text>
        </View>
      </View>
      <Text style={styles.postTitle}>{item.title}</Text>
      <Text style={styles.postContent} numberOfLines={3}>{item.content}</Text>
      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="heart-outline" size={18} color="#6b7280" />
          <Text style={styles.actionText}>{item.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
          <Text style={styles.actionText}>{item.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="share-outline" size={18} color="#6b7280" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Education Feed</Text>
        <TouchableOpacity style={styles.filterBtn}>
          <Ionicons name="filter-outline" size={22} color="#0a0a0a" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="school-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No posts yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#0a0a0a' },
  filterBtn: { padding: 4 },
  list: { padding: 16 },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  postMeta: { flex: 1 },
  authorName: { fontSize: 15, fontWeight: '600', color: '#0a0a0a' },
  postType: { fontSize: 12, color: '#9ca3af', marginTop: 2, textTransform: 'capitalize' },
  postTitle: { fontSize: 16, fontWeight: '700', color: '#0a0a0a', marginBottom: 6 },
  postContent: { fontSize: 14, color: '#374151', lineHeight: 20 },
  postActions: { flexDirection: 'row', marginTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 20 },
  actionText: { fontSize: 13, color: '#6b7280', marginLeft: 4 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 16, color: '#6b7280', marginTop: 12 },
});
