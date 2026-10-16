import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { uploadMedia, createPost } from '@/lib/services/streets-service';

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets?.[0]) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handlePost = async () => {
    if (!content.trim() && !selectedFile) {
      Alert.alert('Error', 'Add text or select media.');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in.');
      return;
    }

    setUploading(true);
    try {
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (selectedFile) {
        const up = await uploadMedia(
          { uri: selectedFile.uri, name: selectedFile.fileName || 'post.jpg', type: selectedFile.type || 'image/jpeg' },
          user.id
        );
        mediaUrl = up.url;
        thumbnailUrl = up.thumbnailUrl;
      }

      await createPost({
        creatorId: user.id,
        content: content.trim(),
        mediaUrl,
        thumbnailUrl,
        mediaType: selectedFile?.type?.startsWith('video') ? 'video' : 'image',
        isPublic,
      });

      Alert.alert('Success', 'Post published!');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0f172a' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 50, borderBottomWidth: 1, borderBottomColor: '#1e293b' }}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: '700' }}>New Post</Text>
        <TouchableOpacity onPress={handlePost} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#3b82f6', fontWeight: '700' }}>Post</Text>}
        </TouchableOpacity>
      </View>

      <View style={{ padding: 16 }}>
        <TextInput
          placeholder="What's on your mind?"
          placeholderTextColor="#64748b"
          value={content}
          onChangeText={setContent}
          multiline
          style={{ color: '#fff', fontSize: 16, minHeight: 120 }}
        />
        
        {selectedFile && (
          <View style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#1e293b', padding: 12, borderRadius: 8 }}>
            <Text style={{ color: '#fff', flex: 1 }} numberOfLines={1}>{selectedFile.fileName || 'Media selected'}</Text>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <Ionicons name="close-circle" size={24} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity onPress={pickMedia} style={{ marginLeft: 8 }}>
              <Ionicons name="refresh" size={24} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        )}

        {!selectedFile && (
          <TouchableOpacity onPress={pickMedia} style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderWidth: 1, borderColor: '#334155', borderRadius: 8, borderStyle: 'dashed' }}>
            <Ionicons name="image-outline" size={24} color="#94a3b8" />
            <Text style={{ color: '#94a3b8', marginLeft: 8 }}>Add Photo/Video</Text>
          </TouchableOpacity>
        )}

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, padding: 16, backgroundColor: '#1e293b', borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontSize: 15 }}>Public Post</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} trackColor={{ false: '#334155', true: '#3b82f6' }} thumbColor="#fff" />
        </View>
      </View>
    </ScrollView>
);
}
