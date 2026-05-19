import { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, Image, RefreshControl 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Post {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[];
  likes_count: number;
  comments_count: number;
  created_at: string;
  author_name: string;
  author_avatar: string;
  is_liked: boolean;
  is_saved: boolean;
}

export default function FeedScreen() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else if (page === 0) setLoading(true);

    const from = refresh ? 0 : page * 20;
    const to = from + 19;

    const { data, error } = await supabase
      .from('streets_posts')
      .select('*, author:profiles(full_name, avatar_url), likes:streets_likes(count), comments:streets_comments(count)')
      .order('created_at', { ascending: false })
      .range(from, to);

    if (refresh) setRefreshing(false);
    else setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    if (data) {
      const mapped = data.map((p: any) => ({
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        media_urls: p.media_urls || [],
        likes_count: p.likes?.[0]?.count || 0,
        comments_count: p.comments?.[0]?.count || 0,
        created_at: p.created_at,
        author_name: p.author?.full_name || 'Unknown',
        author_avatar: p.author?.avatar_url || '',
        is_liked: false,
        is_saved: false,
      }));

      if (refresh) setPosts(mapped);
      else setPosts(prev => [...prev, ...mapped]);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user?.id) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.is_liked) {
      await supabase.from('streets_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: false, likes_count: p.likes_count - 1 } : p));
    } else {
      await supabase.from('streets_likes').insert({ post_id: postId, user_id: user.id });
      setPosts(posts.map(p => p.id === postId ? { ...p, is_liked: true, likes_count: p.likes_count + 1 } : p));
    }
  };

  const handleSave = async (postId: string) => {
    if (!user?.id) return;
    
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.is_saved) {
      await supabase.from('street_saves').delete().eq('post_id', postId).eq('user_id', user.id);
      setPosts(posts.map(p => p.id === postId ? { ...p, is_saved: false } : p));
    } else {
      await supabase.from('street_saves').insert({ post_id: postId, user_id: user.id });
      setPosts(posts.map(p => p.id === postId ? { ...p, is_saved: true } : p));
    }
  };

  const renderItem = ({ item }: { item: Post }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        {item.author_avatar ? (
          <Image source={{ uri: item.author_avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
        )}
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{item.author_name}</Text>
          <Text style={styles.postTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>

      <Text style={styles.postContent}>{item.content}</Text>

      {item.media_urls.length > 0 && (
        <View style={styles.mediaGrid}>
          {item.media_urls.slice(0, 4).map((url, idx) => (
            <Image key={idx} source={{ uri: url }} style={styles.mediaItem} />
          ))}
        </View>
      )}

      <View style={styles.postActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
          <Text style={[styles.actionText, item.is_liked && styles.actionActive]}>
            {item.is_liked ? '❤️' : '🤍'} {item.likes_count}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => router.push({ pathname: '/(streets)/comments/[id]', params: { id: item.id } })}>
          <Text style={styles.actionText}>💬 {item.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleSave(item.id)}>
          <Text style={[styles.actionText, item.is_saved && styles.actionActive]}>
            {item.is_saved ? '🔖' : '📑'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => {
          // Share
        }}>
          <Text style={styles.actionText}>📤</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Streets</Text>
        <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/(streets)/create')}>
          <Text style={styles.createBtnText}>+</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={posts}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchPosts(true)} tintColor="#6366f1" />
          }
          onEndReached={() => {
            setPage(p => p + 1);
            fetchPosts();
          }}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No posts yet</Text>
              <Text style={styles.emptySub}>Be the first to post on Streets</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff' },
  createBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  list: { padding: 16, paddingBottom: 100 },
  postCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  avatarText: { fontSize: 18 },
  authorInfo: { flex: 1 },
  authorName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  postTime: { color: '#888', fontSize: 12, marginTop: 2 },
  postContent: { color: '#fff', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginBottom: 12 },
  mediaItem: { width: '48%', height: 150, borderRadius: 8 },
  postActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center' },
  actionText: { color: '#888', fontSize: 14 },
  actionActive: { color: '#ef4444' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
});
