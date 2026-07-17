import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { createPost, CreatePostInput } from '@/lib/services/streets-service';
import { useAuthStore } from '@/lib/auth/useAuthStore';

export default function CreateScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);

  const [title, setTitle] = useState('');
  const [caption, setCaption] = useState('');
  const [content, setContent] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [location, setLocation] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'video' | 'image' | 'text'>('text');
  const [thumbnailUri, setThumbnailUri] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [loading, setLoading] = useState(false);

  const pickMedia = useCallback(async (type: 'video' | 'image') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(type);

        // For video, generate thumbnail from first frame if available
        if (type === 'video' && asset.duration) {
          // Thumbnail can be generated from video or picked separately
          setThumbnailUri(asset.uri); // Use video frame as thumbnail placeholder
        }
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick media. Please try again.');
    }
  }, []);

  const pickThumbnail = useCallback(async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        setThumbnailUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick thumbnail.');
    }
  }, []);

  const takePhoto = useCallback(async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets.length > 0) {
        const asset = result.assets[0];
        setMediaUri(asset.uri);
        setMediaType(asset.type === 'video' ? 'video' : 'image');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to capture media. Please try again.');
    }
  }, []);

  const uploadMedia = async (uri: string): Promise<{ url: string; thumbnailUrl?: string }> => {
    // Upload to Supabase Storage
    const fileExt = uri.split('.').pop() || 'mp4';
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `streets/${user?.id}/${fileName}`;

    const response = await fetch(uri);
    const blob = await response.blob();

    const { data, error } = await supabase.storage
      .from('streets')
      .upload(filePath, blob, {
        contentType: mediaType === 'video' ? 'video/mp4' : 'image/jpeg',
        upsert: false,
      });

    if (error) throw new Error(error.message);

    const { data: urlData } = supabase.storage.from('streets').getPublicUrl(filePath);

    let thumbnailUrl: string | undefined;
    if (thumbnailUri) {
      const thumbExt = thumbnailUri.split('.').pop() || 'jpg';
      const thumbName = `${Date.now()}_thumb.${thumbExt}`;
      const thumbPath = `streets/${user?.id}/${thumbName}`;

      const thumbResponse = await fetch(thumbnailUri);
      const thumbBlob = await thumbResponse.blob();

      const { data: thumbData, error: thumbError } = await supabase.storage
        .from('streets')
        .upload(thumbPath, thumbBlob, {
          contentType: 'image/jpeg',
          upsert: false,
        });

      if (!thumbError) {
        const { data: thumbUrlData } = supabase.storage.from('streets').getPublicUrl(thumbPath);
        thumbnailUrl = thumbUrlData.publicUrl;
      }
    }

    return { url: urlData.publicUrl, thumbnailUrl };
  };

  const handleSubmit = async () => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a post.');
      return;
    }

    if (!title && !caption && !content && !mediaUri) {
      Alert.alert('Error', 'Please add a title, caption, or media.');
      return;
    }

    setLoading(true);

    try {
      let mediaUrl: string | undefined;
      let thumbnailUrl: string | undefined;

      if (mediaUri) {
        const uploadResult = await uploadMedia(mediaUri);
        mediaUrl = uploadResult.url;
        thumbnailUrl = uploadResult.thumbnailUrl;
      }

      const hashtagArray = hashtags
        .split(/[#\s,]+/)
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      const input: CreatePostInput = {
        title: title || undefined,
        caption: caption || undefined,
        content: content || undefined,
        media_type: mediaType,
        media_url: mediaUrl || '',
        thumbnail_url: thumbnailUrl || undefined,
        hashtags: hashtagArray.length > 0 ? hashtagArray : undefined,
        location: location || undefined,
        is_public: isPublic,
        allow_comments: allowComments,
      };

      const { post, error } = await createPost(input);

      if (error || !post) {
        Alert.alert('Error', error || 'Failed to create post');
        return;
      }

      Alert.alert('Success', 'Post created!', [
        { text: 'OK', onPress: () => router.replace('/streets/feed') },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const clearMedia = () => {
    setMediaUri(null);
    setThumbnailUri(null);
    setMediaType('text');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <Ionicons name="close" size={28} color="white" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>New Post</Text>
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.postButton, loading && styles.postButtonDisabled]}
            >
              {loading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.postButtonText}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Media Preview */}
          {mediaUri ? (
            <View style={styles.mediaPreview}>
              {mediaType === 'video' ? (
                <Video
                  source={{ uri: mediaUri }}
                  style={styles.mediaPreviewImage}
                  resizeMode={ResizeMode.COVER}
                  isLooping
                  shouldPlay={false}
                  useNativeControls
                />
              ) : (
                <Image source={{ uri: mediaUri }} style={styles.mediaPreviewImage} />
              )}
              <TouchableOpacity style={styles.clearMediaButton} onPress={clearMedia}>
                <Ionicons name="close-circle" size={28} color="white" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.mediaButtons}>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => pickMedia('image')}
              >
                <Ionicons name="image-outline" size={32} color="#4A9EFF" />
                <Text style={styles.mediaButtonText}>Photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.mediaButton}
                onPress={() => pickMedia('video')}
              >
                <Ionicons name="videocam-outline" size={32} color="#FF2D55" />
                <Text style={styles.mediaButtonText}>Video</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.mediaButton} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={32} color="#34C759" />
                <Text style={styles.mediaButtonText}>Camera</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Thumbnail picker (for video) */}
          {mediaUri && mediaType === 'video' && (
            <View style={styles.thumbnailSection}>
              <Text style={styles.sectionLabel}>Thumbnail</Text>
              {thumbnailUri ? (
                <View style={styles.thumbnailPreview}>
                  <Image source={{ uri: thumbnailUri }} style={styles.thumbnailImage} />
                  <TouchableOpacity onPress={() => setThumbnailUri(null)}>
                    <Ionicons name="trash-outline" size={20} color="#FF2D55" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.thumbnailButton} onPress={pickThumbnail}>
                  <Ionicons name="image-outline" size={24} color="#999" />
                  <Text style={styles.thumbnailButtonText}>Pick Thumbnail</Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          {/* Text Inputs */}
          <View style={styles.inputSection}>
            <TextInput
              style={styles.input}
              placeholder="Title (optional)"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
            />
            <TextInput
              style={[styles.input, styles.captionInput]}
              placeholder="Caption"
              placeholderTextColor="#666"
              value={caption}
              onChangeText={setCaption}
              multiline
              maxLength={500}
            />
            <TextInput
              style={[styles.input, styles.contentInput]}
              placeholder="Content (optional)"
              placeholderTextColor="#666"
              value={content}
              onChangeText={setContent}
              multiline
              maxLength={2000}
            />
            <TextInput
              style={styles.input}
              placeholder="Hashtags (space separated)"
              placeholderTextColor="#666"
              value={hashtags}
              onChangeText={setHashtags}
            />
            <TextInput
              style={styles.input}
              placeholder="Location (optional)"
              placeholderTextColor="#666"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          {/* Options */}
          <View style={styles.optionsSection}>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Public</Text>
              <TouchableOpacity
                style={[styles.toggle, isPublic && styles.toggleActive]}
                onPress={() => setIsPublic(!isPublic)}
              >
                <View style={[styles.toggleKnob, isPublic && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>
            <View style={styles.optionRow}>
              <Text style={styles.optionLabel}>Allow Comments</Text>
              <TouchableOpacity
                style={[styles.toggle, allowComments && styles.toggleActive]}
                onPress={() => setAllowComments(!allowComments)}
              >
                <View style={[styles.toggleKnob, allowComments && styles.toggleKnobActive]} />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

import { supabase } from '@/lib/supabase/client';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  postButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postButtonDisabled: {
    opacity: 0.5,
  },
  postButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  mediaPreview: {
    width: '100%',
    height: 300,
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  clearMediaButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
  },
  mediaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  mediaButton: {
    alignItems: 'center',
    gap: 8,
  },
  mediaButtonText: {
    color: '#999',
    fontSize: 14,
  },
  thumbnailSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  sectionLabel: {
    color: '#999',
    fontSize: 14,
    marginBottom: 8,
  },
  thumbnailPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumbnailImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  thumbnailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    borderStyle: 'dashed',
  },
  thumbnailButtonText: {
    color: '#999',
    fontSize: 14,
  },
  inputSection: {
    padding: 16,
    gap: 12,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    color: 'white',
    fontSize: 16,
  },
  captionInput: {
    height: 80,
    textAlignVertical: 'top',
  },
  contentInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  optionsSection: {
    padding: 16,
    gap: 16,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionLabel: {
    color: 'white',
    fontSize: 16,
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#34C759',
  },
  toggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'white',
    transform: [{ translateX: 0 }],
  },
  toggleKnobActive: {
    transform: [{ translateX: 22 }],
  },
});
