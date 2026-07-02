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
import {
  getPost,
  getComments,
  addComment,
  deleteComment,
  likePost,
  unlikePost,
  checkLiked,
  deletePost,
  incrementView,
  StreetsError,
} from '@/lib/services/streets-service';
import type { StreetPost, StreetComment } from '@/lib/services/streets-service';

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

  const [post, setPost] = useState<StreetPost | null>(null);
  const [comments, setComments] = useState<StreetComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [imageError, setImageError] = useState(false);

  const isOwnPost = user?.id === post?.creator_id;

  // ─── LOAD DATA ─────────────────────────────────────
  const loadData = useCallback(async (showLoader: boolean = true) => {
    if (!postId) return;
    if (showLoader) setLoading(true);
    try {
      const [postData, commentsData, likedStatus] = await Promise.all([
        getPost(postId),
        getComments(postId),
        user ? checkLiked(postId) : Promise.resolve(false),
      ]);
      setPost(postData);
      setComments(commentsData);
      setLiked(likedStatus);
      setLikesCount(postData?.likes_count || 0);
      setImageError(false);

      // Increment view count
      if (postData) {
        incrementView(postId).catch(() => {});
      }
    } catch (e: any) {
      console.error('[PostDetail] loadData error:', e);
      if (showLoader) {
        Alert.alert('Error', e?.message || 'Failed to load post');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [postId, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData(false);
  }, [loadData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── LIKE ────────────────────────────────────────────
  const handleLike = useCallback(async () => {
    if (!user || !post) return;
    try {
      if (liked) {
        await unlikePost(post.id);
        setLiked(false);
        setLikesCount(c => Math.max(0, c - 1));
      } else {
        await likePost(post.id);
        setLiked(true);
        setLikesCount(c => c + 1);
      }
    } catch (e) {
      // silent
    }
  }, [liked, post, user]);

  // ─── COMMENT ───────────────────────────────────────
  const handleSubmitComment = useCallback(async () => {
    if (!commentText.trim() || !postId || !user) return;
    setSubmitting(true);
    try {
      const newComment = await addComment(postId, commentText.trim());
      setComments(prev => [...prev, newComment]);
      setCommentText('');
      setPost(prev => prev ? { ...prev, comments_count: (prev.comments_count || 0) + 1 } : prev);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to post comment');
    } finally {
      setSubmitting(false);
    }
  }, [commentText, postId, user]);

  // ─── DELETE POST ───────────────────────────────────
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
              await deletePost(post.id);
              router.back();
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete');
            }
          },
        },
      ]
    );
  }, [isOwnPost, post, router]);

  // ─── DELETE COMMENT ─────────────────────────────────
  const handleDeleteComment = useCallback((commentId: string, commentUserId: string) => {
    if (commentUserId !== user?.id) return;
    Alert.alert(
      'Delete Comment',
      'Remove this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(commentId);
              setComments(prev => prev.filter(c => c.id !== commentId));
              setPost(prev => prev ? { ...prev, comments_count: Math.max(0, (prev.comments_count || 0) - 1) } : prev);
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to delete comment');
            }
          },
        },
      ]
    );
  }, [user]);

  // ─── LOADING ───────────────────────────────────────
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#ff2d55" />
      </View>
    );
  }

  // ─── NOT FOUND ─────────────────────────────────────
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
  const creatorName = post.creator?.display_name || post.creator?.full_name || post.creator?.username || 'Unknown';
  const creatorInitial = creatorName[0].toUpperCase();

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
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
            onPress={() => router.push(`/(os)/streets/creator/${post.creator_id}`)}
          >
            {post.creator?.avatar_url ? (
              <Image source={{ uri: post.creator.avatar_url }} style={{ width: 44, height: 44, borderRadius: 22, marginRight: 12 }} />
            ) : (
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#ff2d55', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Text style={{ color: '#fff', fontWeight: '700', fontSize: 17 }}>{creatorInitial}</Text>
              </View>
            )}
            <View>
              <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                {creatorName}
                {post.creator?.verified && <Text style={{ color: '#3897f0' }}> ✓</Text>}
              </Text>
              <Text style={{ color: '#666', fontSize: 12 }}>{timeAgo(post.created_at || '')}</Text>
            </View>
          </TouchableOpacity>

          {/* Text */}
          {post.content ? (
            <Text style={{ color: '#e0e0e0', fontSize: 16, lineHeight: 23, marginBottom: hasMedia ? 12 : 0 }}>
              {post.content}
            </Text>
          ) : null}

          {/* Media */}
          {hasMedia && !imageError && (
            <View style={{ marginBottom: 12 }}>
              <Image
                source={{ uri: post.media_url!, cache: 'force-cache' }}
                style={{ width: SCREEN_W - 32, height: (SCREEN_W - 32) * 0.56, borderRadius: 12 }}
                resizeMode="cover"
                onError={() => setImageError(true)}
              />
            </View>
          )}
          {imageError && hasMedia && (
            <View style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center', marginBottom: 12 }}>
              <Ionicons name="image-outline" size={32} color="#666" />
              <Text style={{ color: '#666', marginTop: 8 }}>Media unavailable</Text>
            </View>
          )}

          {/* Hashtags */}
          {post.hashtags && post.hashtags.length > 0 && (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
              {post.hashtags.map((tag: string, i: number) => (
                <TouchableOpacity key={i} onPress={() => router.push(`/(os)/streets/hashtag/${encodeURIComponent(tag)}`)}>
                  <Text style={{ color: '#3897f0', fontSize: 14 }}>#{tag}</Text>
                </TouchableOpacity>
              ))}
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
            <Text style={{ color: '#888', fontSize: 13 }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>{post.views_count || post.view_count || 0}</Text> views
            </Text>
          </View>

          {/* Actions */}
          <View style={{ flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1a1a1a', paddingVertical: 10, gap: 24 }}>
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
            <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'center' }}>
              <Ionicons name="bookmark-outline" size={20} color="#888" />
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
            comments.map(comment => {
              const commentInitial = (comment.user_name || 'U')[0].toUpperCase();
              const isOwnComment = user?.id === comment.user_id;
              return (
                <View key={comment.id} style={{ flexDirection: 'row', marginBottom: 16 }}>
                  {comment.user_avatar ? (
                    <Image source={{ uri: comment.user_avatar }} style={{ width: 36, height: 36, borderRadius: 18, marginRight: 10 }} />
                  ) : (
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{commentInitial}</Text>
                    </View>
                  )}
                  <View style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 10 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <Text style={{ color: '#fff', fontWeight: '600', fontSize: 14 }}>{comment.user_name || 'Unknown'}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <Text style={{ color: '#555', fontSize: 11 }}>{timeAgo(comment.created_at || '')}</Text>
                        {isOwnComment && (
                          <TouchableOpacity onPress={() => handleDeleteComment(comment.id, comment.user_id || '')}>
                            <Ionicons name="trash-outline" size={14} color="#ff3b30" />
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                    <Text style={{ color: '#ccc', fontSize: 14, lineHeight: 20 }}>{comment.content}</Text>
                  </View>
                </View>
              );
            })
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
        <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#ff2d55', alignItems: 'center', justifyContent: 'center', marginRight: 10 }}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>
            {user?.display_name?.[0]?.toUpperCase() || 'U'}
          </Text>
        </View>
        <TextInput
          style={{
            flex: 1, backgroundColor: '#1a1a1a', borderRadius: 20,
            paddingHorizontal: 14, paddingVertical: 8,
            color: '#fff', fontSize: 14, maxHeight: 100,
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
            <Ionicons name="send" size={22} color={commentText.trim() ? '#ff2d55' : '#333'} />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
