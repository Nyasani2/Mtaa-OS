import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions, Modal,
  TextInput, ScrollView, Alert, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useStreetsFeed, useCreatePost, usePostActions } from '../hooks/useStreets';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const TABS = [
  { key: 'for-you', label: 'For You' },
  { key: 'following', label: 'Following' },
  { key: 'discover', label: 'Discover' },
];

// ── Feed Card ──────────────────────────────────────────────
function FeedCard({ post, onProfilePress }: { post: any; onProfilePress: (id: string) => void }) {
  const router = useRouter();
  const { liked, saved, toggleLike, toggleSave, handleShare, comments, commentsLoading, loadComments, submitComment, removeComment } = usePostActions(post.id);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const videoRef = useRef<Video>(null);

  const authorName = post.user?.display_name || 'Unknown';
  const avatarUrl = post.user?.avatar_url;

  return (
    <View style={{ width, height: height - 120 }}>
      {/* Media */}
      <View style={{ position: 'absolute', top: 0, left: 0, width, height: height - 120, backgroundColor: '#000' }}>
        {post.media_type === 'video' && post.media_url ? (
          <Video
            ref={videoRef}
            source={{ uri: post.media_url }}
            style={{ width, height: height - 120 }}
            resizeMode={ResizeMode.COVER}
            isLooping
            shouldPlay
            isMuted={false}
          />
        ) : post.media_type === 'image' && post.media_url ? (
          <Image source={{ uri: post.media_url }} style={{ width, height: height - 120, resizeMode: 'cover' }} />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 }}>
            <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>{post.content}</Text>
          </View>
        )}
      </View>

      {/* Right Actions */}
      <View style={{ position: 'absolute', right: 12, bottom: 100, alignItems: 'center', gap: 16 }}>
        <TouchableOpacity onPress={() => onProfilePress(post.user_id)} style={{ alignItems: 'center' }}>
          {avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={{ width: 48, height: 48, borderRadius: 24, borderWidth: 2, borderColor: '#fff' }} />
          ) : (
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={24} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleLike} style={{ alignItems: 'center' }}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={36} color={liked ? '#ff3040' : '#fff'} />
          <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>{post.likes_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => { setShowComments(true); loadComments(); }} style={{ alignItems: 'center' }}>
          <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
          <Text style={{ color: '#fff', fontSize: 12, marginTop: 2 }}>{post.comments_count}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={toggleSave} style={{ alignItems: 'center' }}>
          <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={32} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleShare} style={{ alignItems: 'center' }}>
          <Ionicons name="share-outline" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Bottom Info */}
      <View style={{ position: 'absolute', left: 16, right: 80, bottom: 80 }}>
        <TouchableOpacity onPress={() => onProfilePress(post.user_id)}>
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>@{authorName}</Text>
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 14, marginTop: 4, lineHeight: 20 }} numberOfLines={3}>{post.content}</Text>
      </View>

      {/* Comments Modal */}
      <Modal visible={showComments} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: height * 0.7, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Comments ({post.comments_count})</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={c => c.id}
                renderItem={({ item }) => (
                  <View style={{ flexDirection: 'row', marginBottom: 12, alignItems: 'flex-start' }}>
                    <TouchableOpacity onPress={() => onProfilePress(item.user_id)}>
                      {item.user?.avatar_url ? (
                        <Image source={{ uri: item.user.avatar_url }} style={{ width: 36, height: 36, borderRadius: 18 }} />
                      ) : (
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
                          <Ionicons name="person" size={18} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                    <View style={{ marginLeft: 12, flex: 1 }}>
                      <Text style={{ color: '#fff', fontWeight: '600' }}>{item.user?.display_name || 'Unknown'}</Text>
                      <Text style={{ color: '#ccc', fontSize: 14, marginTop: 2 }}>{item.content}</Text>
                    </View>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', paddingVertical: 20 }}>No comments yet</Text>}
              />
            )}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 }}>
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
    </View>
  );
}

// ── Create Modal ───────────────────────────────────────────
function CreateModal({ visible, onClose, onSubmit }: { visible: boolean; onClose: () => void; onSubmit: (content: string, mediaFile: any) => Promise<void> }) {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const pickFile = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*,video/*';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (file) {
          setMediaFile({ uri: URL.createObjectURL(file), type: file.type, name: file.name });
        }
      };
      input.click();
    } else {
      Alert.alert('Media', 'Use native image picker on mobile');
    }
  };

  const handleSubmit = async () => {
    if (!content.trim() && !mediaFile) return;
    setSubmitting(true);
    try {
      await onSubmit(content.trim(), mediaFile);
      setContent('');
      setMediaFile(null);
      onClose();
    } catch (e) {
      Alert.alert('Error', String(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
        <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>New Post</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What's happening?"
            placeholderTextColor="#666"
            multiline
            numberOfLines={4}
            style={{ color: '#fff', fontSize: 16, borderWidth: 1, borderColor: '#333', borderRadius: 8, padding: 12, minHeight: 100, textAlignVertical: 'top' }}
          />

          {mediaFile && (
            <View style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden' }}>
              {mediaFile.type?.startsWith('video') ? (
                <Video source={{ uri: mediaFile.uri }} style={{ width: '100%', height: 200 }} resizeMode={ResizeMode.COVER} useNativeControls />
              ) : (
                <Image source={{ uri: mediaFile.uri }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', marginTop: 16, gap: 12 }}>
            <TouchableOpacity onPress={pickFile} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="image-outline" size={24} color="#00d4ff" />
              <Text style={{ color: '#00d4ff' }}>Media</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || (!content.trim() && !mediaFile)}
            style={{
              backgroundColor: content.trim() || mediaFile ? '#00d4ff' : '#333',
              borderRadius: 24,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            {submitting ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>Post</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Main Feed Screen ───────────────────────────────────────
export default function FeedScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'for-you' | 'following' | 'discover'>('for-you');
  const [showCreate, setShowCreate] = useState(false);
  const { posts, loading, refreshing, hasMore, refresh, loadMore } = useStreetsFeed(activeTab);
  const { submit: createPostSubmit, creating } = useCreatePost();

  const handleProfilePress = useCallback((userId: string) => {
    router.push(`/profile/${userId}`);
  }, [router]);

  const handleCreate = useCallback(async (content: string, mediaFile: any) => {
    await createPostSubmit({ content, mediaFile, isPublic: true });
    refresh();
  }, [createPostSubmit, refresh]);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', paddingTop: 50, paddingBottom: 8, backgroundColor: 'rgba(0,0,0,0.5)', position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 }}>
        {TABS.map(tab => (
          <TouchableOpacity key={tab.key} onPress={() => setActiveTab(tab.key as any)} style={{ marginHorizontal: 12, paddingBottom: 4, borderBottomWidth: activeTab === tab.key ? 2 : 0, borderBottomColor: '#fff' }}>
            <Text style={{ color: activeTab === tab.key ? '#fff' : '#888', fontSize: 15, fontWeight: activeTab === tab.key ? '700' : '400' }}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Feed */}
      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={({ item }) => <FeedCard post={item} onProfilePress={handleProfilePress} />}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListFooterComponent={loading && hasMore ? <ActivityIndicator style={{ marginVertical: 20 }} color="#fff" /> : null}
        ListEmptyComponent={!loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', height: height - 200 }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No posts yet</Text>
          </View>
        ) : null}
      />

      {/* FAB Create */}
      <TouchableOpacity
        onPress={() => setShowCreate(true)}
        style={{
          position: 'absolute',
          right: 20,
          bottom: 100,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#00d4ff',
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <Ionicons name="add" size={32} color="#000" />
      </TouchableOpacity>

      {/* Create Modal */}
      <CreateModal visible={showCreate} onClose={() => setShowCreate(false)} onSubmit={handleCreate} />
    </View>
  );
}
