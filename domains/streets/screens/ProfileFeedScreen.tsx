import React, { useState, useCallback } from 'react';
import {
  View, Text, Image, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, Dimensions, Modal,
  TextInput, Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { usePostActions } from '../hooks/useStreets';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const COL_WIDTH = width / 3 - 2;

interface ProfilePost {
  id: string;
  content: string;
  media_url: string | null;
  media_type: 'video' | 'image' | 'text' | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

export default function ProfileFeedScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [posts, setPosts] = useState<ProfilePost[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'images' | 'text'>('videos');
  const [selectedPost, setSelectedPost] = useState<ProfilePost | null>(null);

  const loadProfile = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('id, display_name, avatar_url, bio')
      .eq('id', id)
      .single();
    setProfile(data);
  }, [id]);

  const loadPosts = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('id, content, media_url, media_type, likes_count, comments_count, created_at')
        .eq('user_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setPosts(data || []);
    } catch (e) {
      console.error('Profile feed error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadProfile();
    loadPosts();
  }, [loadProfile, loadPosts]);

  useState(() => {
    loadProfile();
    loadPosts();
  });

  const filteredPosts = posts.filter(p => {
    if (activeTab === 'videos') return p.media_type === 'video';
    if (activeTab === 'images') return p.media_type === 'image';
    return p.media_type === 'text' || (!p.media_type && !p.media_url);
  });

  const renderGridItem = ({ item }: { item: ProfilePost }) => (
    <TouchableOpacity onPress={() => setSelectedPost(item)} style={{ width: COL_WIDTH, height: COL_WIDTH, margin: 1, backgroundColor: '#111' }}>
      {item.media_type === 'video' && item.media_url ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Ionicons name="play-circle" size={32} color="#fff" />
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
      {/* Header */}
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={{ width: 80, height: 80, borderRadius: 40 }} />
          ) : (
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={36} color="#fff" />
            </View>
          )}
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{profile?.display_name || 'Creator'}</Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }} numberOfLines={2}>{profile?.bio || ''}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222' }}>
        {(['videos', 'images', 'text'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: '#fff' }}
          >
            <Ionicons
              name={tab === 'videos' ? 'videocam' : tab === 'images' ? 'image' : 'text'}
              size={20}
              color={activeTab === tab ? '#fff' : '#666'}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Grid */}
      <FlatList
        data={filteredPosts}
        keyExtractor={p => p.id}
        renderItem={renderGridItem}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListEmptyComponent={!loading ? (
          <View style={{ paddingVertical: 60, alignItems: 'center' }}>
            <Text style={{ color: '#666', fontSize: 16 }}>No {activeTab} yet</Text>
          </View>
        ) : null}
      />

      {/* Post Detail Modal */}
      <Modal visible={!!selectedPost} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center' }}>
          {selectedPost && <PostDetailModal post={selectedPost} onClose={() => setSelectedPost(null)} profileId={id} />}
        </View>
      </Modal>
    </View>
  );
}

function PostDetailModal({ post, onClose, profileId }: { post: ProfilePost; onClose: () => void; profileId: string }) {
  const { liked, toggleLike, comments, commentsLoading, loadComments, submitComment, handleShare } = usePostActions(post.id);
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <TouchableOpacity onPress={onClose} style={{ position: 'absolute', top: 50, left: 16, zIndex: 10 }}>
        <Ionicons name="close" size={32} color="#fff" />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        {post.media_type === 'video' && post.media_url ? (
          <Video source={{ uri: post.media_url }} style={{ width, height: width * 1.2 }} resizeMode={ResizeMode.CONTAIN} useNativeControls shouldPlay />
        ) : post.media_type === 'image' && post.media_url ? (
          <Image source={{ uri: post.media_url }} style={{ width, height: width * 1.2 }} resizeMode="contain" />
        ) : (
          <View style={{ padding: 40 }}>
            <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>{post.content}</Text>
          </View>
        )}
      </View>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#222' }}>
        <Text style={{ color: '#fff', fontSize: 14 }}>{post.content}</Text>
        <View style={{ flexDirection: 'row', marginTop: 12, gap: 24 }}>
          <TouchableOpacity onPress={toggleLike} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={24} color={liked ? '#ff3040' : '#fff'} />
            <Text style={{ color: '#fff' }}>{post.likes_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowComments(true); loadComments(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="chatbubble-outline" size={24} color="#fff" />
            <Text style={{ color: '#fff' }}>{post.comments_count}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare}>
            <Ionicons name="share-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Bottom Sheet */}
      <Modal visible={showComments} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#1a1a1a', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: 400, padding: 16 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>Comments</Text>
              <TouchableOpacity onPress={() => setShowComments(false)}>
                <Ionicons name="close" size={28} color="#fff" />
              </TouchableOpacity>
            </View>
            {commentsLoading ? <ActivityIndicator color="#fff" /> : (
              <FlatList
                data={comments}
                keyExtractor={c => c.id}
                renderItem={({ item }) => (
                  <View style={{ marginBottom: 12 }}>
                    <Text style={{ color: '#fff', fontWeight: '600' }}>{item.user?.display_name || 'Unknown'}</Text>
                    <Text style={{ color: '#ccc', fontSize: 14 }}>{item.content}</Text>
                  </View>
                )}
                ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', paddingVertical: 20 }}>No comments</Text>}
              />
            )}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 }}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add comment..."
                placeholderTextColor="#666"
                style={{ flex: 1, color: '#fff', fontSize: 14 }}
              />
              <TouchableOpacity onPress={async () => { if (!commentText.trim()) return; await submitComment(commentText.trim()); setCommentText(''); }}>
                <Text style={{ color: '#00d4ff', fontWeight: '700' }}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
