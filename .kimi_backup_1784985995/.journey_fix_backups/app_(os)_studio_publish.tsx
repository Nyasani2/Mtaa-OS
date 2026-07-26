import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMVideos } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioPublishScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { user } = useAuthStore();
  const { data: video, loadOne, update, loading } = useMVideos();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [category, setCategory] = useState('');
  const [isMonetized, setIsMonetized] = useState(false);
  const [isAgeRestricted, setIsAgeRestricted] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');

  React.useEffect(() => {
    if (videoId) loadOne(videoId);
  }, [videoId]);

  React.useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setTags(video.tags?.join(', ') || '');
      setCategory(video.category || '');
      setIsMonetized(video.monetization_enabled || false);
      setIsAgeRestricted(video.is_age_restricted || false);
      setScheduledAt(video.scheduled_at || '');
    }
  }, [video]);

  const handlePublish = async () => {
    if (!videoId || !user?.id) return;
    await update(videoId, {
      title, description,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      category, monetization_enabled: isMonetized,
      is_age_restricted: isAgeRestricted,
      visibility: scheduledAt ? 'scheduled' : 'public',
      scheduled_at: scheduledAt || null,
      published_at: scheduledAt ? null : new Date().toISOString(),
      processing_status: 'ready',
    });
    Alert.alert('Published', scheduledAt ? 'Video scheduled!' : 'Video is now live!');
    router.push('/(os)/studio/dashboard');
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Publish Video</Text>

        <Label>Title</Label>
        <TextInput value={title} onChangeText={setTitle} placeholder="Title" placeholderTextColor="#555" style={input} />

        <Label>Description</Label>
        <TextInput value={description} onChangeText={setDescription} placeholder="Description" placeholderTextColor="#555" multiline numberOfLines={4} style={[input, { height: 100, textAlignVertical: 'top' }]} />

        <Label>Tags</Label>
        <TextInput value={tags} onChangeText={setTags} placeholder="tag1, tag2, tag3" placeholderTextColor="#555" style={input} />

        <Label>Category</Label>
        <TextInput value={category} onChangeText={setCategory} placeholder="e.g. Music, Gaming, Education" placeholderTextColor="#555" style={input} />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: '#fff' }}>Enable Monetization</Text>
          <Switch value={isMonetized} onValueChange={setIsMonetized} trackColor={{ false: '#333', true: '#ff0000' }} />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={{ color: '#fff' }}>Age Restricted</Text>
          <Switch value={isAgeRestricted} onValueChange={setIsAgeRestricted} trackColor={{ false: '#333', true: '#ff0000' }} />
        </View>

        <Label>Schedule (optional, ISO format)</Label>
        <TextInput value={scheduledAt} onChangeText={setScheduledAt} placeholder="2026-07-10T10:00:00Z" placeholderTextColor="#555" style={input} />

        <TouchableOpacity onPress={handlePublish} style={{ backgroundColor: '#ff0000', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 24 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{scheduledAt ? 'Schedule' : 'Publish Now'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12, textTransform: 'uppercase' }}>{children}</Text>;
}

const input = { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14 };
