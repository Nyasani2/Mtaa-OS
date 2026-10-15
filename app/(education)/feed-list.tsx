// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

export default function EducationFeedScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetchFeed();
  }, []);

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('education_posts')
        .select('*, author:user_profiles(full_name, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      setPosts(data || []);
      
      // Initialize liked state
      const initialLikes: Record<string, boolean> = {};
      data?.forEach((post: any) => {
        initialLikes[post.id] = post.is_liked || false;
      });
      setLikedPosts(initialLikes);
    } catch (err) {
      console.error('Failed to fetch feed:', err);
      // Fallback to empty state rather than crashing
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!user?.id) {
      Alert.alert('Login Required', 'Please log in to like posts.');
      return;
    }
    
    const isCurrentlyLiked = likedPosts[postId];
    // Optimistic update
    setLikedPosts(prev => ({ ...prev, [postId]: !isCurrentlyLiked }));
    
    try {
      // Call a Supabase RPC or update the table directly
      const { error } = await supabase.rpc('toggle_post_like', { 
        p_post_id: postId, 
        p_user_id: user.id 
      });
      
      if (error) {
        // Revert optimistic update on failure
        setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
        console.error('Like failed:', error);
      }
    } catch (err) {
      setLikedPosts(prev => ({ ...prev, [postId]: isCurrentlyLiked }));
    }
  };

  const handleComment = (post: any) => {
    router.push({ pathname: '/(education)/feed/[id]/comments', params: { id: post.id } } as any);
  };

  const handleShare = async (post: any) => {
    // In a real app, use expo-sharing or react-native-share
    Alert.alert('Share', `Sharing: ${post.title || 'Education Post'}`);
  };

  const renderPost = ({ item }: { item: any }) => (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.author?.full_name?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.authorName}>{item.author?.full_name || 'Unknown Author'}</Text>
          <Text style={styles.timestamp}>
            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recently'}
          </Text>
        </View>
      </View>

      <Text style={styles.postTitle}>{item.title || 'Untitled Post'}</Text>
      {item.content && <Text style={styles.postContent}>{item.content}</Text>}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id)}>
          <Ionicons 
            name={likedPosts[item.id] ? 'heart' : 'heart-outline'} 
            size={20} 
            color={likedPosts[item.id] ? '#ef4444' : '#64748b'} 
          />
          <Text style={[styles.actionText, likedPosts[item.id] && styles.likedText]}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => handleComment(item)}>
          <Ionicons name="chatbubble-outline" size={20} color="#64748b" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
          <Ionicons name="share-outline" size={20} color="#64748b" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#8b5cf6" />
        <Text style={styles.loadingText}>Loading feed...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Education Feed</Text>
        <TouchableOpacity onPress={() => router.push('/(education)/feed/create' as any)}>
          <Ionicons name="create-outline" size={24} color="#8b5cf6" />
        </TouchableOpacity>
      </View>

      {posts.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="school-outline" size={48} color="#64748b" />
          <Text style={styles.emptyText}>No posts yet</Text>
          <Text style={styles.emptySubtext}>Be the first to share an update!</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#94a3b8', marginTop: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#fff' },
  list: { padding: 16 },
  postCard: { backgroundColor: '#1e293b', borderRadius: 12, padding: 16, marginBottom: 16 },
  postHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#8b5cf6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  headerInfo: { flex: 1 },
  authorName: { color: '#fff', fontWeight: '600', fontSize: 15 },
  timestamp: { color: '#64748b', fontSize: 12, marginTop: 2 },
  postTitle: { color: '#fff', fontWeight: '700', fontSize: 16, marginBottom: 8 },
  postContent: { color: '#cbd5e1', fontSize: 14, lineHeight: 20, marginBottom: 12 },
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', marginRight: 24, gap: 6 },
  actionText: { color: '#64748b', fontSize: 14, fontWeight: '500' },
  likedText: { color: '#ef4444', fontWeight: '600' },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptySubtext: { color: '#64748b', fontSize: 14, marginTop: 4 },
});
