import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

export default function FollowingFeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    loadFollowingFeed();
  }, [user?.id]);

  async function loadFollowingFeed() {
    setLoading(true);
    try {
      // Get list of users the current user follows
      const { data: follows } = await supabase
        .from('streets_follows')
        .select('following_id')
        .eq('follower_id', user!.id);

      const followingIds = follows?.map((f) => f.following_id) || [];
      if (followingIds.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get posts from followed users
      const { data } = await supabase
        .from('streets_posts')
        .select('*')
        .in('creator_id', followingIds)
        .order('created_at', { ascending: false })
        .limit(50);

      setPosts(data || []);
    } catch (err) {
      console.error('Following feed error:', err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 6 }}>
          <ChevronLeft size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', marginLeft: 12 }}>Following</Text>
      </View>
      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#e91e63" />
        </View>
      ) : posts.length === 0 ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#888', fontSize: 16 }}>No posts from people you follow</Text>
          <Text style={{ color: '#555', fontSize: 13, marginTop: 8 }}>Follow creators to see their content here</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => router.push(`/streets/post/${item.id}` as any)}
              style={{ marginBottom: 16, backgroundColor: '#111', borderRadius: 12, overflow: 'hidden' }}
            >
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt="" style={{ width: '100%', aspectRatio: '9/16', objectFit: 'cover' }} />
              ) : (
                <View style={{ width: '100%', aspectRatio: '9/16', backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
                  <Text style={{ color: '#666' }}>No preview</Text>
                </View>
              )}
              <View style={{ padding: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '600' }}>{item.caption || 'Untitled'}</Text>
                <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{item.likes_count} likes · {item.comments_count} comments</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}
