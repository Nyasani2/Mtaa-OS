import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Image, FlatList,
  Dimensions, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface CreatorStats {
  totalVideos: number;
  totalViews: number;
  totalSubscribers: number;
  totalRevenue: number;
  followers: number;
  following: number;
}

interface ContentItem {
  id: string;
  title: string;
  thumbnail_url: string;
  type: 'video' | 'music' | 'podcast' | 'course' | 'livestream';
  status: 'published' | 'draft' | 'scheduled' | 'archived' | 'private';
  view_count: number;
  created_at: string;
}

const TABS = ['Videos', 'Music', 'Podcasts', 'Courses', 'Livestreams', 'Drafts'];

export default function CreatorProfileScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('Videos');
  const [stats, setStats] = useState<CreatorStats>({
    totalVideos: 0, totalViews: 0, totalSubscribers: 0, totalRevenue: 0, followers: 0, following: 0
  });
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    if (!user?.id) return;
    const { data: videos } = await supabase.from('mstudio_videos').select('view_count').eq('creator_id', user.id);
    const { data: subs } = await supabase.from('mstudio_subscriptions').select('id').eq('creator_id', user.id);
    const { data: rev } = await supabase.from('mstudio_revenue').select('amount').eq('creator_id', user.id);
    const { data: followers } = await supabase.from('profile_followers').select('id').eq('following_id', user.id);
    const { data: following } = await supabase.from('profile_followers').select('id').eq('follower_id', user.id);

    setStats({
      totalVideos: videos?.length || 0,
      totalViews: videos?.reduce((a, v) => a + (v.view_count || 0), 0) || 0,
      totalSubscribers: subs?.length || 0,
      totalRevenue: rev?.reduce((a, r) => a + (r.amount || 0), 0) || 0,
      followers: followers?.length || 0,
      following: following?.length || 0,
    });
  };

  const fetchContent = async () => {
    if (!user?.id) return;
    setLoading(true);

    let query = supabase.from('mstudio_videos').select('id, title, thumbnail_url, status, view_count, created_at').eq('creator_id', user.id);

    if (activeTab === 'Drafts') query = query.eq('status', 'draft');
    else if (activeTab === 'Videos') query = query.eq('status', 'published');
    else query = query.eq('type', activeTab.toLowerCase().slice(0, -1));

    const { data, error } = await query.order('created_at', { ascending: false });
    if (!error) {
      setContent((data || []).map((v: any) => ({
        id: v.id, title: v.title, thumbnail_url: v.thumbnail_url,
        type: 'video', status: v.status, view_count: v.view_count || 0, created_at: v.created_at
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchStats(); fetchContent(); }, [user?.id]);
  useEffect(() => { fetchContent(); }, [activeTab]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStats();
    await fetchContent();
    setRefreshing(false);
  };

  const formatNumber = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return `${n}`;
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff0000" />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ padding: 16, paddingTop: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold' }}>Studio</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => router.push('/(os)/studio/analytics')}>
                <Feather name="bar-chart-2" size={22} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/(os)/studio/settings')}>
                <Feather name="settings" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Card */}
        <View style={{ alignItems: 'center', paddingVertical: 16 }}>
          <Image
            source={user?.avatar_url ? { uri: user.avatar_url } : undefined}
            style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#333' }}
          />
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 12 }}>{user?.full_name || 'Creator'}</Text>
          <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>@{user?.username || 'creator'}</Text>
          {user?.verified && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
              <MaterialCommunityIcons name="check-decagram" size={14} color="#1DA1F2" />
              <Text style={{ color: '#1DA1F2', fontSize: 12, marginLeft: 4 }}>Verified</Text>
            </View>
          )}
        </View>

        {/* Stats Row */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#1a1a1a' }}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatNumber(stats.followers)}</Text>
            <Text style={{ color: '#888', fontSize: 11 }}>Followers</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatNumber(stats.following)}</Text>
            <Text style={{ color: '#888', fontSize: 11 }}>Following</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatNumber(stats.totalViews)}</Text>
            <Text style={{ color: '#888', fontSize: 11 }}>Views</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>{formatNumber(stats.totalSubscribers)}</Text>
            <Text style={{ color: '#888', fontSize: 11 }}>Subscribers</Text>
          </View>
        </View>

        {/* Revenue Card */}
        <TouchableOpacity
          onPress={() => router.push('/(os)/studio/revenue')}
          style={{ margin: 16, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View>
            <Text style={{ color: '#888', fontSize: 12 }}>Total Revenue</Text>
            <Text style={{ color: '#fff', fontSize: 24, fontWeight: 'bold', marginTop: 4 }}>KES {formatNumber(stats.totalRevenue)}</Text>
          </View>
          <Feather name="chevron-right" size={20} color="#888" />
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 12, marginBottom: 16 }}>
          <TouchableOpacity
            onPress={() => router.push('/(os)/studio/upload-center')}
            style={{ flex: 1, backgroundColor: '#ff0000', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
          >
            <Feather name="upload-cloud" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push('/(os)/studio/camera')}
            style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#333' }}
          >
            <Feather name="video" size={18} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>Go Live</Text>
          </TouchableOpacity>
        </View>

        {/* Content Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: activeTab === tab ? '#fff' : '#1a1a1a',
              }}
            >
              <Text style={{ color: activeTab === tab ? '#000' : '#fff', fontSize: 13, fontWeight: '500' }}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Content Grid */}
        {loading ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: '#666' }}>Loading...</Text>
          </View>
        ) : content.length === 0 ? (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Feather name="film" size={40} color="#333" />
            <Text style={{ color: '#666', marginTop: 12 }}>No {activeTab.toLowerCase()} yet</Text>
            <TouchableOpacity
              onPress={() => router.push('/(os)/studio/upload-center')}
              style={{ marginTop: 12, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 20, paddingVertical: 10 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create {activeTab.slice(0, -1)}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={content}
            keyExtractor={item => item.id}
            numColumns={2}
            scrollEnabled={false}
            columnWrapperStyle={{ justifyContent: 'space-between', paddingHorizontal: 16 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => router.push(`/(os)/studio/video-player?id=${item.id}`)}
                style={{ width: (width - 48) / 2, marginBottom: 16 }}
              >
                <View style={{ width: '100%', aspectRatio: 16 / 9, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
                  {item.thumbnail_url ? (
                    <Image source={{ uri: item.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                      <Feather name="film" size={24} color="#444" />
                    </View>
                  )}
                  {item.status !== 'published' && (
                    <View style={{ position: 'absolute', top: 6, left: 6, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{item.status.toUpperCase()}</Text>
                    </View>
                  )}
                </View>
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', marginTop: 6 }} numberOfLines={2}>{item.title}</Text>
                <Text style={{ color: '#666', fontSize: 11, marginTop: 2 }}>{formatNumber(item.view_count)} views</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
