// app/(os)/pulse/index.tsx
// FIXED: Uses creator_id (not user_id) — matches your streets_posts schema
// Uses embedded relationship (FK will be added via SQL)

import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/useAuthStore';

const { width, height } = Dimensions.get('window');
const VIDEO_HEIGHT = height - 100;

interface PulsePost {
  id: string;
  creator_id: string;
  media_url: string;
  thumbnail_url: string | null;
  media_type: 'image' | 'video';
  caption: string | null;
  created_at: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  profile?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  };
}

export default function PulseScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<PulsePost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const videoRefs = useRef<Map<string, Video>>(new Map());

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);

      // Use embedded relationship (FK will be added)
      const { data, error } = await supabase
        .from('streets_posts')
        .select(`
          id,
          creator_id,
          media_url,
          thumbnail_url,
          media_type,
          caption,
          created_at,
          likes_count,
          comments_count,
          profiles:creator_id(full_name, username, avatar_url)
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Get user's liked posts
      let likedPostIds = new Set<string>();
      if (user?.id && data && data.length > 0) {
        const { data: likedData } = await supabase
          .from('streets_likes')
          .select('post_id')
          .eq('user_id', user.id)
          .in('post_id', data.map((p: any) => p.id));
        likedPostIds = new Set((likedData || []).map((l: any) => l.post_id));
      }

      const transformed: PulsePost[] = (data || []).map((item: any) => ({
        ...item,
        is_liked: likedPostIds.has(item.id),
        profile: item.profiles || null,
      }));

      setPosts(transformed);
    } catch (err) {
      console.error('Pulse fetch error:', err);
      // Fallback: if embedded fails, fetch without relationship
      try {
        const { data: fallbackData } = await supabase
          .from('streets_posts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(50);

        if (fallbackData) {
          const userIds = [...new Set(fallbackData.map((p: any) => p.creator_id))];
          const { data: profilesData } = await supabase
            .from('profiles')
            .select('id, full_name, username, avatar_url')
            .in('id', userIds);

          const profilesMap = new Map();
          (profilesData || []).forEach((p: any) => profilesMap.set(p.id, p));

          setPosts(fallbackData.map((item: any) => ({
            ...item,
            is_liked: false,
            profile: profilesMap.get(item.creator_id) || null,
          })));
        }
      } catch (fallbackErr) {
        console.error('Fallback fetch error:', fallbackErr);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: Array<{ item: PulsePost; index: number }> }) => {
    if (viewableItems.length > 0) {
      const newIndex = viewableItems[0].index ?? 0;
      setCurrentIndex(newIndex);

      videoRefs.current.forEach((video, id) => {
        video.pauseAsync?.().catch(() => {});
      });

      const visiblePost = viewableItems[0].item;
      if (visiblePost.media_type === 'video' || visiblePost.media_url?.match(/\.(mp4|mov|avi|mkv|webm)$/i)) {
        const video = videoRefs.current.get(visiblePost.id);
        video?.playAsync?.().catch(() => {});
      }
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 60,
  }).current;

  const handleLike = async (postId: string, index: number) => {
    if (!user?.id) {
      Alert.alert('Sign In', 'Please sign in to like posts');
      return;
    }

    const post = posts[index];
    const newLiked = !post.is_liked;
    const newCount = newLiked ? post.likes_count + 1 : post.likes_count - 1;

    setPosts(prev => prev.map((p, i) => 
      i === index ? { ...p, is_liked: newLiked, likes_count: newCount } : p
    ));

    try {
      if (newLiked) {
        await supabase.from('streets_likes').insert({ post_id: postId, user_id: user.id });
      } else {
        await supabase
          .from('streets_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      }
    } catch (err) {
      setPosts(prev => prev.map((p, i) => 
        i === index ? { ...p, is_liked: !newLiked, likes_count: post.likes_count } : p
      ));
    }
  };

  const handleComment = (postId: string) => {
    router.push(`/(os)/pulse/comments/${postId}`);
  };

  const handleShare = async (post: PulsePost) => {
    const shareUrl = `mtaa://pulse/${post.id}`;
  };

  const renderItem = useCallback(({ item, index }: { item: PulsePost; index: number }) => {
    const isVideo = item.media_type === 'video' || item.media_url?.match(/\.(mp4|mov|avi|mkv|webm)$/i);
    const isActive = index === currentIndex;
    const avatarUri = item.profile?.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(item.profile?.full_name || 'User')}&background=6366f1&color=fff`;

    return (
      <View style={styles.postContainer}>
        <View style={styles.mediaWrapper}>
          {isVideo ? (
            <Video
              ref={(ref) => {
                if (ref) videoRefs.current.set(item.id, ref);
              }}
              source={{ uri: item.media_url }}
              style={styles.media}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isActive}
              isMuted={muted}
              useNativeControls={false}
              onError={(e) => console.error('Video error:', e)}
            />
          ) : (
            <Image source={{ uri: item.media_url }} style={styles.media} resizeMode="cover" />
          )}

          {isVideo && (
            <TouchableOpacity 
              style={styles.muteBtn} 
              onPress={() => setMuted(!muted)}
            >
              <Ionicons name={muted ? "volume-mute" : "volume-high"} size={24} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleLike(item.id, index)}>
            <Ionicons 
              name={item.is_liked ? "heart" : "heart-outline"} 
              size={32} 
              color={item.is_liked ? "#ef4444" : "#fff"} 
            />
            <Text style={styles.actionCount}>{item.likes_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleComment(item.id)}>
            <Ionicons name="chatbubble-ellipses" size={30} color="#fff" />
            <Text style={styles.actionCount}>{item.comments_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionBtn} onPress={() => handleShare(item)}>
            <Ionicons name="share-outline" size={30} color="#fff" />
            <Text style={styles.actionCount}>Share</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomInfo}>
          <TouchableOpacity 
            style={styles.authorRow}
            onPress={() => router.push(`/(os)/profile/${item.creator_id}`)}
          >
            <Image source={{ uri: avatarUri }} style={styles.authorAvatar} />
            <Text style={styles.authorName}>
              {item.profile?.full_name || item.profile?.username || 'User'}
            </Text>
            <View style={styles.followBtn}>
              <Text style={styles.followText}>Follow</Text>
            </View>
          </TouchableOpacity>

          {item.caption && (
            <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>
          )}

          <Text style={styles.timestamp}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    );
  }, [currentIndex, muted, posts, user?.id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        snapToInterval={VIDEO_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPosts(); }} />
        }
        getItemLayout={(_, index) => ({
          length: VIDEO_HEIGHT,
          offset: VIDEO_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },

  postContainer: {
    width,
    height: VIDEO_HEIGHT,
    position: 'relative',
  },
  mediaWrapper: {
    width,
    height: VIDEO_HEIGHT,
    backgroundColor: '#000',
  },
  media: {
    width,
    height: VIDEO_HEIGHT,
  },
  muteBtn: {
    position: 'absolute',
    bottom: 120,
    right: 80,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },

  actionBar: {
    position: 'absolute',
    right: 8,
    bottom: 100,
    alignItems: 'center',
    gap: 16,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 80,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  authorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: '#fff',
  },
  authorName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  followBtn: {
    backgroundColor: '#6366f1',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  followText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  caption: {
    color: '#fff',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 20,
  },
  timestamp: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 4,
  },
});
