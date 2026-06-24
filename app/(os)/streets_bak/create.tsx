import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useStreets } from '@/lib/hooks/useStreets';

export default function CreatePostScreen() {
  const router = useRouter();
  const { submitPost, upload, loading } = useStreets();
  const [content, setContent] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | null>(null);
  const [isPublic, setIsPublic] = useState(true);

  const pickMedia = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType(asset.type === 'video' ? 'video' : 'image');
    }
  }, []);

  const uriToBlob = useCallback(async (uri: string): Promise<Blob> => {
    try {
      const response = await fetch(uri);
      if (response.ok) {
        return await response.blob();
      }
    } catch (e) {
      // fetch failed on file:// URI
    }

    if (uri.startsWith('data:')) {
      const res = await fetch(uri);
      return await res.blob();
    }

    return new Blob([''], { type: mediaType === 'video' ? 'video/mp4' : 'image/jpeg' });
  }, [mediaType]);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !mediaUri) {
      Alert.alert('Error', 'Please add content or media');
      return;
    }

    try {
      let mediaUrl: string | null = null;
      let finalMediaType: string | null = mediaType;

      if (mediaUri) {
        try {
          const blob = await uriToBlob(mediaUri);
          const fileName = mediaUri.split('/').pop()?.split('?')[0] ?? 'media';
          mediaUrl = await upload(blob, fileName);
        } catch (uploadErr: any) {
          console.warn('Media upload failed, posting without media:', uploadErr.message);
        }
      }

      await submitPost({
        content: content.trim(),
        media_url: mediaUrl,
        media_type: finalMediaType,
        is_public: isPublic,
      });

      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  }, [content, mediaUri, mediaType, isPublic, submitPost, upload, router, uriToBlob]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          style={[styles.postBtn, loading && styles.postBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's on your mind?"
        placeholderTextColor="#999"
        multiline
        value={content}
        onChangeText={setContent}
        maxLength={500}
      />

      {mediaUri && (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: mediaUri }} style={styles.mediaImage} />
          <TouchableOpacity
            style={styles.removeMedia}
            onPress={() => { setMediaUri(null); setMediaType(null); }}
          >
            <Ionicons name="close-circle" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.options}>
        <TouchableOpacity style={styles.optionBtn} onPress={pickMedia}>
          <Ionicons name="image-outline" size={24} color="#007AFF" />
          <Text style={styles.optionText}>Photo/Video</Text>
        </TouchableOpacity>

        <View style={styles.visibilityRow}>
          <Text style={styles.visibilityLabel}>Public</Text>
          <Switch
            value={isPublic}
            onValueChange={setIsPublic}
            trackColor={{ false: '#ccc', true: '#007AFF' }}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111' },
  postBtn: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mediaPreview: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaImage: { width: '100%', height: 200, backgroundColor: '#f5f5f5' },
  removeMedia: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 12,
  },
  options: { paddingHorizontal: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  optionBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  optionText: { fontSize: 15, color: '#007AFF' },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  visibilityLabel: { fontSize: 15, color: '#333' },
});
