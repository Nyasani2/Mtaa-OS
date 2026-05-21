import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  Dimensions, Animated, ActivityIndicator, Alert, Share as RNShare
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Video, ResizeMode } from 'expo-av';

const { width, height } = Dimensions.get('window');

interface StreetPost {
  id: string;
  user_id: string;
  author_name: string;
  author_avatar: string | null;
  author_verified: boolean;
  content_type: 'video' | 'image' | 'text' | 'product' | 'job' | 'service' | 'live' | 'ad';
  media_urls: string[];
  caption: string;
  hashtags: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  views_count: number;
  gifts_count: number;
  is_sponsored: boolean;
  sponsor_name: string | null;
  product_id: string | null;
  job_id: string | null;
  live_room_id: string | null;
  created_at: string;
  user_liked: boolean;
  user_followed: boolean;
}

type FeedType = 'for_you' | 'following' | 'nearby' | 'trending' | 'new' | 'live';

export default function FeedScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [posts, setPosts] = useState<StreetPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedType, setFeedType] = useState<FeedType>('for_you');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [muted, setMuted] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const doubleTapRef = useRef(false);
  const likeAnimation = useRef(new Animated.Value(0)).current;

  const fetchPosts = useCallback(async () => {
    try {
      let query = supabase
        .from('street_content')
        .select(`
          *,
          street_likes!left(user_id),
          street_follows!left(follower_id)
        `)
        .limit(50);

      if (feedType === 'following' && user) {
        const { data: follows } = await supabase
          .from('street_follows')
          .select('following_id')
          .eq('follower_id', user.id);
        const followingIds = follows?.map(f => f.following_id) || [];
        if (followingIds.length > 0) {
          query = query.in('user_id', followingIds);
        } else {
          setPosts([]);
          setLoading(false);
          return;
        }
      } else if (feedType === 'trending') {
        query = query.order('views_count', { ascending: false });
      } else if (feedType === 'new') {
        query = query.order('created_at', { ascending: false });
      } else if (feedType === 'live') {
        query = query.eq('content_type', 'live').eq('is_live', true);
      } else {
        // for_you - algorithmic mix
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;
      if (error) throw error;

      const processed = (data || []).map((post: any) => ({
        ...post,
        user_liked: post.street_likes?.some((l: any) => l.user_id === user?.id) || false,
        user_followed: post.street_follows?.some((f: any) => f.follower_id === user?.id) || false,
      }));

      setPosts(processed);
    } catch (err) {
      console.error('Feed error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [feedType, user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const handleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!user) {
      Alert.alert('Sign In', 'Please sign in to like content');
      return;
    }

    // Optimistic update
    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, user_liked: !currentlyLiked, likes_count: currentlyLiked ? p.likes_count - 1 : p.likes_count + 1 }
        : p
    ));

    try {
      if (currentlyLiked) {
        await supabase.from('street_likes').delete().eq('content_id', postId).eq('user_id', user.id);
      } else {
        await supabase.from('street_likes').insert({ content_id: postId, user_id: user.id });
        // Trigger like animation
        Animated.sequence([
          Animated.timing(likeAnimation, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(likeAnimation, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const handleDoubleTap = (postId: string, currentlyLiked: boolean) => {
    if (doubleTapRef.current) {
      handleLike(postId, currentlyLiked);
    } else {
      doubleTapRef.current = true;
      setTimeout(() => { doubleTapRef.current = false; }, 300);
    }
  };

  const handleFollow = async (authorId: string, currentlyFollowed: boolean) => {
    if (!user) return;
    try {
      if (currentlyFollowed) {
        await supabase.from('street_follows').delete().eq('following_id', authorId).eq('follower_id', user.id);
      } else {
        await supabase.from('street_follows').insert({ following_id: authorId, follower_id: user.id });
      }
      setPosts(prev => prev.map(p =>
        p.user_id === authorId ? { ...p, user_followed: !currentlyFollowed } : p
      ));
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const handleShare = async (post: StreetPost) => {
    try {
      await RNShare.share({
        message: `${post.caption} - Check this out on MTAA Streets!`,
        url: `https://mtaa.afriq/streets/${post.id}`,
      });
      await supabase.from('street_shares').insert({ content_id: post.id, user_id: user?.id });
    } catch (err) {
      console.log('Share cancelled');
    }
  };

  const handleGift = (postId: string) => {
    router.push(`/streets/gift?postId=${postId}`);
  };

  const handleTip = (authorId: string) => {
    router.push(`/wallet/send?to=${authorId}&type=creator_tip`);
  };

  const openComments = (postId: string) => {
    setSelectedPostId(postId);
    setShowComments(true);
  };

  const openProfile = (userId: string) => {
    router.push(`/streets/profile/${userId}`);
  };

  const openProduct = (productId: string) => {
    router.push(`/shop/product/${productId}`);
  };

  const openJob = (jobId: string) => {
    router.push(`/jobs/${jobId}`);
  };

  const openLive = (roomId: string) => {
    router.push(`/streets/live/${roomId}`);
  };

  const openWallet = () => {
    router.push('/wallet');
  };

  const openStudio = () => {
    router.push('/studio');
  };

  const openMarketplace = () => {
    router.push('/marketplace');
  };

  const handleReport = (postId: string) => {
    Alert.alert(
      'Report Content',
      'Why are you reporting this?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport(postId, 'spam') },
        { text: 'Inappropriate', onPress: () => submitReport(postId, 'inappropriate') },
        { text: 'Copyright', onPress: () => submitReport(postId, 'copyright') },
        { text: 'Other', onPress: () => submitReport(postId, 'other') },
      ]
    );
  };

  const submitReport = async (postId: string, reason: string) => {
    await supabase.from('street_reports').insert({
      content_id: postId,
      reporter_id: user?.id,
      reason,
      status: 'pending',
    });
    Alert.alert('Reported', 'Thank you for helping keep MTAA safe.');
  };

  const handleNotInterested = (postId: string) => {
    setPosts(prev => prev.filter(p => p.id !== postId));
    supabase.from('street_hidden').insert({ content_id: postId, user_id: user?.id });
  };

  const handleBoost = (postId: string) => {
    router.push(`/ads/boost?contentId=${postId}&type=street`);
  };

  const handleSave = async (postId: string) => {
    await supabase.from('street_saves').insert({ content_id: postId, user_id: user?.id });
    Alert.alert('Saved', 'Content added to your saved items.');
  };

  const renderPost = ({ item, index }: { item: StreetPost; index: number }) => {
    const isCurrent = index === currentIndex;

    return (
      <View style={styles.postContainer}>
        {/* Media Content */}
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => handleDoubleTap(item.id, item.user_liked)}
          style={styles.mediaContainer}
        >
          {item.content_type === 'video' && item.media_urls[0] ? (
            <Video
              source={{ uri: item.media_urls[0] }}
              style={styles.video}
              resizeMode={ResizeMode.COVER}
              isLooping
              shouldPlay={isCurrent && !muted}
              isMuted={muted}
            />
          ) : item.content_type === 'image' && item.media_urls[0] ? (
            <Image source={{ uri: item.media_urls[0] }} style={styles.image} resizeMode="cover" />
          ) : (
            <View style={styles.textCard}>
              <Text style={styles.textContent}>{item.caption}</Text>
            </View>
          )}

          {/* Sponsored Badge */}
          {item.is_sponsored && (
            <View style={styles.sponsoredBadge}>
              <Text style={styles.sponsoredText}>Sponsored by {item.sponsor_name}</Text>
            </View>
          )}

          {/* Live Badge */}
          {item.content_type === 'live' && (
            <TouchableOpacity style={styles.liveBadge} onPress={() => openLive(item.live_room_id!)}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Right Side Actions */}
        <View style={styles.actionsColumn}>
          <TouchableOpacity onPress={() => openProfile(item.user_id)} style={styles.actionItem}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>
                {item.author_name?.charAt(0).toUpperCase() || 'U'}
              </Text>
            </View>
            {item.author_verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleLike(item.id, item.user_liked)} style={styles.actionItem}>
            <Animated.View style={{ transform: [{ scale: likeAnimation.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }] }}>
              <Ionicons
                name={item.user_liked ? 'heart' : 'heart-outline'}
                size={32}
                color={item.user_liked ? '#ef4444' : '#f8fafc'}
              />
            </Animated.View>
            <Text style={styles.actionCount}>{item.likes_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openComments(item.id)} style={styles.actionItem}>
            <Ionicons name="chatbubble-outline" size={32} color="#f8fafc" />
            <Text style={styles.actionCount}>{item.comments_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionItem}>
            <Ionicons name="arrow-redo-outline" size={32} color="#f8fafc" />
            <Text style={styles.actionCount}>{item.shares_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleGift(item.id)} style={styles.actionItem}>
            <Ionicons name="gift-outline" size={32} color="#f59e0b" />
            <Text style={styles.actionCount}>{item.gifts_count}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleSave(item.id)} style={styles.actionItem}>
            <Ionicons name="bookmark-outline" size={28} color="#f8fafc" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => handleReport(item.id)} style={styles.actionItem}>
            <Ionicons name="flag-outline" size={28} color="#f8fafc" />
          </TouchableOpacity>
        </View>

        {/* Bottom Info */}
        <View style={styles.bottomInfo}>
          <TouchableOpacity onPress={() => openProfile(item.user_id)}>
            <Text style={styles.authorName}>
              @{item.author_name}
              {item.author_verified && <Text style={styles.verifiedMark}> ✓</Text>}
            </Text>
          </TouchableOpacity>

          <Text style={styles.caption} numberOfLines={3}>{item.caption}</Text>

          <View style={styles.hashtagRow}>
            {item.hashtags?.map((tag, i) => (
              <TouchableOpacity key={i} onPress={() => router.push(`/streets/discover?hashtag=${tag}`)}>
                <Text style={styles.hashtag}>#{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Content Type Specific Actions */}
          <View style={styles.typeActions}>
            {item.product_id && (
              <TouchableOpacity style={styles.typeBtn} onPress={() => openProduct(item.product_id)}>
                <Ionicons name="cart-outline" size={14} color="#fff" />
                <Text style={styles.typeBtnText}>Shop Product</Text>
              </TouchableOpacity>
            )}
            {item.job_id && (
              <TouchableOpacity style={styles.typeBtn} onPress={() => openJob(item.job_id)}>
                <Ionicons name="briefcase-outline" size={14} color="#fff" />
                <Text style={styles.typeBtnText}>View Job</Text>
              </TouchableOpacity>
            )}
            {item.content_type === 'live' && (
              <TouchableOpacity style={[styles.typeBtn, styles.liveBtn]} onPress={() => openLive(item.live_room_id!)}>
                <Ionicons name="videocam" size={14} color="#fff" />
                <Text style={styles.typeBtnText}>Join Live</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Music / Sound */}
          <View style={styles.soundRow}>
            <Ionicons name="musical-note" size={14} color="#94a3b8" />
            <Text style={styles.soundText}>Original Sound - {item.author_name}</Text>
            <TouchableOpacity onPress={() => setMuted(!muted)} style={styles.muteBtn}>
              <Ionicons name={muted ? "volume-mute" : "volume-high"} size={18} color="#f8fafc" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Follow Button */}
        {item.user_id !== user?.id && (
          <TouchableOpacity
            style={[styles.followBtn, item.user_followed && styles.followedBtn]}
            onPress={() => handleFollow(item.user_id, item.user_followed)}
          >
            <Text style={[styles.followText, item.user_followed && styles.followedText]}>
              {item.user_followed ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {/* Quick Action Bar */}
        <View style={styles.quickBar}>
          <TouchableOpacity onPress={() => handleTip(item.user_id)}>
            <Ionicons name="cash-outline" size={20} color="#f59e0b" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push(`/chat/${item.user_id}`)}>
            <Ionicons name="mail-outline" size={20} color="#f8fafc" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleBoost(item.id)}>
            <Ionicons name="trending-up-outline" size={20} color="#10b981" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleNotInterested(item.id)}>
            <Ionicons name="eye-off-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#3b82f6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Feed Type Selector */}
      <View style={styles.feedSelector}>
        {(['for_you', 'following', 'nearby', 'trending', 'new', 'live'] as FeedType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.feedTypeBtn, feedType === type && styles.feedTypeActive]}
            onPress={() => setFeedType(type)}
          >
            <Text style={[styles.feedTypeText, feedType === type && styles.feedTypeTextActive]}>
              {type === 'for_you' ? 'For You' : type === 'live' ? 'LIVE' : type.charAt(0).toUpperCase() + type.slice(1)}
            </Text>
            {type === 'live' && <View style={styles.liveIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Feed */}
      <FlatList
        ref={flatListRef}
        data={posts}
        renderItem={renderPost}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={({ viewableItems }) => {
          if (viewableItems.length > 0) {
            setCurrentIndex(viewableItems[0].index || 0);
          }
        }}
        viewabilityConfig={{ itemVisiblePercentThreshold: 50 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="videocam-off-outline" size={48} color="#334155" />
            <Text style={styles.emptyText}>No content yet</Text>
            <TouchableOpacity style={styles.createBtn} onPress={() => router.push('/streets/create')}>
              <Text style={styles.createBtnText}>Create First Post</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Top Navigation */}
      <View style={styles.topNav}>
        <TouchableOpacity onPress={openWallet}>
          <Ionicons name="wallet-outline" size={24} color="#f8fafc" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>MTAA Streets</Text>
        <TouchableOpacity onPress={() => router.push('/streets/search')}>
          <Ionicons name="search" size={24} color="#f8fafc" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  topNav: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  topTitle: { fontSize: 18, fontWeight: '800', color: '#f8fafc' },
  feedSelector: {
    position: 'absolute',
    top: 90,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    zIndex: 10,
    paddingHorizontal: 16,
  },
  feedTypeBtn: { paddingVertical: 6 },
  feedTypeActive: { borderBottomWidth: 2, borderBottomColor: '#f8fafc' },
  feedTypeText: { fontSize: 14, fontWeight: '600', color: '#94a3b8' },
  feedTypeTextActive: { color: '#f8fafc' },
  liveIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginLeft: 4,
  },
  postContainer: {
    width,
    height: height - 100,
    position: 'relative',
  },
  mediaContainer: {
    width,
    height: height - 100,
    backgroundColor: '#1e293b',
  },
  video: { width, height: height - 100 },
  image: { width, height: height - 100 },
  textCard: {
    width,
    height: height - 100,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1e293b',
  },
  textContent: { fontSize: 20, color: '#f8fafc', textAlign: 'center', lineHeight: 28 },
  sponsoredBadge: {
    position: 'absolute',
    top: 140,
    left: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sponsoredText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  liveBadge: {
    position: 'absolute',
    top: 140,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  liveText: { fontSize: 12, fontWeight: '800', color: '#fff' },
  actionsColumn: {
    position: 'absolute',
    right: 12,
    bottom: 180,
    alignItems: 'center',
    gap: 16,
  },
  actionItem: { alignItems: 'center' },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f8fafc',
  },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#fff' },
  verifiedBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    padding: 2,
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  actionCount: { fontSize: 12, color: '#f8fafc', marginTop: 2, fontWeight: '600' },
  bottomInfo: {
    position: 'absolute',
    bottom: 100,
    left: 16,
    right: 100,
  },
  authorName: { fontSize: 16, fontWeight: '700', color: '#f8fafc', marginBottom: 6 },
  verifiedMark: { color: '#3b82f6' },
  caption: { fontSize: 14, color: '#e2e8f0', lineHeight: 20, marginBottom: 8 },
  hashtagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  hashtag: { fontSize: 13, color: '#3b82f6', fontWeight: '600' },
  typeActions: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.8)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 4,
  },
  liveBtn: { backgroundColor: 'rgba(239, 68, 68, 0.8)' },
  typeBtnText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  soundRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soundText: { fontSize: 12, color: '#94a3b8' },
  muteBtn: { marginLeft: 8 },
  followBtn: {
    position: 'absolute',
    right: 12,
    bottom: 420,
    backgroundColor: '#ef4444',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  followedBtn: { backgroundColor: '#334155' },
  followText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  followedText: { color: '#94a3b8' },
  quickBar: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.8)',
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  empty: { alignItems: 'center', marginTop: 200 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#94a3b8', marginTop: 16 },
  createBtn: {
    marginTop: 16,
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});
