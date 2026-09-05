import React, { useState } from 'react';
import { Alert, View, Text, ScrollView, TouchableOpacity, TextInput, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface PodcastEpisode {
  id: string;
  title: string;
  description: string;
  fileUri: string;
  fileName: string;
  duration: number;
  episodeNumber: number;
  guests: string;
  transcript: string;
}

interface Podcast {
  title: string;
  description: string;
  coverArt: string | null;
  category: string;
  language: string;
  explicit: boolean;
  episodes: PodcastEpisode[];
}

const CATEGORIES = ['Technology', 'Business', 'Comedy', 'Education', 'Health', 'News', 'Sports', 'True Crime', 'Music', 'Arts', 'Science', 'Other'];
const LANGUAGES = ['English', 'Swahili', 'French', 'Portuguese', 'Arabic', 'Other'];

export default function PodcastUploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [podcast, setPodcast] = useState<Podcast>({
    title: '',
    description: '',
    coverArt: null,
    category: 'Technology',
    language: 'English',
    explicit: false,
    episodes: [],
  });
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const updatePodcast = (updates: Partial<Podcast>) => setPodcast(prev => ({ ...prev, ...updates }));

  const pickCover = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'image/*' });
    if (!result.canceled && result.assets?.[0]) updatePodcast({ coverArt: result.assets[0].uri });
  };

  const addEpisode = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: 'audio/*' });
    if (!result.canceled && result.assets?.[0]) {
      const newEp: PodcastEpisode = {
        id: `ep-${Date.now()}`,
        title: result.assets[0].name.replace(/\.[^/.]+$/, ''),
        description: '',
        fileUri: result.assets[0].uri,
        fileName: result.assets[0].name,
        duration: 0,
        episodeNumber: podcast.episodes.length + 1,
        guests: '',
        transcript: '',
      };
      updatePodcast({ episodes: [...podcast.episodes, newEp] });
    }
  };

  const updateEpisode = (id: string, updates: Partial<PodcastEpisode>) => {
    updatePodcast({ episodes: podcast.episodes.map((e: any) => e.id === id ? { ...e, ...updates } : e) });
  };

  const removeEpisode = (id: string) => {
    updatePodcast({
      episodes: podcast.episodes.filter((e: any) => e.id !== id).map((e, idx) => ({ ...e, episodeNumber: idx + 1 })),
    });
  };

  const uploadPodcast = async () => {
    if (!user?.id || !podcast.title.trim()) {
      Alert.alert('Missing Info', 'Please enter a podcast title.');
      return;
    }
    if (podcast.episodes.length === 0) {
      Alert.alert('No Episodes', 'Add at least one episode.');
      return;
    }

    setUploading(true);
    setProgress(10);

    try {
      let coverUrl = '';
      if (podcast.coverArt) {
        const response = await fetch(podcast.coverArt);
        const blob = await response.blob();
        const path = `${user.id}/podcasts/covers/${Date.now()}.jpg`;
        await supabase.storage.from('mstudio-podcasts').upload(path, blob);
        const { data } = supabase.storage.from('mstudio-podcasts').getPublicUrl(path);
        coverUrl = data?.publicUrl || '';
      }
      setProgress(25);

      const { data: podcastData, error } = await supabase.from('studio_podcasts').insert({
        creator_id: user.id,
        title: podcast.title,
        description: podcast.description,
        cover_art_url: coverUrl,
        category: podcast.category,
        language: podcast.language,
        explicit: podcast.explicit,
        episode_count: podcast.episodes.length,
        status: 'published',
      }).select().single();

      if (error) throw error;
      setProgress(40);

      for (let i = 0; i < podcast.episodes.length; i++) {
        const ep = podcast.episodes[i];
        const response = await fetch(ep.fileUri);
        const blob = await response.blob();
        const path = `${user.id}/podcasts/episodes/${Date.now()}-${ep.id}.mp3`;
        await supabase.storage.from('mstudio-podcasts').upload(path, blob);
        const { data: urlData } = supabase.storage.from('mstudio-podcasts').getPublicUrl(path);

        await supabase.from('studio_podcast_episodes').insert({
          podcast_id: podcastData.id,
          creator_id: user.id,
          title: ep.title,
          description: ep.description,
          audio_url: urlData?.publicUrl || '',
          storage_path: path,
          episode_number: ep.episodeNumber,
          duration_seconds: ep.duration,
          guests: ep.guests.split(',').map((g: any) => g.trim()).filter(Boolean),
          transcript: ep.transcript,
        });

        setProgress(40 + Math.round((i + 1) / podcast.episodes.length * 50));
      }

      setProgress(100);
      Alert.alert('Success', `Podcast "${podcast.title}" published!`, [
        { text: 'View in Studio', onPress: () => router.push('/(os)/studio/creator-profile' as any) },
      ]);
    } catch (err: any) {
      Alert.alert('Upload Failed', err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Upload Podcast</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={pickCover} style={{ margin: 16, aspectRatio: 1, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
          {podcast.coverArt ? <Image source={{ uri: podcast.coverArt }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <><Feather name="image" size={40} color="#444" /><Text style={{ color: '#666', marginTop: 8 }}>Podcast Cover Art</Text></>}
        </TouchableOpacity>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Podcast Title</Text>
          <TextInput value={podcast.title} onChangeText={t => updatePodcast({ title: t })} placeholder="Podcast name" placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14 }} />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Description</Text>
          <TextInput value={podcast.description} onChangeText={t => updatePodcast({ description: t })} multiline numberOfLines={3} placeholder="What is this podcast about?" placeholderTextColor="#555" style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, textAlignVertical: 'top', minHeight: 80 }} />
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {CATEGORIES.map((c: any) => (
              <TouchableOpacity key={c} onPress={() => updatePodcast({ category: c })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: podcast.category === c ? '#ff0000' : '#1a1a1a' }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{c}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 6 }}>Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {LANGUAGES.map((l: any) => (
              <TouchableOpacity key={l} onPress={() => updatePodcast({ language: l })} style={{ paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8, backgroundColor: podcast.language === l ? '#ff0000' : '#1a1a1a' }}>
                <Text style={{ color: '#fff', fontSize: 12 }}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
          <Text style={{ color: '#888', fontSize: 12, marginBottom: 8 }}>Episodes ({podcast.episodes.length})</Text>
          {podcast.episodes.map((ep: any) => (
            <View key={ep.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Text style={{ color: '#666', fontSize: 12, width: 28 }}>Ep {ep.episodeNumber}</Text>
                <TextInput value={ep.title} onChangeText={t => updateEpisode(ep.id, { title: t })} style={{ flex: 1, color: '#fff', fontSize: 14 }} />
                <TouchableOpacity onPress={() => removeEpisode(ep.id)}><Feather name="x" size={18} color="#ff0000" /></TouchableOpacity>
              </View>
              <TextInput value={ep.description} onChangeText={t => updateEpisode(ep.id, { description: t })} placeholder="Episode description" placeholderTextColor="#555" style={{ backgroundColor: '#111', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12, marginBottom: 6 }} />
              <TextInput value={ep.guests} onChangeText={t => updateEpisode(ep.id, { guests: t })} placeholder="Guests (comma separated)" placeholderTextColor="#555" style={{ backgroundColor: '#111', borderRadius: 6, padding: 8, color: '#fff', fontSize: 12 }} />
            </View>
          ))}
          <TouchableOpacity onPress={addEpisode} style={{ borderWidth: 1, borderColor: '#333', borderStyle: 'dashed', borderRadius: 8, padding: 16, alignItems: 'center' }}>
            <Feather name="plus" size={20} color="#666" />
            <Text style={{ color: '#888', marginTop: 4, fontSize: 12 }}>Add Episode</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' }}>
        {uploading && <View style={{ marginBottom: 12 }}><View style={{ height: 4, backgroundColor: '#1a1a1a', borderRadius: 2 }}><View style={{ width: `${progress}%`, height: '100%', backgroundColor: '#ff0000', borderRadius: 2 }} /></View><Text style={{ color: '#888', fontSize: 11, marginTop: 4, textAlign: 'center' }}>{progress}% uploaded</Text></View>}
        <TouchableOpacity onPress={uploadPodcast} disabled={uploading} style={{ backgroundColor: uploading ? '#333' : '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 }}>
          {uploading ? <ActivityIndicator size="small" color="#fff" /> : <Feather name="upload-cloud" size={18} color="#fff" />}
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{uploading ? 'Publishing...' : 'Publish Podcast'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
