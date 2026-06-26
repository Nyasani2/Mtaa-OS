import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Dimensions, Platform, RefreshControl, Alert, ActivityIndicator, Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_COLS = 3;
const CELL_SIZE = SCREEN_W / GRID_COLS;

type FilterType = 'all' | 'images' | 'videos';

interface UserProfile {
  user_id: string;
  full_name: string | null;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  verified: boolean | null;
  bio: string | null;
}

interface UserPost {
  id: string;
  media_url: string | null;
  media_type: string;
  content: string | null;
  caption: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  thumbnail_url: string | null;
  video_thumbnail_url: string | null;
}

function getPosterUrl(post: UserPost): string | null {
  if (post.media_type === 'video') {
    return post.video_thumbnail_url || post.thumbnail_url || null;
  }
  if (post.media_type === 'image') {
    return post.media_url || post.thumbnail_url || null;
  }
  return null;
}

export default function CreatorScreen() {
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId?: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const targetUserId = userId || user?.id;
  const isOwnProfile = user?.id === targetUserId;
  const isGuest = !isAuthenticated || !user;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allPosts, setAllPosts] = useState<UserPost[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<UserPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [hoveredPostId, setHoveredPostId] = useState<string | null>(null);
  const [deleteModalPost, setDeleteModalPost] = useState<UserPost | null>(null);
  const [previewPost, setPreviewPost] = useState<UserPost | null>(null);
  const videoRefs = useRef<Record<string, HTMLVideoElement>>({});

  const fetchProfile = useCallback(async () => {
    if (!targetUserId) { setError('No user specified'); setLoading(false); return; }
    setError(null);
    try {
      const { data, error: profErr } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, display_name, username, avatar_url, verified, bio')
        .eq('user_id', targetUserId)
        .single();
      if (profErr) throw profErr;
      setProfile(data);

      const { data: postsData, error: postsErr } = await supabase
        .from('streets_posts')
        .select('id, media_url, media_type, content, caption, likes_count, comments_count, created_at, thumbnail_url, video_thumbnail_url')
        .eq('creator_id', targetUserId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });
      if (postsErr) throw postsErr;
      setAllPosts(postsData || []);
      setFilteredPosts(postsData || []);

      const { count: fwc } = await supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('following_id', targetUserId);
      const { count: fgc } = await supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('follower_id', targetUserId);
      setFollowers(fwc || 0);
      setFollowing(fgc || 0);

      if (!isGuest && !isOwnProfile && user) {
        const { data: fw } = await supabase.from('streets_follows').select('id').eq('follower_id', user.id).eq('following_id', targetUserId).single();
        setIsFollowingUser(!!fw);
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetUserId, user?.id, isGuest, isOwnProfile]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  useEffect(() => {
    if (activeFilter === 'all') {
      setFilteredPosts(allPosts);
    } else if (activeFilter === 'images') {
      setFilteredPosts(allPosts.filter(p => p.media_type === 'image'));
    } else if (activeFilter === 'videos') {
      setFilteredPosts(allPosts.filter(p => p.media_type === 'video'));
    }
  }, [activeFilter, allPosts]);

  const handleFollow = async () => {
    if (isGuest) { Alert.alert('Sign In Required', 'Please sign in to follow users.'); return; }
    if (!user || isOwnProfile) return;
    try {
      if (isFollowingUser) {
        await supabase.from('streets_follows').delete().eq('follower_id', user.id).eq('following_id', targetUserId);
        setIsFollowingUser(false);
        setFollowers(prev => Math.max(0, prev - 1));
      } else {
        await supabase.from('streets_follows').insert({ follower_id: user.id, following_id: targetUserId });
        setIsFollowingUser(true);
        setFollowers(prev => prev + 1);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  };

  const handleDeletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
      if (error) { Alert.alert('Error', error.message); return; }
      setAllPosts(prev => prev.filter(p => p.id !== postId));
      setDeleteModalPost(null);
      Alert.alert('Deleted', 'Post removed successfully.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to delete post');
    }
  };

  const handleEditPost = (postId: string) => {
    router.push(`/streets/create?editPostId=${postId}`);
  };

  const renderPost = ({ item }: { item: UserPost }) => {
    const isHovered = hoveredPostId === item.id;
    const isVideo = item.media_type === 'video';
    const isText = item.media_type === 'text' || (!item.media_url && !item.content);
    const posterUrl = getPosterUrl(item);

    return (
      <View style={styles.gridCellWrapper}>
        <TouchableOpacity
          style={styles.gridCell}
          activeOpacity={0.9}
          onPress={() => setPreviewPost(item)}
          onLongPress={() => {
            if (isOwnProfile) {
              Alert.alert('Manage Post', item.content?.substring(0, 30) || 'Post', [
                { text: 'Edit', onPress: () => handleEditPost(item.id) },
                { text: 'Delete', style: 'destructive', onPress: () => setDeleteModalPost(item) },
                { text: 'Cancel', style: 'cancel' },
              ]);
            }
          }}
          onMouseEnter={() => {
            setHoveredPostId(item.id);
            if (isVideo && videoRefs.current[item.id]) {
              videoRefs.current[item.id].play().catch(() => {});
            }
          }}
          onMouseLeave={() => {
            setHoveredPostId(null);
            if (isVideo && videoRefs.current[item.id]) {
              videoRefs.current[item.id].pause();
              videoRefs.current[item.id].currentTime = 0;
            }
          }}
        >
          {isVideo ? (
            isHovered && item.media_url ? (
              <video
                ref={ref => { if (ref) videoRefs.current[item.id] = ref; }}
                src={item.media_url}
                style={styles.gridVideo}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                poster={posterUrl || undefined}
              />
            ) : (
              <View style={styles.posterContainer}>
                {posterUrl ? (
                  <Image source={{ uri: posterUrl }} style={styles.gridImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.gridImage, styles.fallbackBg]}>
                    <Ionicons name="videocam" size={28} color="#444" />
                  </View>
                )}
                <View style={styles.playOverlay}>
                  <Ionicons name="play" size={24} color="#fff" />
                </View>
              </View>
            )
          ) : isText ? (
            <View style={[styles.gridImage, styles.textCell]}>
              <Text style={styles.textCellText} numberOfLines={5}>{item.content || item.caption || 'Text post'}</Text>
            </View>
          ) : (
            <View style={styles.posterContainer}>
              {posterUrl ? (
                <Image source={{ uri: posterUrl }} style={styles.gridImage} resizeMode="cover" />
              ) : (
                <View style={[styles.gridImage, styles.fallbackBg]}>
                  <Ionicons name="image" size={28} color="#444" />
                </View>
              )}
            </View>
          )}

          <View style={styles.gridOverlay}>
            <Ionicons name="heart" size={11} color="#fff" />
            <Text style={styles.gridCount}>{item.likes_count || 0}</Text>
          </View>

          {isVideo && (
            <View style={styles.typeBadge}>
              <Ionicons name="videocam" size={10} color="#fff" />
            </View>
          )}
          {isText && (
            <View style={[styles.typeBadge, { backgroundColor: '#00d4ff' }]}>
              <Ionicons name="text" size={10} color="#000" />
            </View>
          )}
        </TouchableOpacity>

        {isOwnProfile && (
          <TouchableOpacity style={styles.deleteBtn} onPress={() => setDeleteModalPost(item)}>
            <Ionicons name="trash" size={14} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchProfile} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile?.full_name || profile?.display_name || profile?.username || 'User';
  const imageCount = allPosts.filter(p => p.media_type === 'image').length;
  const videoCount = allPosts.filter(p => p.media_type === 'video').length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{displayName}</Text>
        <TouchableOpacity onPress={() => router.push('/streets/settings')}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.profileCard}>
        {profile?.avatar_url ? (
          <Image source={{ uri: profile.avatar_url }} style={styles.profileAvatar} />
        ) : (
          <View style={[styles.profileAvatar, styles.avatarPlaceholder]}>
            <Ionicons name="person" size={40} color="#fff" />
          </View>
        )}
        <View style={styles.profileInfo}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={styles.profileName}>{displayName}</Text>
            {profile?.verified && <Ionicons name="checkmark-circle" size={16} color="#00d4ff" style={{ marginLeft: 4 }} />}
          </View>
          <Text style={styles.profileHandle}>@{profile?.username || 'user'}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{allPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <TouchableOpacity style={styles.stat} onPress={() => router.push(`/streets/followers?userId=${targetUserId}`)}>
          <Text style={styles.statNum}>{followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.stat} onPress={() => router.push(`/streets/following?userId=${targetUserId}`)}>
          <Text style={styles.statNum}>{following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.actionRow}>
        {isOwnProfile ? (
          <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/streets/create')}>
            <Ionicons name="add-circle" size={18} color="#000" />
            <Text style={styles.actionBtnText}>New Post</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={[styles.actionBtn, isFollowingUser && styles.actionBtnFollowing]} onPress={handleFollow}>
            <Text style={[styles.actionBtnText, isFollowingUser && styles.actionBtnTextFollowing]}>
              {isFollowingUser ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === 'all' && styles.filterBtnActive]} onPress={() => setActiveFilter('all')}>
          <Text style={[styles.filterText, activeFilter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === 'images' && styles.filterBtnActive]} onPress={() => setActiveFilter('images')}>
          <Ionicons name="image" size={14} color={activeFilter === 'images' ? '#00d4ff' : '#888'} />
          <Text style={[styles.filterText, activeFilter === 'images' && styles.filterTextActive]}>Pics ({imageCount})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, activeFilter === 'videos' && styles.filterBtnActive]} onPress={() => setActiveFilter('videos')}>
          <Ionicons name="videocam" size={14} color={activeFilter === 'videos' ? '#00d4ff' : '#888'} />
          <Text style={[styles.filterText, activeFilter === 'videos' && styles.filterTextActive]}>Videos ({videoCount})</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredPosts}
        keyExtractor={item => item.id}
        renderItem={renderPost}
        numColumns={GRID_COLS}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#fff" />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="images-outline" size={48} color="#444" />
            <Text style={styles.emptyText}>
              {activeFilter === 'all' ? 'No posts yet' : activeFilter === 'images' ? 'No photos yet' : 'No videos yet'}
            </Text>
            {isOwnProfile && activeFilter === 'all' && (
              <TouchableOpacity onPress={() => router.push('/streets/create')} style={styles.createBtn}>
                <Text style={styles.createBtnText}>Create your first post</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />

      {/* Delete Confirmation Modal */}
      <Modal visible={!!deleteModalPost} transparent animationType="fade" onRequestClose={() => setDeleteModalPost(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Ionicons name="trash-outline" size={40} color="#ff4444" />
            <Text style={styles.modalTitle}>Delete Post?</Text>
            <Text style={styles.modalText}>This action cannot be undone.</Text>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setDeleteModalPost(null)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={() => deleteModalPost && handleDeletePost(deleteModalPost.id)}>
                <Text style={styles.modalConfirmText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Preview Modal */}
      <Modal visible={!!previewPost} transparent animationType="slide" onRequestClose={() => setPreviewPost(null)}>
        <View style={styles.previewOverlay}>
          <TouchableOpacity style={styles.previewClose} onPress={() => setPreviewPost(null)}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          {previewPost?.media_type === 'video' && previewPost.media_url ? (
            <video src={previewPost.media_url} style={styles.previewMedia} autoPlay loop playsInline controls />
          ) : previewPost?.media_url ? (
            <Image source={{ uri: previewPost.media_url }} style={styles.previewMedia} resizeMode="contain" />
          ) : (
            <View style={[styles.previewMedia, { justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
              <Text style={{ color: '#fff', fontSize: 18, textAlign: 'center' }}>{previewPost?.content || previewPost?.caption || ''}</Text>
            </View>
          )}
          {previewPost && (
            <View style={styles.previewInfo}>
              <Text style={styles.previewCaption}>{previewPost.content || previewPost.caption || ''}</Text>
              <View style={{ flexDirection: 'row', gap: 16, marginTop: 8 }}>
                <Text style={styles.previewMeta}>❤ {previewPost.likes_count || 0}</Text>
                <Text style={styles.previewMeta}>💬 {previewPost.comments_count || 0}</Text>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700', maxWidth: 200 },
  profileCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16, borderWidth: 2, borderColor: '#00d4ff' },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  profileHandle: { color: '#888', fontSize: 14, marginTop: 2 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 6, lineHeight: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  stat: { alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 12, marginTop: 2 },
  actionRow: { flexDirection: 'row', justifyContent: 'center', paddingVertical: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#00d4ff', paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  actionBtnFollowing: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444' },
  actionBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  actionBtnTextFollowing: { color: '#fff' },
  filterRow: { flexDirection: 'row', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 8, gap: 8, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  filterBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, backgroundColor: '#111', gap: 4 },
  filterBtnActive: { backgroundColor: '#00d4ff22', borderWidth: 1, borderColor: '#00d4ff' },
  filterText: { color: '#888', fontSize: 12 },
  filterTextActive: { color: '#00d4ff', fontWeight: '600' },
  gridCellWrapper: { width: CELL_SIZE, height: CELL_SIZE, padding: 1, position: 'relative' },
  gridCell: { width: '100%', height: '100%', overflow: 'hidden' },
  gridImage: { width: '100%', height: '100%' },
  gridVideo: { width: '100%', height: '100%', objectFit: 'cover' },
  posterContainer: { width: '100%', height: '100%', position: 'relative' },
  fallbackBg: { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' },
  playOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  textCell: { justifyContent: 'center', alignItems: 'center', padding: 10, backgroundColor: '#1a1a2e' },
  textCellText: { color: '#fff', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  gridOverlay: { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 8, paddingHorizontal: 4, paddingVertical: 2 },
  gridCount: { color: '#fff', fontSize: 10, marginLeft: 2, fontWeight: '600' },
  typeBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 3 },
  deleteBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 4, zIndex: 10 },
  empty: { alignItems: 'center', paddingVertical: 60, width: SCREEN_W },
  emptyText: { color: '#666', fontSize: 14, marginTop: 12 },
  createBtn: { marginTop: 16, backgroundColor: '#00d4ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#ff4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#00d4ff', fontWeight: '700', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalContent: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 24, alignItems: 'center', width: '100%', maxWidth: 320 },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 12 },
  modalText: { color: '#888', fontSize: 14, marginTop: 8, textAlign: 'center' },
  modalActions: { flexDirection: 'row', marginTop: 20, gap: 12 },
  modalCancel: { flex: 1, backgroundColor: '#333', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: '#fff', fontWeight: '600' },
  modalConfirm: { flex: 1, backgroundColor: '#ff4444', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
  previewOverlay: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  previewClose: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, right: 16, zIndex: 10, padding: 8 },
  previewMedia: { width: SCREEN_W, height: SCREEN_W * 1.2 },
  previewInfo: { position: 'absolute', bottom: 40, left: 16, right: 16 },
  previewCaption: { color: '#fff', fontSize: 14, lineHeight: 20 },
  previewMeta: { color: '#888', fontSize: 12 },
});
