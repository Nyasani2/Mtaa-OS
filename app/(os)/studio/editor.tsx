import { Alert, useState } from 'react';
// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { Alert, View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, useMProjects, useMVideos } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioEditorScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { user } = useAuthStore();
  const { data: project, loadOne, create, update, scenes, setScenes, loading } = useMProjects();
  const { data: video, loadOne: loadVideo } = useMVideos();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('draft');

  useEffect(() => {
    if (videoId) {
      loadVideo(videoId);
      // Try to load associated project
    }
  }, [videoId]);

  useEffect(() => {
    if (video) {
      setTitle(video.title || '');
      setDescription(video.description || '');
      setTags(video.tags?.join(', ') || '');
      setVisibility(video.visibility || 'draft');
    }
  }, [video]);

  const handleSave = async () => {
    if (!user?.id) return;
    const updates = { title, description, tags: tags.split(',').map((t: any) => t.trim()).filter(Boolean), visibility };
    if (videoId) {
      await update(videoId, updates);
      Alert.alert('Saved', 'Video updated successfully');
    } else {
      const newVideo = await create({ ...updates, user_id: user.id, studio_id: user.id });
      if (newVideo) router.push(`/(os)/studio/editor?videoId=${newVideo.id}` as any);
    }
  };

  const handlePublish = async () => {
    if (!videoId) return;
    await update(videoId, { visibility: 'public', published_at: new Date().toISOString(), processing_status: 'ready' });
    Alert.alert('Published', 'Your video is now live!');
    router.push('/(os)/studio/dashboard' as any);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>{videoId ? 'Edit Video' : 'New Video'}</Text>

        <Label>Title</Label>
        <TextInput value={title} onChangeText={setTitle} placeholder="Enter video title" placeholderTextColor="#555" style={inputStyle} />

        <Label>Description</Label>
        <TextInput value={description} onChangeText={setDescription} placeholder="Describe your video..." placeholderTextColor="#555" multiline numberOfLines={4} style={[inputStyle, { height: 100, textAlignVertical: 'top' }]} />

        <Label>Tags (comma separated)</Label>
        <TextInput value={tags} onChangeText={setTags} placeholder="music, tutorial, vlog" placeholderTextColor="#555" style={inputStyle} />

        <Label>Visibility</Label>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          {['draft', 'public', 'unlisted', 'scheduled'].map((v: any) => (
            <TouchableOpacity key={v} onPress={() => setVisibility(v)} style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: visibility === v ? '#ff0000' : '#1a1a1a' }}>
              <Text style={{ color: '#fff', fontSize: 13, textTransform: 'capitalize' }}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Scene Editor Placeholder */}
        {videoId && (
          <View style={{ marginTop: 16 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 8 }}>Scenes</Text>
            {scenes.length === 0 ? (
              <TouchableOpacity onPress={() => router.push(`/(os)/studio/scenes?projectId=${videoId}` as any)} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#888', fontSize: 14 }}>+ Add Scenes</Text>
              </TouchableOpacity>
            ) : (
              scenes.map((scene: any, i: number) => (
                <View key={scene.id || i} style={{ backgroundColor: '#1a1a1a', borderRadius: 8, padding: 12, marginBottom: 8 }}>
                  <Text style={{ color: '#fff' }}>Scene {i + 1}: {scene.title || 'Untitled'}</Text>
                  <Text style={{ color: '#888', fontSize: 12 }}>{scene.start_time}s - {scene.end_time}s</Text>
                </View>
              ))
            )}
          </View>
        )}

        {/* Actions */}
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 24 }}>
          <TouchableOpacity onPress={handleSave} style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>Save Draft</Text>
          </TouchableOpacity>
          {videoId && (
            <TouchableOpacity onPress={handlePublish} style={{ flex: 1, backgroundColor: '#ff0000', borderRadius: 12, padding: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Publish</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

function Label({ children }: { children: string }) {
  return <Text style={{ color: '#888', fontSize: 12, marginBottom: 6, marginTop: 12, textTransform: 'uppercase' }}>{children}</Text>;
}

const inputStyle = { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff', fontSize: 14 };
