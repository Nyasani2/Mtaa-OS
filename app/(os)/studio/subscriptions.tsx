import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Subscription {
  id: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string;
  subscriber_count: number;
  is_live: boolean;
  latest_video_title: string;
  latest_video_thumbnail: string;
  notification_enabled: boolean;
}

export default function SubscriptionsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [subs, setSubs] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSubscriptions = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('studio_subscriptions')
      .select('id, creator_id, notification_enabled, creator:creator_id (full_name, avatar_url)')
      .eq('subscriber_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) {
      // For each subscription, fetch latest video and live status
      const enriched = await Promise.all((data || []).map(async (sub: any) => {
        const { data: latest } = await supabase
          .from('studio_videos')
          .select('title, thumbnail_url')
          .eq('creator_id', sub.creator_id)
          .eq('status', 'published')
          .order('published_at', { ascending: false })
          .limit(1)
          .single();

        const { data: live } = await supabase
          .from('studio_live_streams')
          .select('id')
          .eq('creator_id', sub.creator_id)
          .eq('is_live', true)
          .limit(1)
          .single();

        const { count } = await supabase
          .from('studio_subscriptions')
          .select('id', { count: 'exact', head: true })
          .eq('creator_id', sub.creator_id);

        return {
          id: sub.id,
          creator_id: sub.creator_id,
          creator_name: sub.creator?.full_name || 'Unknown',
          creator_avatar: sub.creator?.avatar_url || '',
          subscriber_count: count || 0,
          is_live: !!live,
          latest_video_title: latest?.title || 'No videos yet',
          latest_video_thumbnail: latest?.thumbnail_url || '',
          notification_enabled: sub.notification_enabled || false,
        };
      }));

      setSubs(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchSubscriptions(); }, [user?.id]);

  const toggleNotification = async (subId: string, current: boolean) => {
    await supabase.from('studio_subscriptions').update({ notification_enabled: !current }).eq('id', subId);
    setSubs(prev => prev.map(s => s.id === subId ? { ...s, notification_enabled: !current } : s));
  };

  const unsubscribe = async (creatorId: string) => {
    Alert.alert('Unsubscribe', 'Stop following this creator?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unsubscribe',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('studio_subscriptions').delete().eq('creator_id', creatorId).eq('subscriber_id', user?.id);
          setSubs(prev => prev.filter(s => s.creator_id !== creatorId));
        },
      },
    ]);
  };

  const formatSubCount = (count: number) => {
    if (count >= 1000000) return `${(count / 1000000).toFixed(1)}M`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return `${count}`;
  };

  const renderSubscription = ({ item }: { item: Subscription }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/channel?id=${item.creator_id}`)}
      style={{ marginHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', borderRadius: 12, overflow: 'hidden' }}
    >
      {/* Channel Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', overflow: 'hidden' }}>
          {item.creator_avatar ? <Image source={{ uri: item.creator_avatar }} style={{ width: '100%', height: '100%' }} /> : null}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.creator_name}</Text>
            {item.is_live && (
              <View style={{ marginLeft: 8, backgroundColor: '#ff0000', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: '#fff', marginRight: 4 }} />
                <Text style={{ color: '#fff', fontSize: 9, fontWeight: 'bold' }}>LIVE</Text>
              </View>
            )}
          </View>
          <Text style={{ color: '#888', fontSize: 12 }}>{formatSubCount(item.subscriber_count)} subscribers</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => toggleNotification(item.id, item.notification_enabled)} style={{ padding: 8 }}>
            <Feather name={item.notification_enabled ? 'bell' : 'bell-off'} size={18} color={item.notification_enabled ? '#ff0000' : '#666'} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => unsubscribe(item.creator_id)} style={{ padding: 8 }}>
            <Feather name="user-x" size={18} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Latest Video */}
      <View style={{ flexDirection: 'row', padding: 12, alignItems: 'center' }}>
        <View style={{ width: 100, height: 56, borderRadius: 6, overflow: 'hidden', backgroundColor: '#222' }}>
          {item.latest_video_thumbnail ? (
            <Image source={{ uri: item.latest_video_thumbnail }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="film" size={16} color="#444" />
            </View>
          )}
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: '#888', fontSize: 10, marginBottom: 2 }}>LATEST</Text>
          <Text style={{ color: '#fff', fontSize: 13 }} numberOfLines={2}>{item.latest_video_title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Subscriptions</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={subs}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchSubscriptions().then(() => setRefreshing(false)); }} tintColor="#ff0000" />}
        renderItem={renderSubscription}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <MaterialCommunityIcons name="youtube-subscription" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16 }}>No subscriptions yet</Text>
            <Text style={{ color: '#444', marginTop: 4 }}>Subscribe to creators to see their updates</Text>
            <TouchableOpacity
              onPress={() => router.push('/(os)/studio/feed')}
              style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Discover Creators</Text>
            </TouchableOpacity>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}
