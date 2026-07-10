import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Image,
  Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Track {
  id: string;
  title: string;
  fileUri: string;
  fileName: string;
  duration: number;
  trackNumber: number;
}

interface MusicRelease {
  title: string;
  type: 'single' | 'ep' | 'album' | 'instrumental';
  coverArt: string | null;
  genre: string;
  releaseDate: string;
  description: string;
  composer: string;
  producer: string;
  lyrics: string;
  explicit: boolean;
  tracks: Track[];
}

const GENRES = ['Afrobeat', 'Benga', 'Gospel', 'Hip Hop', 'R&B', 'Reggae', 'Pop', 'Rock', 'Jazz', 'Classical', 'Electronic', 'Traditional', 'Other'];

export default function MusicUploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [release, setRelease] = useState<MusicRelease>({
    title: '',
    type: 'single',
    coverArt: null,
    genre: 'Afrobeat',
    releaseDate: new Date().toISOString().split('T')[0],
    description: '',
    composer: '',
    producer: '',
    lyrics: '',
    explicit: false,
    tracks: [],
  });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const updateRelease = (updates: Partial<MusicRelease>) => {
    setRelease(prev => ({ ...prev, ...updates }));
  };

  const pickCoverArt = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled && result.assets?.[0]) {
      updateRelease({ coverArt: result.assets[0].uri });
    }
  };

  const addTrack = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!result.canceled && result.assets?.[0]) {
      const newTrack: Track = {
        id: `track-${Date.now()}`,
        title: result.assets[0].name.replace(/\.[^/.]+$/, ''),
        fileUri: result.assets[0].uri,
        fileName: result.assets[0].name,
        duration: 0,
        trackNumber: release.tracks.length + 1,
      };
      updateRelease({ tracks: [...release.tracks, newTrack] });
    }
  };

  const updateTrack = (id: string, updates: Partial<Track>) => {
    updateRelease({
      tracks: release.tracks.map(t => t.id === id ? { ...t, ...updates } : t),
    });
  };

  const removeTrack = (id: string) => {
    updateRelease({
      tracks: release.tracks.filter(t => t.id !== id).map((t, idx) => ({ ...t, trackNumber: idx + 1 })),
    });
  };

  const uploadRelease = async () => {
    if (!user?.id) return;
    if (!release.title.trim()) {
      Alert.alert('Missing Title', 'Please enter a release title.');
      return;
    }
    if (release.tracks.length === 0) {
      Alert.alert('No Tracks', 'Please add at least one track.');
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload cover art
      let coverUrl = '';
      if (release.coverArt) {
        const response = await fetch(release.coverArt);
        const blob = await response.blob();
        const path = `${user.id}/music/covers/${Date.now()}.jpg`;
        await supabase.storage.from('mstudio-music').upload(path, blob);
        const { data } = supabase.storage.from('mstudio-music').getPublicUrl(path);
        coverUrl = data?.publicUrl || '';
      }
      setUploadProgress(30);

      // Insert release
      const { data: releaseData, error: releaseError } = await supabase.from('studio_music_releases').insert({
        creator_id: user.id,
        title: release.title,
        type: release.type,
        cover_art_url: coverUrl,
        genre: release.genre,
        release_date: release.releaseDate,
        description: release.description,
        composer: release.composer,
        producer: release.producer,
        lyrics: release.lyrics,
        explicit: release.explicit,
        track_count: release.tracks.length,
        status: 'published',
      }).select().single();

      if (releaseError) throw releaseError;
      setUploadProgress(50);

      // Upload tracks
      for (let i = 0; i < release.tracks.length; i++) {
        const track = release.tracks[i];
        const response = await fetch(track.fileUri);
        const blob = await response.blob();
        const path = `${user.id}/music/tracks/${Date.now()}-${track.id}.mp3`;
        await supabase.storage.from('mstudio-music').upload(path, blob);
        const { data: urlData } = supabase.storage.from('mstudio-music').getPublicUrl(path);

        await supabase.from('studio_music_tracks').insert({
          release_id: releaseData.id,
          creator_id: user.id,
          title: track.title,
          audio_url: urlData?.publicUrl || '',
          storage_path: path,
          track_number: track.trackNumber,
          duration_seconds: track.duration,
        });

        setUploadProgress(50 + Math.round((i + 1) / release.tracks.length * 40));
      }

      setUploadProgress(100);
      Alert.alert('Success', `${release.type.toUpperCase()} "${release.title}" published!`, [
        { text: 'View in Studio', onPress: () => router.push('/(os)/studio/creator-profile') },
        { text: 'Upload More', onPress: () => {
          setRelease({
            title: '', type: 'single', coverArt: null, genre: 'Afrobeat',
            releaseDate: new Date().toISOString().split('T')[0],
            description: '', composer: '', producer: '', lyrics: '', explicit: false, tracks: [],
          });
          setUploadProgress(0);
        }},
      ]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Upload Music</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Release Type */}
        <View style={{ padding: 16 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Release Type</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {(['single', 'ep', 'album', 'instrumental'] as const).map(type => (
              <TouchableOpacity
                key={type}
                onPress={() => updateRelease({ type })}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  backgroundColor: release.type === type ? '#ff0000' : '#1a1a1a',
                  alignItems: 'center',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12, fontWeight: '500', textTransform: 'capitalize' }}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Cover Art */}
        <TouchableOpacity onPress={pickCoverArt} style={{ marginHorizontal: 16, marginBottom: 16, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
          {release.coverArt ? (
            <Image source={{ uri: release.coverArt }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <>
              <Feather name="image" size={40} color="#444" />
              <Text style={{ color: '#666', marginTop: 8 }}>Tap to add cover art</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Title */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Title</Text>
          <TextInput
            value={release.title}
            onChangeText={text => updateRelease({ title: text })}
            placeholder="Release title"
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }}
          />
        </View>

        {/* Genre */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Genre</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {GENRES.map(g => (
              <TouchableOpacity
                key={g}
                onPress={() => updateRelease({ genre: g })}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 16,
                  marginRight: 8,
                  backgroundColor: release.genre === g ? '#ff0000' : '#1a1a1a',
                }}
              >
                <Text style={{ color: '#fff', fontSize: 12 }}>{g}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Credits */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Composer</Text>
          <TextInput
            value={release.composer}
            onChangeText={text => updateRelease({ composer: text })}
            placeholder="Composer name"
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, marginBottom: 8 }}
          />
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Producer</Text>
          <TextInput
            value={release.producer}
            onChangeText={text => updateRelease({ producer: text })}
            placeholder="Producer name"
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }}
          />
        </View>

        {/* Description */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Description</Text>
          <TextInput
            value={release.description}
            onChangeText={text => updateRelease({ description: text })}
            multiline
            numberOfLines={3}
            placeholder="About this release..."
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, textAlignVertical: 'top', minHeight: 80 }}
          />
        </View>

        {/* Lyrics */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Lyrics</Text>
          <TextInput
            value={release.lyrics}
            onChangeText={text => updateRelease({ lyrics: text })}
            multiline
            numberOfLines={5}
            placeholder="Paste lyrics here..."
            placeholderTextColor="#555"
            style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, textAlignVertical: 'top', minHeight: 120 }}
          />
        </View>

        {/* Tracks */}
        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Tracks ({release.tracks.length})</Text>
          {release.tracks.map(track => (
            <View key={track.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <Text style={{ color: '#666', fontSize: 12, width: 24 }}>{track.trackNumber}.</Text>
              <TextInput
                value={track.title}
                onChangeText={text => updateTrack(track.id, { title: text })}
                style={{ flex: 1, color: '#fff', fontSize: 14 }}
              />
              <TouchableOpacity onPress={() => removeTrack(track.id)}>
                <Feather name="x" size={18} color="#ff0000" />
              </TouchableOpacity>
            </View>
          ))}
          <TouchableOpacity
            onPress={addTrack}
            style={{ borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', borderRadius: 8, padding: 16, alignItems: 'center' }}
          >
            <Feather name="plus" size={20} color="#666" />
            <Text style={{ color: '#888', marginTop: 4, fontSize: 12 }}>Add Track</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Upload Button */}
      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
        {uploading && (
          <View style={{ marginBottom: 12 }}>
            <View style={{ height: 4, backgroundColor: '#1a1a1a', borderRadius: 2 }}>
              <View style={{ width: `${uploadProgress}%`, height: '100%', backgroundColor: '#ff0000', borderRadius: 2 }} />
            </View>
            <Text style={{ color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' }}>{uploadProgress}% uploaded</Text>
          </View>
        )}
        <TouchableOpacity
          onPress={uploadRelease}
          disabled={uploading}
          style={{ backgroundColor: uploading ? '#333' : '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}
        >
          {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="upload-cloud" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
            {uploading ? 'Publishing...' : `Publish ${release.type.toUpperCase()}`}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
