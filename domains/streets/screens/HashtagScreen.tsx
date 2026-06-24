import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface HashtagPost {
  id: string;
  user_id: string;
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

export default function HashtagScreen() {
  const router = useRouter();
  const { tag } = useLocalSearchParams<{ tag: string }>();
  const [posts, setPosts] = useState<HashtagPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [postCount, setPostCount] = useState(0);

  const loadPosts = useCallback(async () => {
    if (!tag) return;
    setLoading(true);
    try {
      const searchTag = `#${tag}`;
      const { data, error, count } = await supabase
        .from('streets_posts')
        .select(`
          id, user_id, content, media_url, media_type,
          likes_count, comments_count, created_at,
          user:user_profiles!user_id(display_name, avatar_url)
        `, { count: 'exact' })
        .ilike('content', `%${searchTag}%`)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setPosts((data || []).map((p: any) => ({ ...p, user: Array.isArray(p.user) ? p.user[0] : p.user })));
      setPostCount(count || 0);
    } catch (e) {
      console.error('Hashtag error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tag]);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadPosts();
  }, [loadPosts]);

  const renderItem = ({ item }: { item: HashtagPost }) => (
    <TouchableOpacity
      onPress={() => router.push(`/streets/post/${item.id}`)}
      style={{ width: width / 3 - 2, height: width / 3, margin: 1, backgroundColor: '#111' }}
    >
      {item.media_type === 'video' && item.media_url ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Ionicons name="play-circle" size={28} color="#fff" />
        </View>
      ) : item.media_type === 'image' && item.media_url ? (
        <Image source={{ uri: item.media_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center' }} numberOfLines={3}>{item.content}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 28, fontWeight: '700' }}>#{tag}</Text>
        <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>{postCount} posts</Text>
      </View>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={renderItem}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListEmptyComponent={!loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Ionicons name="search" size={48} color="#333" />
            <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No posts with #{tag} yet</Text>
          </View>
        ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
      />
    </View>
  );
}
