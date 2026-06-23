import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Switch,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { X, Image as ImageIcon, Video, MapPin, Hash, Send } from 'lucide-react-native';
import { createPost, uploadMedia } from '@/lib/services/streets-service';

export default function CreateScreen() {
  const router = useRouter();
  const [content, setContent] = useState('');
  const [mediaAsset, setMediaAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');

  const pickMedia = useCallback(async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video' 
          ? ImagePicker.MediaTypeOptions.Videos 
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        setMediaAsset(result.assets[0]);
      }
    } catch (err) {
      console.error('[CreateScreen] Pick media error:', err);
      Alert.alert('Error', 'Failed to pick media');
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !mediaAsset) {
      Alert.alert('Error', 'Please add some content or media');
      return;
    }

    setIsLoading(true);
    try {
      let uploadedUrl: string | null = null;
      let mediaType: 'image' | 'video' | 'text' = 'text';

      if (mediaAsset) {
        console.log('[CreateScreen] Uploading media...');

        let fileToUpload: any;

        if (Platform.OS === 'web') {
          // FIX: Use the File object directly if available (expo-image-picker web >= 16)
          // Otherwise fetch the blob URL and create a proper File
          const asset: any = mediaAsset;
          if (asset.file instanceof File) {
            fileToUpload = asset.file;
            console.log('[CreateScreen] Using picker File directly:', fileToUpload.name);
          } else {
            const response = await fetch(mediaAsset.uri);
            const blob = await response.blob();
            const ext = mediaAsset.type === 'video' ? 'mp4' : 'jpg';
            const mimeType = mediaAsset.type === 'video' ? 'video/mp4' : 'image/jpeg';
            fileToUpload = new File([blob], `media_${Date.now()}.${ext}`, { type: mimeType });
            console.log('[CreateScreen] Created File from blob:', fileToUpload.name, fileToUpload.type);
          }
        } else {
          fileToUpload = {
            uri: mediaAsset.uri,
            type: mediaAsset.type === 'video' ? 'video/mp4' : 'image/jpeg',
            name: mediaAsset.fileName || `media_${Date.now()}.${mediaAsset.type === 'video' ? 'mp4' : 'jpg'}`,
          };
        }

        uploadedUrl = await uploadMedia(fileToUpload, 'media');
        mediaType = mediaAsset.type === 'video' ? 'video' : 'image';
        console.log('[CreateScreen] Upload success:', uploadedUrl?.substring(0, 60));
      }

      console.log('[CreateScreen] Creating post...');
      await createPost({
        content: content.trim(),
        media_url: uploadedUrl || undefined,
        media_type: mediaType,
        is_public: isPublic,
      });

      console.log('[CreateScreen] Post created successfully');
      router.replace('/streets/feed');
    } catch (err: any) {
      console.error('[CreateScreen] Submit error:', err);
      Alert.alert('Error', err.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  }, [content, mediaAsset, isPublic, router]);

  const removeMedia = useCallback(() => {
    setMediaAsset(null);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <X size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Post</Text>
        <TouchableOpacity 
          onPress={handleSubmit} 
          disabled={isLoading}
          style={[styles.sendBtn, isLoading && styles.sendBtnDisabled]}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Send size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={2000}
        />

        {mediaAsset && (
          <View style={styles.previewWrap}>
            {mediaAsset.type === 'video' ? (
              <View style={styles.videoPreview}>
                <Video size={48} color="#fff" />
                <Text style={styles.videoLabel}>Video selected</Text>
              </View>
            ) : (
              <Image source={{ uri: mediaAsset.uri }} style={styles.imagePreview} />
            )}
            <TouchableOpacity style={styles.removeBtn} onPress={removeMedia}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => pickMedia('image')}>
            <ImageIcon size={20} color="#2196F3" />
            <Text style={styles.mediaBtnText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => pickMedia('video')}>
            <Video size={20} color="#FF2D55" />
            <Text style={styles.mediaBtnText}>Video</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.optionRow}>
          <MapPin size={18} color="#666" />
          <Text style={styles.optionText}>Add location</Text>
        </TouchableOpacity>

        <View style={styles.optionRow}>
          <Hash size={18} color="#666" />
          <TextInput
            style={styles.hashtagInput}
            placeholder="Add hashtags (e.g. #mtaa #africa)"
            placeholderTextColor="#999"
            value={hashtags}
            onChangeText={setHashtags}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Public Post</Text>
          <Switch value={isPublic} onValueChange={setIsPublic} />
        </View>
        <View style={styles.toggleRow}>
          <Text style={styles.toggleLabel}>Allow Comments</Text>
          <Switch value={allowComments} onValueChange={setAllowComments} />
        </View>
      </ScrollView>
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
  headerTitle: { fontSize: 17, fontWeight: '600' },
  sendBtn: {
    backgroundColor: '#2196F3',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
  scroll: { flex: 1, padding: 16 },
  input: {
    fontSize: 16,
    lineHeight: 22,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  previewWrap: {
    marginVertical: 12,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  videoPreview: {
    width: '100%',
    height: 200,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  videoLabel: { color: '#fff', marginTop: 8 },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
  mediaButtons: {
    flexDirection: 'row',
    gap: 12,
    marginVertical: 12,
  },
  mediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  mediaBtnText: { fontSize: 14, color: '#333' },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    gap: 12,
  },
  optionText: { fontSize: 15, color: '#333' },
  hashtagInput: { flex: 1, fontSize: 15, color: '#333' },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  toggleLabel: { fontSize: 15, color: '#333' },
});
