import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Video, ResizeMode, Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');

interface SoundPost {
  id: string;
  user_id: string;
  content: string;
  media_url: string | null;
  media_type: 'video' | 'image' | 'text' | null;
  likes_count: number;
  comments_count: number;
  created_at: string;
  user?: {
    display_name: string | null;
    avatar_url: string | null;
  };
}

interface SoundDetail {
  id: string;
  title: string;
  artist: string;
  cover_url: string | null;
  audio_url: string;
  duration: number;
  usage_count: number;
}

export default function SoundDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [sound, setSound] = useState<SoundDetail | null>(null);
  const [posts, setPosts] = useState<SoundPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const soundRef = useRef<Audio.Sound | null>(null);

  const loadSound = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('studio_sounds')
      .select('id, title, artist, cover_url, audio_url, duration, usage_count')
      .eq('id', id)
      .single();
    if (error) { console.error('Sound load error:', error); return; }
    setSound(data);
  }, [id]);

  const loadPosts = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from('streets_posts')
      .select(`
        id, user_id, content, media_url, media_type,
        likes_count, comments_count, created_at,
        user:user_profiles!user_id(display_name, avatar_url)
      `)
      .eq('sound_id', id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) console.error('Posts error:', error);
    setPosts((data || []).map((p: any) => ({ ...p, user: Array.isArray(p.user) ? p.user[0] : p.user })));
  }, [id]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([loadSound(), loadPosts()]);
    setLoading(false);
    setRefreshing(false);
  }, [loadSound, loadPosts]);

  useEffect(() => {
    loadAll();
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
    };
  }, [loadAll]);

  const playSound = async () => {
    if (!sound?.audio_url) return;
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await soundRef.current.pauseAsync();
            setIsPlaying(false);
          } else {
            await soundRef.current.playAsync();
            setIsPlaying(true);
          }
          return;
        }
      }
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: sound.audio_url },
        { shouldPlay: true }
      );
      soundRef.current = newSound;
      setIsPlaying(true);
      newSound.setOnPlaybackStatusUpdate((status: any) => {
        if (status.didJustFinish) setIsPlaying(false);
      });
    } catch (e) {
      console.error('Audio error:', e);
    }
  };

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadAll();
  }, [loadAll]);

  const renderPost = ({ item }: { item: SoundPost }) => (
    <TouchableOpacity
      onPress={() => router.push(`/streets/post/${item.id}`)}
      style={{ width: width / 3 - 2, height: width / 3, margin: 1, backgroundColor: '#111' }}
    >
      {item.media_type === 'video' && item.media_url ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
          <Ionicons name="play-circle" size={28} color="#fff" />
        </View>
      ) : item.media_type === 'image' && item.media_url ? (
        <Image source={{ uri: item.media_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 4 }}>
          <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center' }} numberOfLines={3}>{item.content}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#fff" size="large" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {/* Sound Header */}
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 16 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {sound?.cover_url ? (
            <Image source={{ uri: sound.cover_url }} style={{ width: 100, height: 100, borderRadius: 12 }} />
          ) : (
            <View style={{ width: 100, height: 100, borderRadius: 12, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="musical-note" size={40} color="#666" />
            </View>
          )}
          <View style={{ marginLeft: 16, flex: 1 }}>
            <Text style={{ color: '#fff', fontSize: 20, fontWeight: '700' }}>{sound?.title || 'Unknown Sound'}</Text>
            <Text style={{ color: '#888', fontSize: 15, marginTop: 4 }}>{sound?.artist || 'Unknown Artist'}</Text>
            <Text style={{ color: '#666', fontSize: 13, marginTop: 8 }}>
              {sound?.usage_count || 0} videos · {Math.floor((sound?.duration || 0) / 60)}:{String((sound?.duration || 0) % 60).padStart(2, '0')}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={playSound}
          style={{
            backgroundColor: isPlaying ? '#ff3040' : '#00d4ff',
            borderRadius: 24,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 20,
            flexDirection: 'row',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#000" />
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 16 }}>{isPlaying ? 'Pause' : 'Play Sound'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/streets/feed')}
          style={{
            backgroundColor: '#1a1a1a',
            borderRadius: 24,
            paddingVertical: 14,
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>Use This Sound</Text>
        </TouchableOpacity>
      </View>

      {/* Posts Using This Sound */}
      <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700', paddingHorizontal: 16, paddingVertical: 12 }}>
        Videos Using This Sound
      </Text>

      <FlatList
        data={posts}
        keyExtractor={p => p.id}
        renderItem={renderPost}
        numColumns={3}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListEmptyComponent={!loading ? (
          <View style={{ paddingTop: 40, alignItems: 'center' }}>
            <Ionicons name="videocam" size={48} color="#333" />
            <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No videos yet</Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Be the first to use this sound!</Text>
          </View>
        ) : null}
      />
    </View>
  );
}
