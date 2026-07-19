import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface ChannelVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  views_count: number;
  duration_seconds: number | null;
  created_at: string;
}

interface CreatorProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export default function ChannelScreen() {
  const { creatorId } = useLocalSearchParams<{ creatorId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [videos, setVideos] = useState<ChannelVideo[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscriberCount, setSubscriberCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (creatorId) fetchChannelData();
  }, [creatorId]);

  const fetchChannelData = async () => {
    try {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, full_name, avatar_url, bio')
        .eq('id', creatorId)
        .single();
      setCreator(profile);

      const { data: vids } = await supabase
        .from('studio_videos')
        .select('id, title, thumbnail_url, views_count, duration_seconds, created_at')
        .eq('creator_id', creatorId)
        .eq('status', 'published')
        .eq('visibility', 'public')
        .order('created_at', { ascending: false });
      setVideos(vids || []);

      const { count } = await supabase
        .from('studio_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId);
      setSubscriberCount(count || 0);

      if (user?.id) {
        const { data: sub } = await supabase
          .from('studio_subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .eq('creator_id', creatorId)
          .single();
        setIsSubscribed(!!sub);
      }
    } catch (e) {
      console.error('Channel error:', e);
    } finally {
      setLoading(false);
    }
  };

  const toggleSubscribe = async () => {
    if (!user?.id || !creatorId) return;
    try {
      if (isSubscribed) {
        await supabase.from('studio_subscriptions').delete().eq('user_id', user.id).eq('creator_id', creatorId);
        setIsSubscribed(false);
        setSubscriberCount(c => Math.max(0, c - 1));
      } else {
        await supabase.from('studio_subscriptions').insert({ user_id: user.id, creator_id: creatorId });
        setIsSubscribed(true);
        setSubscriberCount(c => c + 1);
      }
    } catch (e) {
      console.error('Subscribe error:', e);
    }
  };

  const formatDuration = (s: number | null) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const renderVideo = ({ item }: { item: ChannelVideo }) => (
    <TouchableOpacity
      style={styles.videoCard}
      onPress={() => router.push(`/(os)/studio/video-player?videoId=${item.id}`)}
    >
      <View style={styles.thumbBox}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumb} />
        ) : (
          <View style={styles.thumbPlaceholder}>
            <Feather name="film" size={24} color="#666" />
          </View>
        )}
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{formatDuration(item.duration_seconds)}</Text>
        </View>
      </View>
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title || 'Untitled'}</Text>
        <Text style={styles.videoMeta}>{item.views_count?.toLocaleString() || 0} views</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading channel...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Channel</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.channelHeader}>
        <View style={styles.banner} />
        <View style={styles.profileSection}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {creator?.full_name?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{creator?.full_name || 'Creator'}</Text>
            <Text style={styles.profileSub}>{subscriberCount.toLocaleString()} subscribers</Text>
          </View>
          {user?.id !== creatorId && (
            <TouchableOpacity
              style={[styles.subscribeBtn, isSubscribed && styles.subscribedBtn]}
              onPress={toggleSubscribe}
            >
              <Text style={[styles.subscribeText, isSubscribed && styles.subscribedText]}>
                {isSubscribed ? 'Subscribed' : 'Subscribe'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        {creator?.bio && (
          <Text style={styles.bio} numberOfLines={3}>{creator.bio}</Text>
        )}
      </View>

      <Text style={styles.sectionTitle}>Videos</Text>
      <FlatList
        data={videos}
        keyExtractor={v => v.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        renderItem={renderVideo}
        contentContainerStyle={{ paddingBottom: 20 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 40 },
  channelHeader: { marginBottom: 16 },
  banner: { width: '100%', height: 100, backgroundColor: '#1f1f1f' },
  profileSection: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: -30, gap: 12 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#0a0a0a' },
  profileAvatarText: { color: '#fff', fontSize: 28, fontWeight: '800' },
  profileInfo: { flex: 1 },
  profileName: { color: '#fff', fontSize: 18, fontWeight: '700' },
  profileSub: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  subscribeBtn: { backgroundColor: '#ef4444', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  subscribedBtn: { backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#333' },
  subscribeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  subscribedText: { color: '#9ca3af' },
  bio: { color: '#9ca3af', fontSize: 13, lineHeight: 18, marginHorizontal: 16, marginTop: 12 },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginHorizontal: 16, marginBottom: 12, marginTop: 8 },
  videoCard: { flex: 1, marginBottom: 16, maxWidth: '50%' },
  thumbBox: { aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1f1f1f' },
  thumb: { width: '100%', height: '100%' },
  thumbPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  durationBadge: { position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  durationText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  videoInfo: { marginTop: 8 },
  videoTitle: { color: '#fff', fontSize: 13, fontWeight: '600' },
  videoMeta: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
});
