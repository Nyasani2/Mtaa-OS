import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');

interface PostDetail {
  id: string;
  creator_id: string;
  content: string | null;
  caption: string | null;
  media_url: string | null;
  media_type: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  created_at: string;
  creator?: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    verified: boolean | null;
  };
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  user?: {
    user_id: string;
    full_name: string | null;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function PostDetailScreen() {
  const router = useRouter();
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const [post, setPost] = useState<PostDetail | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    if (!postId) return;
    loadPost();
  }, [postId]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('id, creator_id, content, caption, media_url, media_type, likes_count, comments_count, shares_count, views_count, created_at, creator:user_profiles(user_id, full_name, display_name, username, avatar_url, verified)')
        .eq('id', postId)
        .single();
      if (error) throw error;
      setPost(data);

      // Load comments
      const { data: cmts } = await supabase
        .from('streets_comments')
        .select('id, user_id, content, created_at, user:user_profiles(user_id, full_name, display_name, username, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });
      setComments(cmts || []);

      // Check if liked
      if (user?.id) {
        const { data: likeData } = await supabase
          .from('streets_likes')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .single();
        setIsLiked(!!likeData);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to like posts.');
      return;
    }
    try {
      if (isLiked) {
        await supabase.from('streets_likes').delete().eq('post_id', postId).eq('user_id', user.id);
        setIsLiked(false);
        setPost(prev => prev ? { ...prev, likes_count: Math.max(0, prev.likes_count - 1) } : prev);
      } else {
        await supabase.from('streets_likes').insert({ post_id: postId, user_id: user.id });
        setIsLiked(true);
        setPost(prev => prev ? { ...prev, likes_count: prev.likes_count + 1 } : prev);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleShare = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to share posts.');
      return;
    }
    await supabase.from('streets_shares').insert({ post_id: postId, user_id: user.id });
    Alert.alert('Shared', 'Post shared to your timeline.');
  };

  const handleSave = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to save posts.');
      return;
    }
    await supabase.from('streets_saves').insert({ post_id: postId, user_id: user.id });
    Alert.alert('Saved', 'Post saved to your collection.');
  };

  const goToCreator = (creatorId: string) => router.push(`/streets/creator?userId=${creatorId}`);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const creatorName = post.creator?.full_name || post.creator?.display_name || post.creator?.username || 'Unknown';
  const isOwnPost = user?.id === post.creator_id;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Post</Text>
        {isOwnPost && (
          <TouchableOpacity onPress={() => router.push(`/streets/create?editPostId=${post.id}`)}>
            <Ionicons name="create-outline" size={22} color="#00d4ff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Creator */}
      <TouchableOpacity style={styles.creatorRow} onPress={() => goToCreator(post.creator_id)}>
        {post.creator?.avatar_url ? (
          <Image source={{ uri: post.creator.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={18} color="#fff" />
          </View>
        )}
        <View style={styles.creatorInfo}>
          <Text style={styles.creatorName}>{creatorName}</Text>
          {post.creator?.verified && <Ionicons name="checkmark-circle" size={14} color="#00d4ff" />}
        </View>
      </TouchableOpacity>

      {/* Media */}
      {post.media_url && post.media_type !== 'text' && (
        <View style={styles.mediaContainer}>
          {post.media_type === 'video' ? (
            <View style={[styles.media, styles.videoPlaceholder]}>
              <Ionicons name="videocam" size={48} color="#00d4ff" />
              <Text style={styles.videoText}>Video</Text>
            </View>
          ) : (
            <Image source={{ uri: post.media_url }} style={styles.media} resizeMode="cover" />
          )}
        </View>
      )}

      {/* Content */}
      <View style={styles.contentSection}>
        <Text style={styles.content}>{post.content}</Text>
        {post.caption && <Text style={styles.caption}>{post.caption}</Text>}
      </View>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity onPress={handleLike} style={styles.actionBtn}>
          <Ionicons name={isLiked ? "heart" : "heart-outline"} size={26} color={isLiked ? "#ff4444" : "#fff"} />
          <Text style={styles.actionText}>{post.likes_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Ionicons name="chatbubble-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>{post.comments_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.actionBtn}>
          <Ionicons name="share-outline" size={24} color="#fff" />
          <Text style={styles.actionText}>{post.shares_count}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSave} style={styles.actionBtn}>
          <Ionicons name="bookmark-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Comments */}
      <View style={styles.commentsSection}>
        <Text style={styles.commentsTitle}>Comments</Text>
        {comments.length === 0 ? (
          <Text style={styles.noComments}>No comments yet</Text>
        ) : (
          comments.map(c => (
            <View key={c.id} style={styles.comment}>
              {c.user?.avatar_url ? (
                <Image source={{ uri: c.user.avatar_url }} style={styles.commentAvatar} />
              ) : (
                <View style={[styles.commentAvatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={12} color="#fff" />
                </View>
              )}
              <View style={styles.commentBody}>
                <Text style={styles.commentUser}>{c.user?.full_name || c.user?.display_name || c.user?.username || 'User'}</Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  creatorRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  creatorInfo: { flexDirection: 'row', alignItems: 'center' },
  creatorName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  mediaContainer: { width: '100%', backgroundColor: '#111' },
  media: { width: '100%', height: SCREEN_W * 0.75 },
  videoPlaceholder: { justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#fff', fontSize: 16, marginTop: 8 },
  contentSection: { padding: 16 },
  content: { color: '#fff', fontSize: 15, lineHeight: 22 },
  caption: { color: '#aaa', fontSize: 14, marginTop: 8 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, gap: 24, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  actionBtn: { alignItems: 'center' },
  actionText: { color: '#fff', fontSize: 11, marginTop: 2 },
  commentsSection: { padding: 16 },
  commentsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  noComments: { color: '#666', fontSize: 14 },
  comment: { flexDirection: 'row', marginBottom: 16 },
  commentAvatar: { width: 32, height: 32, borderRadius: 16, marginRight: 10 },
  commentBody: { flex: 1 },
  commentUser: { color: '#fff', fontSize: 13, fontWeight: '600' },
  commentText: { color: '#ccc', fontSize: 13, marginTop: 2, lineHeight: 18 },
  errorText: { color: '#ff4444', fontSize: 16 },
  backBtn: { marginTop: 16, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  backText: { color: '#00d4ff', fontWeight: '700' },
});
