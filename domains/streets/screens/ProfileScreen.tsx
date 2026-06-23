import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MapPin, Link as LinkIcon, Grid, Heart, MessageCircle } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_SIZE = (SCREEN_W - 48) / 3;

interface ProfileData {
  user_id: string;
  display_name: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  location?: string;
  website?: string;
  followers_count?: number;
  following_count?: number;
}

interface UserPost {
  id: string;
  media_url: string | null;
  media_type: string | null;
  likes_count: number;
  comments_count: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // FIX: Support multiple param names and window.location fallback
  const rawId = params.id || params.userId || params.user_id;
  let userId: string | undefined;

  if (typeof rawId === 'string' && rawId.length > 0 && rawId !== 'undefined') {
    userId = rawId;
  } else if (typeof window !== 'undefined') {
    // Fallback: extract from URL pathname
    const match = window.location.pathname.match(/\/streets\/profile\/([^\/]+)/);
    if (match) userId = match[1];
  }

  const hasValidId = !!userId && userId.length > 0;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<UserPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'posts' | 'liked'>('posts');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!hasValidId) {
      setError('No user ID provided');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log('[ProfileScreen] Loading profile for:', userId);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setIsCurrentUser(user?.id === userId);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('user_id, display_name, username, bio, avatar_url, location, website')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('[ProfileScreen] Profile error:', profileError);
        setError('User not found');
        setIsLoading(false);
        return;
      }

      setProfile(profileData);

      // Load posts
      const { data: postsData, error: postsError } = await supabase
        .from('streets_posts')
        .select('id, media_url, media_type, likes_count, comments_count')
        .eq('creator_id', userId)
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(30);

      if (postsError) {
        console.error('[ProfileScreen] Posts error:', postsError);
      } else {
        setPosts(postsData || []);
      }

      // Check follow status
      if (user && user.id !== userId) {
        const { data: followData } = await supabase
          .from('streets_follows')
          .select('id')
          .eq('follower_id', user.id)
          .eq('following_id', userId)
          .maybeSingle();
        setIsFollowing(!!followData);
      }

      console.log('[ProfileScreen] Loaded profile:', profileData?.display_name);
    } catch (err: any) {
      console.error('[ProfileScreen] Load error:', err);
      setError(err.message || 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasValidId]);

  useEffect(() => {
    console.log('[ProfileScreen] Mounting with id:', userId, 'hasValidId:', hasValidId);
    loadProfile();
  }, [loadProfile]);

  const handleFollow = useCallback(async () => {
    if (!hasValidId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (isFollowing) {
        await supabase
          .from('streets_follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
        setIsFollowing(false);
      } else {
        await supabase.from('streets_follows').insert({
          follower_id: user.id,
          following_id: userId,
        });
        setIsFollowing(true);
      }
    } catch (err) {
      console.error('[ProfileScreen] Follow error:', err);
    }
  }, [hasValidId, isFollowing, userId]);

  const handlePostPress = useCallback((postId: string) => {
    router.push(`/streets/comments/${postId}`);
  }, [router]);

  const renderPostGrid = useCallback(() => {
    if (posts.length === 0) {
      return (
        <View style={styles.emptyGrid}>
          <Grid size={48} color="#ccc" />
          <Text style={styles.emptyGridText}>No posts yet</Text>
        </View>
      );
    }

    return (
      <View style={styles.grid}>
        {posts.map((post) => (
          <TouchableOpacity
            key={post.id}
            style={styles.gridItem}
            onPress={() => handlePostPress(post.id)}
          >
            {post.media_url ? (
              <Image source={{ uri: post.media_url }} style={styles.gridImage} />
            ) : (
              <View style={styles.gridPlaceholder}>
                <Text style={styles.gridPlaceholderText}>📝</Text>
              </View>
            )}
            <View style={styles.gridOverlay}>
              <View style={styles.gridStat}>
                <Heart size={14} color="#fff" fill="#fff" />
                <Text style={styles.gridStatText}>{post.likes_count}</Text>
              </View>
              <View style={styles.gridStat}>
                <MessageCircle size={14} color="#fff" fill="#fff" />
                <Text style={styles.gridStatText}>{post.comments_count}</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    );
  }, [posts, handlePostPress]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Error</Text>
        <Text style={styles.errorSub}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={loadProfile}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>User not found</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
          <Text style={styles.retryText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.display_name}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Profile Info */}
      <View style={styles.profileSection}>
        <View style={styles.avatarWrap}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarFallbackText}>
                {profile.display_name.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{posts.length}</Text>
            <Text style={styles.statLabel}>Posts</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile.followers_count || 0}</Text>
            <Text style={styles.statLabel}>Followers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statNumber}>{profile.following_count || 0}</Text>
            <Text style={styles.statLabel}>Following</Text>
          </View>
        </View>

        <Text style={styles.name}>{profile.display_name}</Text>
        {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

        {profile.location && (
          <View style={styles.infoRow}>
            <MapPin size={14} color="#666" />
            <Text style={styles.infoText}>{profile.location}</Text>
          </View>
        )}

        {profile.website && (
          <View style={styles.infoRow}>
            <LinkIcon size={14} color="#2196F3" />
            <Text style={[styles.infoText, styles.linkText]}>{profile.website}</Text>
          </View>
        )}

        {!isCurrentUser && (
          <TouchableOpacity
            style={[styles.followBtn, isFollowing && styles.followingBtn]}
            onPress={handleFollow}
          >
            <Text style={[styles.followBtnText, isFollowing && styles.followingBtnText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
          onPress={() => setActiveTab('posts')}
        >
          <Grid size={20} color={activeTab === 'posts' ? '#333' : '#999'} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'liked' && styles.tabActive]}
          onPress={() => setActiveTab('liked')}
        >
          <Heart size={20} color={activeTab === 'liked' ? '#333' : '#999'} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      {activeTab === 'posts' ? renderPostGrid() : (
        <View style={styles.emptyGrid}>
          <Heart size={48} color="#ccc" />
          <Text style={styles.emptyGridText}>Liked posts</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  errorSub: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  profileSection: {
    padding: 16,
    alignItems: 'center',
  },
  avatarWrap: {
    marginBottom: 16,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarFallback: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2196F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarFallbackText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 32,
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 13,
    color: '#999',
    marginTop: 2,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  bio: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  infoText: {
    fontSize: 13,
    color: '#666',
  },
  linkText: {
    color: '#2196F3',
  },
  followBtn: {
    marginTop: 12,
    backgroundColor: '#2196F3',
    paddingHorizontal: 32,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followingBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  followBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  followingBtnText: {
    color: '#333',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#333',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    gap: 4,
  },
  gridItem: {
    width: GRID_SIZE,
    height: GRID_SIZE,
    position: 'relative',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridPlaceholderText: {
    fontSize: 24,
  },
  gridOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12,
    opacity: 0,
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  gridStatText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyGrid: {
    padding: 60,
    alignItems: 'center',
  },
  emptyGridText: {
    marginTop: 12,
    fontSize: 14,
    color: '#999',
  },
});
