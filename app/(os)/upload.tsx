// app/(os)/upload/index.tsx
// FIXED: Uses creator_id (not user_id)

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/useAuthStore';

export default function UploadScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const videoRef = useRef<Video>(null);

  const pickMedia = async (type: 'image' | 'video') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission Required', 'Please allow access to your media library');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: type === 'image' 
        ? ImagePicker.MediaTypeOptions.Images 
        : ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setMediaUri(result.assets[0].uri);
      setMediaType(type);

      if (type === 'video') {
        generateThumbnail(result.assets[0].uri);
      }
    }
  };

  const generateThumbnail = async (videoUri: string) => {
    try {
      if (Platform.OS === 'web') {
        const video = document.createElement('video');
        video.src = videoUri;
        video.crossOrigin = 'anonymous';
        video.currentTime = 1;

        await new Promise<void>((resolve) => {
          video.onloadeddata = () => resolve();
          video.onerror = () => resolve();
        });

        const canvas = document.createElement('canvas');
        canvas.width = 480;
        canvas.height = 640;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setThumbnailUri(dataUrl);
      } else {
        const { status } = await Video.createThumbnailAsync(videoUri, { time: 1000 });
        if (status === 'success') {
          setThumbnailUri(status.uri);
        }
      }
    } catch (err) {
      console.error('Thumbnail generation failed:', err);
    }
  };

  const uploadToStorage = async (uri: string, path: string): Promise<string> => {
    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('content')
      .upload(path, blob, {
        contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: true,
      });

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('content')
      .getPublicUrl(data.path);

    return publicUrl;
  };

  const handleUpload = async () => {
    if (!mediaUri || !user?.id) {
      Alert.alert('Error', 'Please select media first');
      return;
    }

    setUploading(true);

    try {
      const timestamp = Date.now();
      const fileExt = mediaType === 'video' ? 'mp4' : 'jpg';
      const mediaPath = `${user.id}/${timestamp}.${fileExt}`;

      const mediaUrl = await uploadToStorage(mediaUri, mediaPath);

      let thumbnailUrl = null;
      if (thumbnailUri) {
        const thumbPath = `${user.id}/${timestamp}_thumb.jpg`;
        thumbnailUrl = await uploadToStorage(thumbnailUri, thumbPath);
      }

      const { error: dbError } = await supabase
        .from('streets_posts')
        .insert({
          creator_id: user.id,
          media_url: mediaUrl,
          thumbnail_url: thumbnailUrl,
          media_type: mediaType,
          caption: caption || null,
        });

      if (dbError) throw dbError;

      Alert.alert('Success', 'Post uploaded!');
      router.back();
    } catch (err: any) {
      console.error('Upload error:', err);
      Alert.alert('Upload Failed', err.message || 'Something went wrong');
    } finally {
      setUploading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Create Post</Text>

      <View style={styles.previewContainer}>
        {mediaUri ? (
          mediaType === 'video' ? (
            <Video
              ref={videoRef}
              source={{ uri: mediaUri }}
              style={styles.preview}
              resizeMode="cover"
              useNativeControls
              isLooping
            />
          ) : (
            <Image source={{ uri: mediaUri }} style={styles.preview} resizeMode="cover" />
          )
        ) : (
          <View style={styles.previewPlaceholder}>
            <Ionicons name="images-outline" size={48} color="#6b7280" />
            <Text style={styles.previewText}>Select media to upload</Text>
          </View>
        )}
      </View>

      <View style={styles.typeRow}>
        <TouchableOpacity 
          style={[styles.typeBtn, mediaType === 'image' && styles.typeBtnActive]}
          onPress={() => pickMedia('image')}
        >
          <Ionicons name="image" size={20} color={mediaType === 'image' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.typeText, mediaType === 'image' && styles.typeTextActive]}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.typeBtn, mediaType === 'video' && styles.typeBtnActive]}
          onPress={() => pickMedia('video')}
        >
          <Ionicons name="videocam" size={20} color={mediaType === 'video' ? '#6366f1' : '#9ca3af'} />
          <Text style={[styles.typeText, mediaType === 'video' && styles.typeTextActive]}>Video</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.captionInput}
        placeholder="Write a caption..."
        placeholderTextColor="#6b7280"
        value={caption}
        onChangeText={setCaption}
        multiline
        maxLength={500}
      />
      <Text style={styles.charCount}>{caption.length}/500</Text>

      <TouchableOpacity 
        style={[styles.uploadBtn, (!mediaUri || uploading) && styles.uploadBtnDisabled]}
        onPress={handleUpload}
        disabled={!mediaUri || uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadBtnText}>Post to Pulse</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f0f' },
  content: { padding: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#fff', marginBottom: 16 },

  previewContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#1f1f1f',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  preview: { width: '100%', height: '100%' },
  previewPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: { color: '#6b7280', marginTop: 8, fontSize: 14 },

  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  typeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  typeBtnActive: { borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)' },
  typeText: { color: '#9ca3af', fontWeight: '600' },
  typeTextActive: { color: '#6366f1' },

  captionInput: {
    backgroundColor: '#1f1f1f',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#374151',
  },
  charCount: { color: '#6b7280', fontSize: 12, textAlign: 'right', marginTop: 4, marginBottom: 16 },

  uploadBtn: {
    backgroundColor: '#6366f1',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  uploadBtnDisabled: { backgroundColor: '#374151' },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
