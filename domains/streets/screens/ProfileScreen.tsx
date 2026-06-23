import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Settings, Grid, Heart, Bookmark } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface ProfileData {
  user_id: string;
  display_name: string;
  username?: string;
  bio?: string;
  avatar_url?: string;
  followers_count?: number;
  following_count?: number;
}

export default function ProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'saved'>('posts');

  // Validate ID
  const hasValidId = !!id && typeof id === 'string' && id.length > 0 && id !== 'undefined';

  useEffect(() => {
    console.log('[ProfileScreen] Mounting with id:', id, 'hasValidId:', hasValidId);
    loadProfile();
  }, [id]);

  async function loadProfile() {
    if (!hasValidId) {
      console.warn('[ProfileScreen] No valid ID provided');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const { data: profileData } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }

      const { data: postsData } = await supabase
        .from('streets_posts')
        .select('*')
        .eq('creator_id', id)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      setPosts(postsData || []);
    } catch (err) {
      console.error('[ProfileScreen] Error:', err);
    } finally {
      setIsLoading(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!hasValidId) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Invalid Profile</Text>
          <Text style={styles.emptySub}>No user ID was provided</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={styles.retryText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#333" />
          </TouchableOpacity>
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>User not found</Text>
          <Text style={styles.emptySub}>This profile doesn't exist</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{profile.display_name}</Text>
        <TouchableOpacity>
          <Settings size={24} color="#333" />
        </TouchableOpacity>
      </View>

      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.avatarWrap}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarLetter}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.name}>{profile.display_name}</Text>
          {profile.username && <Text style={styles.username}>@{profile.username}</Text>}
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}

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

          <TouchableOpacity style={styles.followBtn}>
            <Text style={styles.followBtnText}>Follow</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'posts' && styles.tabActive]}
            onPress={() => setActiveTab('posts')}
          >
            <Grid size={20} color={activeTab === 'posts' ? '#333' : '#999'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'likes' && styles.tabActive]}
            onPress={() => setActiveTab('likes')}
          >
            <Heart size={20} color={activeTab === 'likes' ? '#333' : '#999'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Bookmark size={20} color={activeTab === 'saved' ? '#333' : '#999'} />
          </TouchableOpacity>
        </View>

        <View style={styles.grid}>
          {posts.length === 0 ? (
            <View style={styles.noPosts}>
              <Text style={styles.noPostsText}>No posts yet</Text>
            </View>
          ) : (
            posts.map((post) => (
              <TouchableOpacity 
                key={post.id} 
                style={styles.gridItem}
                onPress={() => router.push(`/streets/feed`)}
              >
                {post.media_url ? (
                  <Image source={{ uri: post.media_url }} style={styles.gridImage} />
                ) : (
                  <View style={styles.gridText}>
                    <Text style={styles.gridTextContent} numberOfLines={3}>
                      {post.content}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 100,
    fontSize: 16,
    color: '#999',
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
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  emptySub: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
    fontSize: 15,
    fontWeight: '600',
  },
  profileSection: {
    alignItems: 'center',
    padding: 20,
  },
  avatarWrap: {
    marginBottom: 12,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#FF2D55',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    color: '#fff',
    fontSize: 40,
    fontWeight: 'bold',
  },
  name: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  username: {
    fontSize: 14,
    color: '#999',
    marginTop: 2,
  },
  bio: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 32,
  },
  stat: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  followBtn: {
    marginTop: 16,
    backgroundColor: '#FF2D55',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
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
    padding: 1,
  },
  gridItem: {
    width: '33.33%',
    aspectRatio: 1,
    padding: 1,
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  gridText: {
    width: '100%',
    height: '100%',
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  gridTextContent: {
    fontSize: 10,
    color: '#666',
  },
  noPosts: {
    width: '100%',
    padding: 40,
    alignItems: 'center',
  },
  noPostsText: {
    color: '#999',
    fontSize: 14,
  },
});
