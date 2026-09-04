import { useState } from 'react';
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, RefreshControl, ActivityIndicator, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface MusicRelease {
  id: string;
  title: string;
  cover_art_url: string;
  type: string;
  genre: string;
  creator_name: string;
  track_count: number;
}

interface Track {
  id: string;
  title: string;
  artist: string;
  cover: string;
  duration: string;
}

const GENRES = ['All', 'Afrobeat', 'Benga', 'Gospel', 'Hip Hop', 'R&B', 'Reggae', 'Pop', 'Traditional'];

export default function MusicFeedScreen() {
  const router = useRouter();
  const [releases, setReleases] = useState<MusicRelease[]>([]);
  const [trendingTracks, setTrendingTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState('All');

  const fetchMusic = async () => {
    setLoading(true);
    let query = supabase
      .from('studio_music_releases_with_creator')
      .select('id, title, cover_art_url, type, genre, track_count, creator_name')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(30);

    if (selectedGenre !== 'All') {
      query = query.eq('genre', selectedGenre);
    }

    const { data, error } = await query;

    if (!error) {
      setReleases((data || []).map((r: any) => ({
        id: r.id,
        title: r.title,
        cover_art_url: r.cover_art_url,
        type: r.type,
        genre: r.genre,
        creator_name: r.creator?.full_name || 'Unknown',
        track_count: r.track_count || 0,
      })));
    }

    // Mock trending tracks for now
    setTrendingTracks([
      { id: '1', title: 'Nairobi Nights', artist: 'The Beats', cover: '', duration: '3:42' },
      { id: '2', title: 'Mombasa Vibes', artist: 'Coastal Sound', cover: '', duration: '4:15' },
      { id: '3', title: 'Maisha Mazuri', artist: 'Afro Fusion', cover: '', duration: '3:28' },
      { id: '4', title: 'Kisumu Sunset', artist: 'Lake Beat', cover: '', duration: '3:55' },
      { id: '5', title: 'Nakuru Dreams', artist: 'Rift Valley', cover: '', duration: '4:02' },
    ]);

    setLoading(false);
  };

  useEffect(() => { fetchMusic(); }, [selectedGenre]);

  const renderRelease = ({ item }: { item: MusicRelease }) => (
    <TouchableOpacity
      onPress={() => router.push(`/(os)/studio/music-player?id=${item.id}` as any)}
      style={{ width: 150, marginRight: 12 }}
    >
      <View style={{ width: 150, height: 150, borderRadius: 8, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
        {item.cover_art_url ? (
          <Image source={{ uri: item.cover_art_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="music" size={32} color="#444" />
          </View>
        )}
        <View style={{ position: 'absolute', bottom: 6, right: 6, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
          <Text style={{ color: '#fff', fontSize: 10, fontWeight: '600' }}>{item.type.toUpperCase()}</Text>
        </View>
      </View>
      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500', marginTop: 8 }} numberOfLines={1}>{item.title}</Text>
      <Text style={{ color: '#888', fontSize: 11 }}>{item.creator_name}</Text>
      <Text style={{ color: '#666', fontSize: 10 }}>{item.track_count} tracks • {item.genre}</Text>
    </TouchableOpacity>
  );

  const renderTrack = ({ item, index }: { item: Track; index: number }) => (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', padding: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
      <Text style={{ color: '#666', fontSize: 14, width: 28 }}>{index + 1}</Text>
      <View style={{ width: 44, height: 44, borderRadius: 6, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="music" size={18} color="#444" />
      </View>
      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }}>{item.title}</Text>
        <Text style={{ color: '#888', fontSize: 11 }}>{item.artist}</Text>
      </View>
      <Text style={{ color: '#666', fontSize: 12 }}>{item.duration}</Text>
      <TouchableOpacity style={{ marginLeft: 12, padding: 8 }}>
        <Feather name="more-vertical" size={16} color="#888" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Music</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/studio/music-upload' as any)}>
          <Feather name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Genre Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ paddingHorizontal: 12, marginBottom: 16 }}>
          {GENRES.map((g: any) => (
            <TouchableOpacity
              key={g}
              onPress={() => setSelectedGenre(g)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 16,
                marginRight: 8,
                backgroundColor: selectedGenre === g ? '#ff0000' : '#1a1a1a',
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>{g}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* New Releases */}
        <View style={{ marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, marginBottom: 12 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>New Releases</Text>
            <TouchableOpacity>
              <Text style={{ color: '#ff0000', fontSize: 12 }}>See All</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <ActivityIndicator size="small" color="#ff0000" style={{ marginLeft: 16 }} />
          ) : (
            <FlatList
              data={releases}
              keyExtractor={item => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16 }}
              renderItem={renderRelease}
              ListEmptyComponent={
                <View style={{ width: 200, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
                  <Feather name="music" size={32} color="#333" />
                  <Text style={{ color: '#666', marginTop: 8 }}>No releases yet</Text>
                </View>
              }
            />
          )}
        </View>

        {/* Trending Tracks */}
        <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 12 }}>Trending Now</Text>
        </View>
        <FlatList
          data={trendingTracks}
          keyExtractor={item => item.id}
          renderItem={renderTrack}
          scrollEnabled={false}
        />

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}
