import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, Image, ScrollView,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Video } from 'expo-av';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { streetsService } from '@/lib/services/streets-service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const MAX_MEDIA = 10;
const MAX_IMAGE_WIDTH = 1080;
const MAX_IMAGE_HEIGHT = 1080;
const IMAGE_QUALITY = 0.75;
const MAX_VIDEO_DURATION_SEC = 60;
const MAX_FILE_SIZE_MB = 10;

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const [caption, setCaption] = useState('');
  const [media, setMedia] = useState<{ uri: string; type: 'image' | 'video'; compressed?: boolean }[]>([]);
  const [loading, setLoading] = useState(false);
  const [postType, setPostType] = useState<'text' | 'image' | 'video' | 'audio'>('text');
  const inputRef = useRef<TextInput>(null);

  // ─── COMPRESSION ENGINE ───
  const compressImage = async (uri: string): Promise<string> => {
    try {
      const manipulated = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_IMAGE_WIDTH, height: MAX_IMAGE_HEIGHT } }],
        { compress: IMAGE_QUALITY, format: ImageManipulator.SaveFormat.JPEG }
      );
      return manipulated.uri;
    } catch (err) {
      console.warn('Compression failed, using original:', err);
      return uri;
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to photos to create a post.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 1, // We compress after pick
      selectionLimit: MAX_MEDIA - media.length,
    });
    if (!result.canceled && result.assets) {
      setLoading(true);
      const compressed = await Promise.all(
        result.assets.map(async (asset) => {
          const compressedUri = await compressImage(asset.uri);
          return { uri: compressedUri, type: 'image' as const, compressed: true };
        })
      );
      setMedia(prev => [...prev, ...compressed].slice(0, MAX_MEDIA));
      setPostType('image');
      setLoading(false);
    }
  };

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow access to videos to create a post.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsMultipleSelection: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]) {
      const asset = result.assets[0];
      // Basic video validation
      if (asset.duration && asset.duration > MAX_VIDEO_DURATION_SEC) {
        Alert.alert('Video too long', `Maximum ${MAX_VIDEO_DURATION_SEC} seconds allowed.`);
        return;
      }
      setMedia([{ uri: asset.uri, type: 'video' }]);
      setPostType('video');
    }
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) setPostType('text');
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!caption.trim() && media.length === 0) {
      Alert.alert('Empty post', 'Add a caption or some media.');
      return;
    }
    if (!user) {
      Alert.alert('Not logged in', 'Please sign in to post.');
      return;
    }
    setLoading(true);
    try {
      const mediaUrls: string[] = [];
      for (const item of media) {
        const url = await streetsService.uploadMedia(item.uri, item.type);
        if (url) mediaUrls.push(url);
      }
      await streetsService.createPost({
        caption: caption.trim(),
        media_urls: mediaUrls,
        post_type: postType,
        creator_id: user.id,
      });
      router.replace('/(os)/streets');
    } catch (err: any) {
      Alert.alert('Post failed', err.message || 'Could not create post. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading || (!caption.trim() && media.length === 0)}
          style={[styles.postBtn, (loading || (!caption.trim() && media.length === 0)) && styles.postBtnDisabled]}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.userRow}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.full_name?.[0] || '?'}</Text>
          </View>
          <Text style={styles.username}>{user?.full_name || 'Anonymous'}</Text>
        </View>

        <TextInput
          ref={inputRef}
          style={styles.input}
          placeholder="What's on your mind?"
          placeholderTextColor="#888"
          multiline
          value={caption}
          onChangeText={setCaption}
          maxLength={2200}
        />
        <Text style={styles.charCount}>{caption.length}/2200</Text>

        {media.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.mediaPreview}>
            {media.map((item, idx) => (
              <View key={idx} style={styles.mediaItem}>
                {item.type === 'image' ? (
                  <Image source={{ uri: item.uri, cache: 'force-cache' }} style={styles.previewImage} />
                ) : (
                  <Video source={{ uri: item.uri }} style={styles.previewImage} resizeMode="cover" />
                )}
                <TouchableOpacity style={styles.removeBtn} onPress={() => removeMedia(idx)}>
                  <Ionicons name="close-circle" size={24} color="#ff4444" />
                </TouchableOpacity>
                {item.compressed && (
                  <View style={styles.compressedBadge}>
                    <Text style={styles.compressedText}>Compressed</Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </ScrollView>

      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolBtn} onPress={pickImages}>
          <Ionicons name="image-outline" size={24} color="#4CAF50" />
          <Text style={styles.toolText}>Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={pickVideo}>
          <Ionicons name="videocam-outline" size={24} color="#2196F3" />
          <Text style={styles.toolText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={() => Alert.alert('Coming soon', 'Audio posts launching in v2')}>
          <Ionicons name="musical-note-outline" size={24} color="#FF9800" />
          <Text style={styles.toolText}>Audio</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#222' },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  postBtn: { backgroundColor: '#4CAF50', paddingHorizontal: 16, paddingVertical: 6, borderRadius: 20 },
  postBtnDisabled: { backgroundColor: '#333' },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  scroll: { flex: 1, paddingHorizontal: 16 },
  userRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#4CAF50', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  username: { color: '#fff', fontSize: 15, fontWeight: '600' },
  input: { color: '#fff', fontSize: 16, lineHeight: 24, minHeight: 120, textAlignVertical: 'top' },
  charCount: { color: '#666', fontSize: 12, textAlign: 'right', marginBottom: 16 },
  mediaPreview: { flexDirection: 'row', marginBottom: 16 },
  mediaItem: { marginRight: 8, position: 'relative' },
  previewImage: { width: 120, height: 120, borderRadius: 8, backgroundColor: '#222' },
  removeBtn: { position: 'absolute', top: -8, right: -8, backgroundColor: '#000', borderRadius: 12 },
  compressedBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: 'rgba(76,175,80,0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  compressedText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#222', backgroundColor: '#111' },
  toolBtn: { alignItems: 'center', paddingHorizontal: 20 },
  toolText: { color: '#aaa', fontSize: 12, marginTop: 4 },
});
