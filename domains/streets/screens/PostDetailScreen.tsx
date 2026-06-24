import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Modal, TextInput, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePost, usePostActions } from '../hooks/useStreets';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

export default function PostDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { post, loading } = usePost(id);
  const {
    liked, saved, toggleLike, toggleSave, comments, commentsLoading,
    loadComments, submitComment, removeComment, handleShare, handleDelete,
  } = usePostActions(id);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showOptions, setShowOptions] = useState(false);

  const authorName = post?.user?.display_name || 'Unknown';
  const avatarUrl = post?.user?.avatar_url;

  const onDelete = useCallback(async () => {
    Alert.alert('Delete Post', 'Are you sure? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await handleDelete();
            router.replace('/streets/feed');
          } catch (e) {
            Alert.alert('Error', String(e));
          }
        },
      },
    ]);
  }, [handleDelete, router]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  if (!post) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name="alert-circle" size={48} color="#666" />
        <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>Post not found</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#00d4ff' }}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={{ paddingTop: 50, paddingHorizontal: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={28} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowOptions(true)}>
            <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Author */}
        <TouchableOpacity
          onPress={() => router.push(`/profile/${post.user_id}`)}
          style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}
        >
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 44, height: 44, borderRadius: 22 }} />
          ) : (
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={22} color="#fff" />
            </View>
          )}
          <View style={{ marginLeft: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '700' }}>{authorName}</Text>
            <Text style={{ color: '#888', fontSize: 12 }}>{new Date(post.created_at).toLocaleDateString()}</Text>
          </View>
        </TouchableOpacity>

        {/* Media */}
        {post.media_type === 'video' && post.media_url ? (
          <Video
            source={{ uri: post.media_url }}
            style={{ width, height: width * 1.2 }}
            resizeMode={ResizeMode.CONTAIN}
            useNativeControls
            shouldPlay
            isLooping
          />
        ) : post.media_type === 'image' && post.media_url ? (
          <Image source={{ uri: post.media_url }} style={{ width, height: width * 1.2 }} resizeMode="contain" />
        ) : null}

        {/* Content */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 15, lineHeight: 22 }}>{post.content}</Text>
        </View>

        {/* Actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a', gap: 24 }}>
          <TouchableOpacity onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={26} color={liked ? '#ff3040' : '#fff'} />
            <Text style={{ color: '#fff', fontSize: 14 }}>{post.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowComments(true); loadComments(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={{ color: '#fff', fontSize: 14 }}>{post.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleSave}>
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={24} color={saved ? '#00d4ff' : '#fff'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.75, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Comments ({post.comments_count})</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <ScrollView style={{ maxHeight: height * 0.5 }}>
                {comments.map(comment => (
                  <View key={comment.id} style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
                    <TouchableOpacity onPress={() => router.push(`/profile/${comment.user_id}`)}>
                      {comment.user?.avatar_url ? (
                        <Image source={{ uri: comment.user.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="person" size={18} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{comment.user?.display_name || 'Unknown'}</Text>
                      <Text style={{ color: '#ccc', fontSize: 14, marginTop: 2 }}>{comment.content}</Text>
                    </View>
                  </View>
                ))}
                {comments.length === 0 && (
                  <Text style={{ color: '#666', textAlign: 'center', paddingVertical: 30 }}>No comments yet. Be the first!</Text>
                )}
              </ScrollView>
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12, marginTop: 8 }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="#666"
                style={{ flex: 1, color: '#fff', fontSize: 14, paddingVertical: 8 }}
              />
              <TouchableOpacity
                onPress={async () => {
                  if (!commentText.trim()) return;
                  await submitComment(commentText.trim());
                  setCommentText('');
                }}
                disabled={!commentText.trim()}
              >
                <Text style={{ color: commentText.trim() ? '#00d4ff' : '#666', fontWeight: '700', marginLeft: 12 }}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Options Modal */}
      <Modal visible={showOptions} animationType="fade" transparent>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowOptions(false)}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, width: width * 0.8, padding: 8 }}>
            <TouchableOpacity
              onPress={() => { setShowOptions(false); router.push(`/streets/report?postId=${post.id}`); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
            >
              <Ionicons name="flag" size={22} color="#ff3040" />
              <Text style={{ color: '#ff3040', fontSize: 16, marginLeft: 12 }}>Report Post</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setShowOptions(false); router.push(`/streets/report?userId=${post.user_id}`); }}
              style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}
            >
              <Ionicons name="person-remove" size={22} color="#ff3040" />
              <Text style={{ color: '#ff3040', fontSize: 16, marginLeft: 12 }}>Report User</Text>
            </TouchableOpacity>
            <View style={{ height: 1, backgroundColor: '#333', marginVertical: 4 }} />
            <TouchableOpacity onPress={onDelete} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
              <Ionicons name="trash" size={22} color="#ff3040" />
              <Text style={{ color: '#ff3040', fontSize: 16, marginLeft: 12 }}>Delete Post</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowOptions(false)} style={{ alignItems: 'center', paddingVertical: 14 }}>
              <Text style={{ color: '#888', fontSize: 16 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
