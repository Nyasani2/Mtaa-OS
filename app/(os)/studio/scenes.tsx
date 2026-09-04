import React, { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Alert, useMProjects } from '@/lib/services/mstudio-hooks';

export default function StudioScenesScreen() {
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { scenes, setScenes, loadOne } = useMProjects();
  const [newSceneTitle, setNewSceneTitle] = useState('');

  React.useEffect(() => {
    if (projectId) loadOne(projectId);
  }, [projectId]);

  const addScene = () => {
    if (!newSceneTitle.trim()) return;
    const newScene = {
      id: `temp_${Date.now()}`,
      scene_order: scenes.length,
      title: newSceneTitle,
      start_time: 0,
      end_time: 10,
      media_type: 'video',
    };
    setScenes([...scenes, newScene]);
    setNewSceneTitle('');
  };

  const detectScenes = () => {
    Alert.alert('AI Scene Detection', 'Analyzing video for scene cuts...');
    // In production: call AI service via ASIS
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Scene Editor</Text>

        <TouchableOpacity onPress={detectScenes} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, alignItems: 'center', marginBottom: 16, borderWidth: 1, borderColor: '#ff000044' }}>
          <Text style={{ color: '#ff6b6b', fontWeight: '600' }}>🤖 Auto-Detect Scenes</Text>
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
          <TextInput
            value={newSceneTitle}
            onChangeText={setNewSceneTitle}
            placeholder="New scene title..."
            placeholderTextColor="#555"
            style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 10, padding: 12, color: '#fff' }}
          />
          <TouchableOpacity onPress={addScene} style={{ backgroundColor: '#ff0000', borderRadius: 10, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>+</Text>
          </TouchableOpacity>
        </View>

        {scenes.map((scene: any, index: number) => (
          <View key={scene.id} style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 14, marginBottom: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Scene {index + 1}: {scene.title || 'Untitled'}</Text>
              <Text style={{ color: '#888', fontSize: 12 }}>{scene.start_time}s - {scene.end_time}s</Text>
            </View>
            {scene.ai_detected_scenes?.length > 0 && (
              <Text style={{ color: '#ff6b6b', fontSize: 11, marginTop: 4 }}>AI detected {scene.ai_detected_scenes.length} sub-scenes</Text>
            )}
          </View>
        ))}

        {scenes.length === 0 && (
          <Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No scenes yet. Add your first scene above.</Text>
        )}
      </View>
    </ScrollView>
  );
}
