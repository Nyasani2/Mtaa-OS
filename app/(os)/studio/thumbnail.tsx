import React, { useState } from 'react';
import { Alert, View, Text, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useMThumbnails } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioThumbnailScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const { user } = useAuthStore();
  const { thumbnails, load, create, loading } = useMThumbnails(videoId);
  const [generating, setGenerating] = useState(false);

  React.useEffect(() => {
    if (videoId) load();
  }, [videoId]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]?.uri && videoId && user?.id) {
      await create({ video_id: videoId, user_id: user.id, image_url: result.assets[0].uri, is_ai_generated: false });
      load();
    }
  };

  const generateAI = async () => {
    setGenerating(true);
    // In production: call ASIS/Kimi API to generate thumbnail
    setTimeout(() => {
      setGenerating(false);
      Alert.alert('AI Generated', 'Thumbnail generated successfully');
    }, 2000);
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <View style={{ padding: 16, paddingTop: 48 }}>
        <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Thumbnails</Text>

        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 20 }}>
          <TouchableOpacity onPress={pickImage} style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#333' }}>
            <Text style={{ color: '#fff', fontWeight: '600' }}>📁 Upload</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={generateAI} disabled={generating} style={{ flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#ff000044' }}>
            <Text style={{ color: generating ? '#666' : '#ff6b6b', fontWeight: '600' }}>{generating ? 'Generating...' : '🤖 AI Generate'}</Text>
          </TouchableOpacity>
        </View>

        {thumbnails.map((thumb) => (
          <View key={thumb.id} style={{ marginBottom: 16, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1a1a1a' }}>
            <Image source={{ uri: thumb.image_url }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
            <View style={{ padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ color: '#888', fontSize: 12 }}>{thumb.is_ai_generated ? '🤖 AI Generated' : '📁 Uploaded'}</Text>
              {thumb.is_selected && (
                <View style={{ backgroundColor: '#ff0000', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 }}>
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: 'bold' }}>SELECTED</Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {thumbnails.length === 0 && (
          <Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No thumbnails yet. Upload or generate one.</Text>
        )}
      </View>
    </ScrollView>
  );
}
