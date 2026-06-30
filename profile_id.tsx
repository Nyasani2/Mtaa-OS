import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Image,
  Dimensions, ActivityIndicator, Platform, Alert, FlatList, RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SCREEN_W } = Dimensions.get('window');

interface PublicProfile {
  user_id: string;
  display_name: string | null;
  username: string | null;
  avatar_url: string | null;
  cover_photo_url: string | null;
  bio: string | null;
  city: string | null;
  country: string | null;
  profession: string | null;
  is_verified: boolean;
  follower_count: number;
  following_count: number;
  online_status: string;
  role: string;
}

interface PostItem {
  id: string;
  content: string;
  media_url: string | null;
  media_type: 'image' | 'video' | 'audio' | 'text';
  thumbnail_url: string | null;
  video_thumbnail_url: string | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
}

type TabKey = 'posts' | 'videos' | 'photos' | 'marketplace' | 'about';

const TAB_ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'posts', label: 'Posts', icon: 'grid-outline' },
  { key: 'videos', label: 'Videos', icon: 'videocam-outline' },
  { key: 'photos', label: 'Photos', icon: 'images-outline' },
  { key: 'marketplace', label: 'Shop', icon: 'storefront-outline' },
  { key: 'about', label: 'About', icon: 'information-circle-outline' },
];

export default function PublicProfileScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const targetId = id;
  const isOwnProfile = user?.id === targetId;

  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('posts');
  const [refreshing, setRefreshing] = useState(false);

  // Follow state (managed locally since hooks may not exist)
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);

  const fetchProfile = useCallback(async () => {
    if (!targetId) { setError('No user specified'); setLoading(false); return; }
    try {
      const { data, error: pErr } = await supabase
        .from('profiles')
        .select('user_id, display_name, username, avatar_url, cover_photo_url, bio, city, country, profession, is_verified, follower_count, following_count, online_status, role')
        .eq('user_id', targetId)
        .single();
      if (pErr) throw pErr;
      setProfile(data);

      // Fetch real follower count
      const { count: fCount } = await supabase.from('streets_follows').select('*', { count: 'exact', head: true }).eq('following_id', targetId);
      setFollowerCount(fCount ?? (data.follower_count || 0));

      // Check if current user follows this profile
      if (user?.id && !isOwnProfile) {
        const { data: followData } = await supabase.from('streets_follows').select('id').eq('follower_id', user.id).eq('following_id', targetId).maybeSingle();
        setIsFollowing(!!followData);
      }

      // Check if blocked
      if (user?.id && !isOwnProfile) {
        const { data: blockData } = await supabase.from('profile_blocks').select('id').eq('blocker_id', user.id).eq('blocked_id', targetId).maybeSingle();
        setIsBlocked(!!blockData);
      }

      // Check subscription
      if (user?.id && !isOwnProfile) {
        const { data: subData } = await supabase.from('profile_subscriptions').select('id').eq('subscriber_id', user.id).eq('creator_id', targetId).maybeSingle();
        setIsSubscribed(!!subData);
      }

      // Subscriber count
      const { count: sCount } = await supabase.from('profile_subscriptions').select('*', { count: 'exact', head: true }).eq('creator_id', targetId);
      setSubscriberCount(sCount ?? 0);

    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [targetId, user?.id, isOwnProfile]);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  // FIXED: Follow with real Supabase insert/delete
  const handleFollow = async () => {
    if (!isAuthenticated || !user?.id || !targetId) { Alert.alert('Sign In', 'Please sign in to follow'); return; }
    if (isFollowing) {
      Alert.alert('Unfollow', `Unfollow @${profile?.username || 'this user'}?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unfollow', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('streets_follows').delete().eq('follower_id', user.id).eq('following_id', targetId);
          if (error) { Alert.alert('Error', error.message); return; }
          setIsFollowing(false);
          setFollowerCount(c => Math.max(0, c - 1));
        }},
      ]);
    } else {
      const { error } = await supabase.from('streets_follows').insert({ follower_id: user.id, following_id: targetId });
      if (error) { Alert.alert('Error', error.message); return; }
      setIsFollowing(true);
      setFollowerCount(c => c + 1);
    }
  };

  // FIXED: Block with confirmation
  const handleBlock = async () => {
    if (!isAuthenticated || !user?.id || !targetId) { Alert.alert('Sign In', 'Please sign in'); return; }
    if (isBlocked) {
      const { error } = await supabase.from('profile_blocks').delete().eq('blocker_id', user.id).eq('blocked_id', targetId);
      if (error) { Alert.alert('Error', error.message); return; }
      setIsBlocked(false);
      Alert.alert('Unblocked', 'You have unblocked this user');
    } else {
      Alert.alert('Block User', `Block @${profile?.username || 'this user'}? They will not be able to see your profile or message you.`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Block', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('profile_blocks').insert({ blocker_id: user.id, blocked_id: targetId });
          if (error) { Alert.alert('Error', error.message); return; }
          setIsBlocked(true);
          setIsFollowing(false);
          Alert.alert('Blocked', 'User has been blocked');
        }},
      ]);
    }
  };

  // FIXED: Tip with amount input
  const handleTip = () => {
    if (!isAuthenticated) { Alert.alert('Sign In', 'Please sign in to send tips'); return; }
    Alert.alert('Send Tip', 'Enter amount in KES', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'KES 50', onPress: () => sendTip(50) },
      { text: 'KES 100', onPress: () => sendTip(100) },
      { text: 'KES 200', onPress: () => sendTip(200) },
    ]);
  };

  const sendTip = async (amount: number) => {
    if (!user?.id || !targetId) return;
    const { error } = await supabase.from('profile_tips').insert({
      sender_id: user.id,
      recipient_id: targetId,
      amount,
      currency: 'KES',
      status: 'pending',
    });
    if (error) { Alert.alert('Error', error.message); return; }
    Alert.alert('Tip Sent', `KES ${amount} tip sent to @${profile?.username || 'user'}`);
  };

  // FIXED: Subscribe with real Supabase
  const handleSubscribe = () => {
    if (!isAuthenticated) { Alert.alert('Sign In', 'Please sign in to subscribe'); return; }
    if (isSubscribed) {
      Alert.alert('Cancel Subscription?', 'You will lose access to exclusive content.', [
        { text: 'Keep', style: 'cancel' },
        { text: 'Cancel', style: 'destructive', onPress: async () => {
          const { error } = await supabase.from('profile_subscriptions').delete().eq('subscriber_id', user.id).eq('creator_id', targetId);
          if (error) { Alert.alert('Error', error.message); return; }
          setIsSubscribed(false);
          setSubscriberCount(c => Math.max(0, c - 1));
        }},
      ]);
    } else {
      Alert.alert('Subscribe', 'Subscribe to creator tier for KES 100/month?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe (KES 100)', onPress: async () => {
          const { error } = await supabase.from('profile_subscriptions').insert({
            subscriber_id: user.id,
            creator_id: targetId,
            tier: 'Standard',
            amount: 100,
            currency: 'KES',
            status: 'active',
          });
          if (error) { Alert.alert('Error', error.message); return; }
          setIsSubscribed(true);
          setSubscriberCount(c => c + 1);
          Alert.alert('Subscribed!', 'You are now subscribed to this creator');
        }},
      ]);
    }
  };

  // FIXED: Share button actually shares
  const handleShare = async () => {
    const shareUrl = `https://mtaa.afriq/profile/${profile?.username || targetId}`;
    const message = `Check out ${profile?.display_name || profile?.username || 'this profile'} on MTAA! ${shareUrl}`;
    try {
      await Sharing.shareAsync(shareUrl, { dialogTitle: 'Share Profile' });
    } catch {
      Alert.alert('Share Profile', message);
    }
  };

  // FIXED: Message button routes to real messages screen
  const handleMessage = () => {
    if (!isAuthenticated) { Alert.alert('Sign In', 'Please sign in to message'); return; }
    // Route to messages with user param
    router.push({ pathname: '/(communication)/messages', params: { userId: targetId } } as any);
  };

  // FIXED: Report routes to real report flow
  const handleReport = () => {
    router.push({ pathname: '/(os)/profile/report', params: { userId: targetId, username: profile?.username || '' } } as any);
  };

  // FIXED: More actions menu with all real actions
  const handleMoreActions = () => {
    const options = [
      { text: 'Message', onPress: handleMessage },
      { text: isBlocked ? 'Unblock' : 'Block', onPress: handleBlock },
      { text: 'Report', style: 'destructive' as const, onPress: handleReport },
      { text: 'Cancel', style: 'cancel' as const },
    ];
    Alert.alert('More Actions', '', options);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="alert-circle" size={48} color="#ff4444" />
        <Text style={styles.errorText}>{error || 'Profile not found'}</Text>
        <TouchableOpacity onPress={() => { setRefreshing(true); fetchProfile(); }} style={styles.retryBtn}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const displayName = profile.display_name || profile.username || 'User';
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchProfile(); }} tintColor="#00d4ff" />}
      >
        <View style={styles.coverContainer}>
          {profile.cover_photo_url ? (
            <Image source={{ uri: profile.cover_photo_url }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.coverPlaceholder]} />
          )}
          <View style={styles.coverOverlay} />
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          {!isOwnProfile && (
            <View style={styles.topActions}>
              {/* FIXED: Message routes to real messages screen */}
              <TouchableOpacity style={styles.iconBtn} onPress={handleMessage}>
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              </TouchableOpacity>
              {/* FIXED: Share actually shares */}
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.headerSection}>
          <View style={styles.avatarWrap}>
            {profile.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Ionicons name="person" size={40} color="#fff" />
              </View>
            )}
            <View style={[styles.onlineDot, { backgroundColor: profile.online_status === 'online' ? '#00ff88' : '#888' }]} />
          </View>

          <View style={styles.nameRow}>
            <Text style={styles.displayName}>{displayName}</Text>
            {profile.is_verified && <Ionicons name="checkmark-circle" size={18} color="#00d4ff" />}
            {profile.role === 'creator' && <Ionicons name="sparkles" size={16} color="#ff00ff" style={{ marginLeft: 4 }} />}
          </View>

          <Text style={styles.username}>@{profile.username || 'user'}</Text>
          {profile.profession && (
            <View style={styles.professionRow}>
              <Ionicons name="briefcase-outline" size={12} color="#888" />
              <Text style={styles.professionText}>{profile.profession}</Text>
            </View>
          )}
          {location ? (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={12} color="#888" />
              <Text style={styles.locationText}>{location}</Text>
            </View>
          ) : null}
          {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}

          <View style={styles.statsRow}>
            {/* FIXED: Followers tappable — routes to followers list */}
            <TouchableOpacity style={styles.stat} onPress={() => router.push({ pathname: '/(os)/profile/followers', params: { userId: targetId } } as any)}>
              <Text style={styles.statNum}>{followerCount}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            {/* FIXED: Following tappable — routes to following list */}
            <TouchableOpacity style={styles.stat} onPress={() => router.push({ pathname: '/(os)/profile/following', params: { userId: targetId } } as any)}>
              <Text style={styles.statNum}>{profile.following_count || 0}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
            <View style={styles.stat}>
              <Text style={styles.statNum}>{subscriberCount}</Text>
              <Text style={styles.statLabel}>Subscribers</Text>
            </View>
          </View>

          {!isOwnProfile && (
            <View style={styles.actionRow}>
              {/* FIXED: Follow with confirmation on unfollow */}
              <TouchableOpacity
                style={[styles.primaryBtn, isFollowing && styles.followingBtn]}
                onPress={handleFollow}
              >
                <Ionicons name={isFollowing ? 'checkmark' : 'person-add'} size={14} color={isFollowing ? '#fff' : '#000'} />
                <Text style={[styles.primaryBtnText, isFollowing && styles.followingBtnText]}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>

              {/* FIXED: Tip with amount selection */}
              <TouchableOpacity style={styles.secondaryBtn} onPress={handleTip}>
                <Ionicons name="cash-outline" size={14} color="#fff" />
                <Text style={styles.secondaryBtnText}>Tip</Text>
              </TouchableOpacity>

              {profile.role === 'creator' && (
                <TouchableOpacity style={[styles.secondaryBtn, isSubscribed && styles.subscribedBtn]} onPress={handleSubscribe}>
                  <Ionicons name={isSubscribed ? 'star' : 'star-outline'} size={14} color={isSubscribed ? '#ff00ff' : '#fff'} />
                  <Text style={[styles.secondaryBtnText, isSubscribed && { color: '#ff00ff' }]}>
                    {isSubscribed ? 'Subscribed' : 'Subscribe'}
                  </Text>
                </TouchableOpacity>
              )}

              {/* FIXED: More actions with real block/report/message */}
              <TouchableOpacity style={styles.iconActionBtn} onPress={handleMoreActions}>
                <Ionicons name="ellipsis-horizontal" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          {isOwnProfile && (
            <TouchableOpacity style={styles.editOwnBtn} onPress={() => router.push('/(os)/profile/edit')}>
              <Ionicons name="create-outline" size={16} color="#fff" />
              <Text style={styles.editOwnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* NEW: Content tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsContainer} contentContainerStyle={styles.tabsContent}>
          {TAB_ITEMS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, activeTab === tab.key && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons name={tab.icon as any} size={16} color={activeTab === tab.key ? '#00d4ff' : '#888'} />
              <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.tabContent}>
          {activeTab === 'posts' && <PostsTab userId={targetId} router={router} />}
          {activeTab === 'videos' && <VideosTab userId={targetId} router={router} />}
          {activeTab === 'photos' && <PhotosTab userId={targetId} router={router} />}
          {activeTab === 'marketplace' && <MarketplaceTab userId={targetId} router={router} />}
          {activeTab === 'about' && <AboutTab profile={profile} />}
        </View>
      </ScrollView>
    </View>
  );
}

// --- TAB COMPONENTS ---

function PostsTab({ userId, router }: { userId?: string; router: any }) {
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('streets_posts').select('id, content, media_url, media_type, thumbnail_url, video_thumbnail_url, likes_count, comments_count, created_at')
      .eq('creator_id', userId).order('created_at', { ascending: false }).limit(30)
      .then(({ data, error }) => { if (error) console.warn('[PostsTab]', error.message); setPosts(data || []); setLoading(false); });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00d4ff" /></View>;
  if (posts.length === 0) return <EmptyTab icon="grid-outline" title="No posts yet" />;

  return (
    <View style={styles.grid}>
      {posts.map(post => <GridItem key={post.id} post={post} router={router} />)}
    </View>
  );
}

function VideosTab({ userId, router }: { userId?: string; router: any }) {
  const [videos, setVideos] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('streets_posts').select('id, content, media_url, thumbnail_url, video_thumbnail_url, likes_count, created_at')
      .eq('creator_id', userId).eq('media_type', 'video').order('created_at', { ascending: false }).limit(30)
      .then(({ data, error }) => { if (error) console.warn('[VideosTab]', error.message); setVideos(data || []); setLoading(false); });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00d4ff" /></View>;
  if (videos.length === 0) return <EmptyTab icon="videocam-outline" title="No videos yet" />;

  return (
    <View style={styles.grid}>
      {videos.map(v => <GridItem key={v.id} post={v} router={router} />)}
    </View>
  );
}

function PhotosTab({ userId, router }: { userId?: string; router: any }) {
  const [photos, setPhotos] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('streets_posts').select('id, media_url, likes_count, created_at')
      .eq('creator_id', userId).eq('media_type', 'image').order('created_at', { ascending: false }).limit(30)
      .then(({ data, error }) => { if (error) console.warn('[PhotosTab]', error.message); setPhotos(data || []); setLoading(false); });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00d4ff" /></View>;
  if (photos.length === 0) return <EmptyTab icon="images-outline" title="No photos yet" />;

  return (
    <View style={styles.grid}>
      {photos.map(p => <GridItem key={p.id} post={p} router={router} />)}
    </View>
  );
}

function MarketplaceTab({ userId, router }: { userId?: string; router: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    supabase.from('marketplace_listings').select('id, title, price, currency, images, status').eq('seller_id', userId).eq('status', 'active').order('created_at', { ascending: false }).limit(20)
      .then(({ data, error }) => { if (error) console.warn('[MarketplaceTab]', error.message); setItems(data || []); setLoading(false); });
  }, [userId]);

  if (loading) return <View style={styles.center}><ActivityIndicator color="#00d4ff" /></View>;
  if (items.length === 0) return <EmptyTab icon="storefront-outline" title="No listings yet" />;

  return (
    <View style={{ padding: 8 }}>
      {items.map(item => (
        <TouchableOpacity key={item.id} style={styles.marketItem} onPress={() => router.push(`/(commerce)/marketplace/${item.id}` as any)}>
          {item.images?.[0] && <Image source={{ uri: item.images[0] }} style={styles.marketImage} />}
          <View style={styles.marketInfo}>
            <Text style={styles.marketTitle}>{item.title}</Text>
            <Text style={styles.marketPrice}>KES {item.price?.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function AboutTab({ profile }: { profile: PublicProfile }) {
  return (
    <View style={{ padding: 16 }}>
      <Text style={styles.aboutTitle}>About</Text>
      {profile.bio && <Text style={styles.aboutText}>{profile.bio}</Text>}
      <View style={styles.aboutRow}>
        <Ionicons name="briefcase-outline" size={16} color="#888" />
        <Text style={styles.aboutLabel}>Profession</Text>
        <Text style={styles.aboutValue}>{profile.profession || 'Not set'}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name="location-outline" size={16} color="#888" />
        <Text style={styles.aboutLabel}>Location</Text>
        <Text style={styles.aboutValue}>{[profile.city, profile.country].filter(Boolean).join(', ') || 'Not set'}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#888" />
        <Text style={styles.aboutLabel}>Verified</Text>
        <Text style={styles.aboutValue}>{profile.is_verified ? 'Yes' : 'No'}</Text>
      </View>
      <View style={styles.aboutRow}>
        <Ionicons name="star-outline" size={16} color="#888" />
        <Text style={styles.aboutLabel}>Role</Text>
        <Text style={styles.aboutValue}>{profile.role || 'User'}</Text>
      </View>
    </View>
  );
}

function GridItem({ post, router }: { post: PostItem; router: any }) {
  const isVideo = post.media_type === 'video';
  const isText = post.media_type === 'text' || (!post.media_url && post.content);
  const thumbnail = post.media_type === 'image' ? post.media_url : (post.video_thumbnail_url || post.thumbnail_url || post.media_url);

  return (
    <TouchableOpacity style={styles.gridItem} onPress={() => router.push(`/(os)/streets/post/${post.id}` as any)} activeOpacity={0.8}>
      {isText ? (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.gridImage}>
          <Text style={styles.gridTextContent} numberOfLines={4}>{post.content}</Text>
        </LinearGradient>
      ) : thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.gridImage} resizeMode="cover" />
      ) : (
        <View style={[styles.gridImage, { backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }]}>
          <Ionicons name={isVideo ? 'videocam' : 'image'} size={24} color="#444" />
        </View>
      )}
      {isVideo && (
        <View style={styles.gridPlayOverlay}>
          <Ionicons name="play" size={20} color="#fff" />
        </View>
      )}
      <View style={styles.gridBadge}>
        <Ionicons name="heart" size={10} color="#fff" />
        <Text style={styles.gridBadgeText}>{post.likes_count || 0}</Text>
      </View>
    </TouchableOpacity>
  );
}

function EmptyTab({ icon, title }: { icon: string; title: string }) {
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name={icon as any} size={48} color="#333" />
      <Text style={styles.emptyTitle}>{title}</Text>
    </View>
  );
}

function getGradientColors(postId: string): [string, string] {
  const gradients: [string, string][] = [
    ['#667eea', '#764ba2'], ['#f093fb', '#f5576c'], ['#4facfe', '#00f2fe'],
    ['#43e97b', '#38f9d7'], ['#fa709a', '#fee140'], ['#30cfd0', '#330867'],
  ];
  let hash = 0;
  for (let i = 0; i < postId.length; i++) hash = postId.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center', padding: 24 },
  errorText: { color: '#ff4444', fontSize: 14, marginTop: 12, textAlign: 'center' },
  retryBtn: { marginTop: 16, backgroundColor: '#222', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  retryText: { color: '#00d4ff', fontWeight: '700' },
  coverContainer: { width: SCREEN_W, height: 180, position: 'relative' },
  coverImage: { width: '100%', height: '100%' },
  coverPlaceholder: { backgroundColor: '#111' },
  coverOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.3)' },
  backBtn: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, left: 16, width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  topActions: { position: 'absolute', top: Platform.OS === 'ios' ? 50 : 16, right: 16, flexDirection: 'row', gap: 12 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  headerSection: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  avatarWrap: { position: 'relative', alignSelf: 'flex-start', marginTop: -40 },
  avatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: '#000' },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  onlineDot: { position: 'absolute', bottom: 4, right: 4, width: 14, height: 14, borderRadius: 7, borderWidth: 2, borderColor: '#000' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 6 },
  displayName: { color: '#fff', fontSize: 20, fontWeight: '700' },
  username: { color: '#888', fontSize: 14, marginTop: 2 },
  professionRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  professionText: { color: '#aaa', fontSize: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  locationText: { color: '#888', fontSize: 12 },
  bio: { color: '#aaa', fontSize: 13, marginTop: 8, lineHeight: 18 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#1a1a1a', marginTop: 12 },
  stat: { alignItems: 'center' },
  statNum: { color: '#fff', fontSize: 18, fontWeight: '700' },
  statLabel: { color: '#888', fontSize: 11, marginTop: 2 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  primaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#00d4ff', paddingVertical: 10, borderRadius: 20, gap: 6 },
  primaryBtnText: { color: '#000', fontWeight: '700', fontSize: 13 },
  followingBtn: { backgroundColor: '#222', borderWidth: 1, borderColor: '#444' },
  followingBtnText: { color: '#fff' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, gap: 6, borderWidth: 1, borderColor: '#333' },
  secondaryBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  subscribedBtn: { borderColor: '#ff00ff44' },
  iconActionBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  editOwnBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#222', paddingVertical: 10, borderRadius: 20, gap: 6, marginTop: 12, borderWidth: 1, borderColor: '#333' },
  editOwnText: { color: '#fff', fontWeight: '600', fontSize: 13 },

  tabsContainer: { marginTop: 12, maxHeight: 50 },
  tabsContent: { paddingHorizontal: 12, gap: 6 },
  tab: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#111', gap: 6, borderWidth: 1, borderColor: '#222' },
  tabActive: { backgroundColor: '#001a2e', borderColor: '#00d4ff33' },
  tabText: { color: '#888', fontSize: 12, fontWeight: '500' },
  tabTextActive: { color: '#00d4ff', fontWeight: '600' },
  tabContent: { paddingHorizontal: 8, paddingTop: 8, paddingBottom: 40 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 2 },
  gridItem: { width: (SCREEN_W - 20) / 3, height: (SCREEN_W - 20) / 3, backgroundColor: '#111', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  gridImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center', padding: 6 },
  gridTextContent: { color: '#fff', fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 16 },
  gridPlayOverlay: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.6)', width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  gridBadge: { position: 'absolute', bottom: 6, left: 6, flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  gridBadgeText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  emptyContainer: { alignItems: 'center', paddingVertical: 60 },
  emptyTitle: { color: '#444', fontSize: 14, marginTop: 12 },

  marketItem: { flexDirection: 'row', backgroundColor: '#111', padding: 12, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#222' },
  marketImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  marketInfo: { flex: 1, justifyContent: 'center' },
  marketTitle: { color: '#fff', fontSize: 14, fontWeight: '600' },
  marketPrice: { color: '#00d4ff', fontSize: 13, marginTop: 4 },

  aboutTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  aboutText: { color: '#aaa', fontSize: 13, lineHeight: 20, marginBottom: 16 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  aboutLabel: { color: '#888', fontSize: 12, marginLeft: 8, width: 80 },
  aboutValue: { color: '#fff', fontSize: 13, flex: 1 },
});
