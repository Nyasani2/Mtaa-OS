import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface SavedPost {
  id: string;
  post_id: string;
  content: string;
  media_url: string | null;
  media_type: 'video' | 'image' | 'text' | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

export default function SavedPostsScreen() {
  const router = useRouter();
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSaved = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPosts([]); return; }

      const { data, error } = await supabase
        .from('streets_saves')
        .select(`
          id, post_id, created_at,
          post:streets_posts!streets_saves_post_id_fkey(
            id, content, media_url, media_type, likes_count, comments_count, created_at,
            user:user_profiles!streets_posts_user_id_fkey(display_name, avatar_url)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPosts((data || []).map((s: any) => ({
        id: s.id,
        post_id: s.post_id,
        content: s.post?.content || '',
        media_url: s.post?.media_url || null,
        media_type: s.post?.media_type || 'text',
        likes_count: s.post?.likes_count || 0,
        comments_count: s.post?.comments_count || 0,
        created_at: s.created_at,
        user: Array.isArray(s.post?.user) ? s.post.user[0] : s.post?.user,
      })));
    } catch (e) {
      console.error('Saved posts error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadSaved();
  }, [loadSaved]);

  const renderItem = ({ item }: { item: SavedPost }) => (
    <TouchableOpacity
      onPress={() => router.push(`/streets/post/${item.post_id}`)}
      style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a', alignItems: 'center' }}
    >
      {item.media_type === 'video' && item.media_url ? (
        <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="play-circle" size={28} color="#fff" />
        </View>
      ) : item.media_type === 'image' && item.media_url ? (
        <Image source={{ uri: item.media_url }} style={{ width: 80, height: 80, borderRadius: 8 }} />
      ) : (
        <View style={{ width: 80, height: 80, borderRadius: 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center', padding: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center' }} numberOfLines={3}>{item.content}</Text>
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={2}>{item.content}</Text>
        <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>By {item.user?.display_name || 'Unknown'}</Text>
        <View style={{ flexDirection: 'row', marginTop: 6, gap: 12 }}>
          <Text style={{ color: '#666', fontSize: 12 }}><Ionicons name="heart" size={10} color="#ff3040" /> {item.likes_count}</Text>
          <Text style={{ color: '#666', fontSize: 12 }}><Ionicons name="chatbubble" size={10} color="#ffaa00" /> {item.comments_count}</Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Saved Posts</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListEmptyComponent={!loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Ionicons name="bookmark" size={48} color="#333" />
            <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No saved posts yet</Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Save posts you love to find them here</Text>
          </View>
        ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
      />
    </View>
  );
}
