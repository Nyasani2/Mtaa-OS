import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Image,
  Dimensions, Platform, RefreshControl, Alert, ActivityIndicator,
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
}

function GridVideo({ uri, style }: { uri: string; style: any }) {
  if (Platform.OS === 'web') {
    const flattened = StyleSheet.flatten([
      { width: '100%', height: '100%', objectFit: 'cover' },
      style,
    ]);
    return (
      <video
        src={uri}
        style={flattened}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
      />
    );
  }
  return (
    <View style={[style, { backgroundColor: '#111', justifyContent: 'center', alignItems: 'center' }]}>
      <Ionicons name="videocam" size={24} color="#00d4ff" />
    </View>
  );
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
        .select('id, media_url, media_type, content, caption, likes_count, comments_count, created_at')
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

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('streets_posts').delete().eq('id', postId);
          if (error) { Alert.alert('Error', error.message); return; }
          setAllPosts(prev => prev.filter(p => p.id !== postId));
          Alert.alert('Deleted', 'Post removed.');
        },
      },
    ]);
  };

  const handleEditPost = (postId: string) => {
    router.push(`/streets/create?editPostId=${postId}`);
  };

  const renderPost = ({ item }: { item: UserPost }) => {
    const isHovered = hoveredPostId === item.id;
    const isVideo = item.media_type === 'video';

    return (
      <TouchableOpacity
        style={styles.gridCell}
        onPress={() => router.push(`/streets/post/${item.id}`)}
        onLongPress={() => {
          if (isOwnProfile) {
            Alert.alert('Manage Post', '', [
              { text: 'Edit', onPress: () => handleEditPost(item.id) },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeletePost(item.id) },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }
        }}
        onMouseEnter={() => setHoveredPostId(item.id)}
        onMouseLeave={() => setHoveredPostId(null)}
      >
        {item.media_url && item.media_type !== 'text' ? (
          isVideo && isHovered ? (
            <GridVideo uri={item.media_url} style={styles.gridImage} />
          ) : (
            <Image source={{ uri: item.media_url }} style={styles.gridImage} />
          )
        ) : (
          <View style={[styles.gridImage, styles.textCell]}>
            <Text style={styles.textCellText} numberOfLines={4}>{item.content || item.caption || ''}</Text>
          </View>
        )}
        <View style={styles.gridOverlay}>
          <Ionicons name="heart" size={12} color="#fff" />
          <Text style={styles.gridCount}>{item.likes_count}</Text>
        </View>
        {isVideo && (
          <View style={styles.videoBadge}>
            <Ionicons name="videocam" size={12} color="#fff" />
          </View>
        )}
        {isOwnProfile && (
          <TouchableOpacity style={styles.editBtn} onPress={() => handleEditPost(item.id)}>
            <Ionicons name="create" size={14} color="#fff" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
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
        <TouchableOpacity onPress={() => router.back()} style={[styles.retryBtn, { marginTop: 8 }]}>
          <Text style={styles.retryText}>Go Back</Text>
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
        <Text style={styles.headerTitle}>{displayName}</Text>
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
          <Text style={styles.profileName}>{displayName}</Text>
          {profile?.verified && <Ionicons name="checkmark-circle" size={16} color="#00d4ff" />}
          <Text style={styles.profileHandle}>@{profile?.username || 'user'}</Text>
          {profile?.bio && <Text style={styles.bio}>{profile.bio}</Text>}
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{allPosts.length}</Text>
          <Text style={styles.statLabel}>Posts</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{followers}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statNum}>{following}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: Platform.OS === 'ios' ? 50 : 16, paddingBottom: 12 },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  profileCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  profileAvatar: { width: 80, height: 80, borderRadius: 40, marginRight: 16 },
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
  gridCell: { width: CELL_SIZE, height: CELL_SIZE, padding: 1, position: 'relative' },
  gridImage: { width: '100%', height: '100%', backgroundColor: '#111' },
  textCell: { justifyContent: 'center', alignItems: 'center', padding: 8 },
  textCellText: { color: '#fff', fontSize: 10, textAlign: 'center' },
  gridOverlay: { position: 'absolute', bottom: 4, left: 4, flexDirection: 'row', alignItems: 'center' },
  gridCount: { color: '#fff', fontSize: 10, marginLeft: 2 },
  videoBadge: { position: 'absolute', top: 4, left: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 4, padding: 2 },
  editBtn: { position: 'absolute', top: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10, padding: 4 },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { color: '#666', fontSize: 14, marginTop: 12 },
  createBtn: { marginTop: 16, backgroundColor: '#00d4ff', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  createBtnText: { color: '#000', fontWeight: '700', fontSize: 14 },
  errorText: { color: '#ff4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#00d4ff', fontWeight: '700', fontSize: 14 },
});
