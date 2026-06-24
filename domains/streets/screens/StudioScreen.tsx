import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions, Modal,
  TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Video, ResizeMode } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface Sound {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  audio_url: string;
  duration: number;
  usage_count: number;
  created_at: string;
}

interface LiveStream {
  id: string;
  title: string;
  creator_id: string;
  creator_name: string;
  creator_avatar: string | null;
  viewer_count: number;
  is_live: boolean;
  thumbnail_url: string | null;
  started_at: string;
}

export default function StudioScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'sounds' | 'live' | 'tools'>('sounds');
  const [sounds, setSounds] = useState<Sound[]>([]);
  const [liveStreams, setLiveStreams] = useState<LiveStream[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showGoLive, setShowGoLive] = useState(false);
  const [liveTitle, setLiveTitle] = useState('');
  const [livePrivacy, setLivePrivacy] = useState<'public' | 'followers' | 'private'>('public');

  const loadSounds = useCallback(async () => {
    const { data, error } = await supabase
      .from('studio_sounds')
      .select('id, title, artist, cover_url, audio_url, duration, usage_count, created_at')
      .order('usage_count', { ascending: false })
      .limit(50);
    if (error) console.error('Sounds error:', error);
    setSounds(data || []);
  }, []);

  const loadLive = useCallback(async () => {
    const { data, error } = await supabase
      .from('studio_live_streams')
      .select(`
        id, title, creator_id, viewer_count, is_live, thumbnail_url, started_at,
        creator:user_profiles!studio_live_streams_creator_id_fkey(display_name, avatar_url)
      `)
      .eq('is_live', true)
      .order('viewer_count', { ascending: false })
      .limit(20);
    if (error) console.error('Live error:', error);
    setLiveStreams((data || []).map((s: any) => ({
      ...s,
      creator_name: s.creator?.display_name || 'Unknown',
      creator_avatar: s.creator?.avatar_url || null,
    })));
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSounds(), loadLive()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadSounds, loadLive]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const handleGoLive = async () => {
    if (!liveTitle.trim()) {
      Alert.alert('Title Required', 'Please enter a title for your live stream.');
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase.from('studio_live_streams').insert({
        title: liveTitle.trim(),
        creator_id: user.id,
        is_live: true,
        privacy: livePrivacy,
        viewer_count: 0,
      }).select().single();

      if (error) throw error;

      setShowGoLive(false);
      setLiveTitle('');
      router.push(`/streets/live/${data.id}`);
    } catch (e) {
      Alert.alert('Go Live Failed', String(e));
    }
  };

  const renderSoundItem = ({ item }: { item: Sound }) => (
    <TouchableOpacity
      onPress={() => router.push(`/streets/sound/${item.id}`)}
      style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}
    >
      {item.cover_url ? (
        <Image source={{ uri: item.cover_url }} style={{ width: 56, height: 56, borderRadius: 8 }} />
      ) : (
        <View style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="musical-note" size={24} color="#666" />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{item.title}</Text>
        <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{item.artist}</Text>
        <Text style={{ color: '#666', fontSize: 12, marginTop: 2 }}>{item.usage_count} uses · {Math.floor(item.duration / 60)}:{String(item.duration % 60).padStart(2, '0')}</Text>
      </View>
      <Ionicons name="play-circle" size={32} color="#00d4ff" />
    </TouchableOpacity>
  );

  const renderLiveItem = ({ item }: { item: LiveStream }) => (
    <TouchableOpacity
      onPress={() => router.push(`/streets/live/${item.id}`)}
      style={{ marginHorizontal: 16, marginBottom: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a' }}
    >
      {item.thumbnail_url ? (
        <Image source={{ uri: item.thumbnail_url }} style={{ width: width - 32, height: 180 }} resizeMode="cover" />
      ) : (
        <View style={{ width: width - 32, height: 180, backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="radio" size={48} color="#666" />
        </View>
      )}
      <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: '#ff3040', borderRadius: 4, paddingHorizontal: 8, paddingVertical: 4, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' }} />
        <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>LIVE</Text>
      </View>
      <View style={{ padding: 12 }}>
        <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8 }}>
          {item.creator_avatar ? (
            <Image source={{ uri: item.creator_avatar }} style={{ width: 24, height: 24, borderRadius: 12 }} />
          ) : (
            <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="person" size={12} color="#fff" />
            </View>
          )}
          <Text style={{ color: '#888', fontSize: 13 }}>{item.creator_name}</Text>
          <View style={{ flex: 1 }} />
          <Ionicons name="eye" size={14} color="#888" />
          <Text style={{ color: '#888', fontSize: 13 }}>{item.viewer_count}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12 }}>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>MTAA Studio</Text>
      </View>

      {/* Tabs */}
      <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#222', marginHorizontal: 16 }}>
        {(['sounds', 'live', 'tools'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderBottomWidth: activeTab === tab ? 2 : 0, borderBottomColor: '#00d4ff' }}
          >
            <Text style={{ color: activeTab === tab ? '#00d4ff' : '#888', fontSize: 15, fontWeight: activeTab === tab ? '700' : '400' }}>
              {tab === 'sounds' ? 'Sounds' : tab === 'live' ? 'Live' : 'Tools'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Go Live Button */}
      {activeTab === 'live' && (
        <TouchableOpacity
          onPress={() => setShowGoLive(true)}
          style={{
            backgroundColor: '#ff3040',
            borderRadius: 24,
            paddingVertical: 14,
            marginHorizontal: 16,
            marginVertical: 12,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name="radio" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Go Live</Text>
        </TouchableOpacity>
      )}

      {/* Content */}
      {activeTab === 'sounds' && (
        <FlatList
          data={sounds}
          keyExtractor={s => s.id}
          renderItem={renderSoundItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
          ListEmptyComponent={!loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <Ionicons name="musical-note" size={48} color="#333" />
              <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No sounds yet</Text>
            </View>
          ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
        />
      )}

      {activeTab === 'live' && (
        <FlatList
          data={liveStreams}
          keyExtractor={s => s.id}
          renderItem={renderLiveItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
          ListEmptyComponent={!loading ? (
            <View style={{ paddingTop: 60, alignItems: 'center' }}>
              <Ionicons name="radio" size={48} color="#333" />
              <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No live streams right now</Text>
              <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Be the first to go live!</Text>
            </View>
          ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
        />
      )}

      {activeTab === 'tools' && (
        <ScrollView style={{ padding: 16 }}>
          <TouchableOpacity onPress={() => router.push('/streets/dashboard')} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="stats-chart" size={28} color="#00d4ff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Creator Dashboard</Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Views, likes, revenue, growth</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/streets/search')} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="search" size={28} color="#00d4ff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Search</Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Find creators, sounds, posts</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/streets/notifications')} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="notifications" size={28} color="#00d4ff" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }}>Notifications</Text>
              <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>Likes, comments, tips, follows</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* Go Live Modal */}
      <Modal visible={showGoLive} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.9)', justifyContent: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700', marginBottom: 16 }}>Go Live</Text>
            <Text style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Stream Title</Text>
            <TextInput
              value={liveTitle}
              onChangeText={setLiveTitle}
              placeholder="What's your stream about?"
              placeholderTextColor="#666"
              style={{ color: '#fff', fontSize: 16, backgroundColor: '#222', borderRadius: 12, padding: 12, marginBottom: 16 }}
            />
            <Text style={{ color: '#888', fontSize: 14, marginBottom: 8 }}>Privacy</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {(['public', 'followers', 'private'] as const).map(p => (
                <TouchableOpacity
                  key={p}
                  onPress={() => setLivePrivacy(p)}
                  style={{
                    flex: 1,
                    backgroundColor: livePrivacy === p ? '#00d4ff' : '#222',
                    borderRadius: 8,
                    paddingVertical: 10,
                    alignItems: 'center',
                  }}
                >
                  <Text style={{ color: livePrivacy === p ? '#000' : '#fff', fontSize: 13, fontWeight: '600' }}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={handleGoLive} style={{ backgroundColor: '#ff3040', borderRadius: 24, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Start Live Stream</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowGoLive(false)} style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 14 }}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
