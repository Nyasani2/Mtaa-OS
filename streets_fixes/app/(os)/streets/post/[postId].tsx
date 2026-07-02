import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TextInput,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { streetsService } from '@/lib/services/streets-service';
import type { StreetsPost, StreetsComment } from '@/lib/types/streets';

const { width: SCREEN_W } = Dimensions.get('window');

function timeAgo(dateStr: string): string {
  const now = new Date();
  const then = new Date(dateStr);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
  return then.toLocaleDateString();
}

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [post, setPost] = useState<StreetsPost | null>(null);
  const [comments, setComments] = useState<StreetsComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);

  const isOwnPost = user?.id === post?.creator_id;

  const loadData = useCallback(async (showLoader: boolean = true) => {
    if (!postId) return;
    if (showLoader) setLoading(true);
    try {
      const [postData, commentsData] = await Promise.all([
        streetsService.getPostById(postId),
        streetsService.getComments(postId),
      ]);
      setPost(postData);
      setComments(commentsData);
      setLikesCount(postData?.likes_count || 0);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load post');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLike = useCallback(async () => {
    if (!user || !post) return;
    try {
      if (liked) {
        await streetsService.unlikePost(post.id);
        setLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
      } else {
        await streetsService.likePost(post.id);
        setLiked(true);
        setLikesCount(c => c + 1);
      }
    } catch (e) {
      // silent
    }
  }, [liked, post, user]);

  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !postId || !user) return;
    setSubmitting(true);
    try {
      const newComment = await streetsService.addComment(postId, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setPost(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [commentText, postId, user]);

  const handleDeletePost = useCallback(() => {
    if (!isOwnPost || !post) return;
    Alert.alert(
      'Delete Post',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await streetsService.deletePost(post.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  }, [isOwnPost, post, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff2d55" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Ionicons name="alert-circle-outline" size={48} color="#666" />
        <Text style={{ color: '#666', marginTop: 12, fontSize: 16 }}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 20 }}>
          <Text style={{ color: '#ff2d55', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hasMedia = !!post.media_url && post.media_type !== 'text';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: '#0a0a0a' }}
    >
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff2d55" />
        }
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 16,
          paddingTop: 50,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#1a1a1a',
        }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Ionicons name="arrow-back" size={26} color="#fff" />
          </TouchableOpacity>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: '600', flex: 1 }}>Post</Text>
          {isOwnPost && (
            <TouchableOpacity onPress={handleDeletePost}>
              <Ionicons name="trash-outline" size={22} color="#ff3b30" />
            </TouchableOpacity>
          )}
        </View>

        {/* Post Content */}
        <View style={{ padding: 16 }}>
          {/* Author */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: '#ff2d55',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>
                {post.creator_name?.[0]?.toUpperCase() || 'U'}
              </Text>
            </View>
            <View>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                {post.creator_name || 'Unknown'}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>{timeAgo(post.created_at)}</Text>
            </View>
          </View>

          {/* Text */}
          {post.content ? (
            <Text style={{ color: '#e0e0e0', fontSize: 16, lineHeight: 23, marginBottom: hasMedia ? 12 : 0 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Media */}
          {hasMedia && (
            <View style={{ marginBottom: 12 }}>
              <Image
                source={{ uri: post.media_url!, cache: 'force-cache' }}
                style={{
                  width: SCREEN_W - 32,
                  height: (SCREEN_W - 32) * 0.56,
                  borderRadius: 12,
                }}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Stats */}
          <View style={{ flexDirection: 'row', gap: 16, marginBottom: 12 }}>
            <Text style={{ color: '#888', fontSize: 13 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{likesCount}</Text> likes
            </Text>
            <Text style={{ color: '#888', fontSize: 13 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{post.comments_count || 0}</Text> comments
            </Text>
            <Text style={{ color: '#888', fontSize: 13 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{post.shares_count || 0}</Text> shares
            </Text>
          </View>

          {/* Actions */}
          <View style={{
            flexDirection: 'row',
            borderTopWidth: 1,
            borderBottomWidth: 1,
            borderColor: '#1a1a1a',
            paddingVertical: 10,
            gap: 24,
          }}>
            <TouchableOpacity onPress={handleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={22} color={liked ? '#ff2d55' : '#888'} />
              <Text style={{ color: liked ? '#ff2d55' : '#888', fontWeight: '500' }}>Like</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
              <Ionicons name="chatbubble-outline" size={20} color="#888" />
              <Text style={{ color: '#888', fontWeight: '500' }}>Comment</Text>
            </TouchableOpacity>
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
              <Ionicons name="share-outline" size={20} color="#888" />
              <Text style={{ color: '#888', fontWeight: '500' }}>Share</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Comments Section */}
        <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 12 }}>
            Comments ({comments.length})
          </Text>

          {comments.length === 0 ? (
            <View style={{ alignItems: 'center', paddingVertical: 30 }}>
              <Ionicons name="chatbubbles-outline" size={40} color="#333" />
              <Text style={{ color: '#555', marginTop: 8, fontSize: 14 }}>No comments yet. Be the first!</Text>
            </View>
          ) : (
            comments.map(comment => (
              <View key={comment.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                <View style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: '#333',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 10,
                }}>
                  <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                    {comment.user_name?.[0]?.toUpperCase() || 'U'}
                  </Text>
                </View>
                <View style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>
                      {comment.user_name || 'Unknown'}
                    </Text>
                    <Text style={{ color: '#555', fontSize: 11 }}>{timeAgo(comment.created_at)}</Text>
                  </View>
                  <Text style={{ color: '#ccc', fontSize: 14, lineHeight: 20 }}>{comment.content}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Comment Input */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderTopWidth: 1,
        borderTopColor: '#1a1a1a',
        backgroundColor: '#0a0a0a',
      }}>
        <View style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: '#ff2d55',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <TextInput
          style={{
            flex: 1,
            backgroundColor: '#1a1a1a',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 8,
            color: '#fff',
            fontSize: 14,
            maxHeight: 100,
          }}
          placeholder="Add a comment..."
          placeholderTextColor="#666"
          multiline
          value={commentText}
          onChangeText={setCommentText}
        />
        <TouchableOpacity
          onPress={handleSubmitComment}
          disabled={!commentText.trim() || submitting}
          style={{ marginLeft: 10, padding: 6 }}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#ff2d55" />
          ) : (
            <Ionicons
              name="send"
              size={22}
              color={commentText.trim() ? '#ff2d55' : '#333'}
            />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
