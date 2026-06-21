import React, { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase/client';
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
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { Camera, MapPin, Hash, X, Send } from 'lucide-react-native';
import { useAuthStore } from '@/lib/auth/useAuthStore';
import { createPost, uploadMedia } from '@/lib/services/streets-service';

export default function CreateScreen() {
  const router = useRouter();
  const auth = useAuthStore();
  const [caption, setCaption] = useState('');
  const [location, setLocation] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<string>('image');
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userId = auth.user?.id;

  const pickMedia = useCallback(async (type: 'image' | 'video') => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'video'
          ? ImagePicker.MediaTypeOptions.Videos
          : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
        videoMaxDuration: 60,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setSelectedMedia(asset.uri);
        setMediaType(type);
      }
    } catch (err) {
      console.error('Pick media error:', err);
      Alert.alert('Error', 'Failed to select media');
    }
  }, []);

  const removeMedia = useCallback(() => {
    setSelectedMedia(null);
    setMediaType('image');
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!userId) {
      Alert.alert('Error', 'You must be logged in to post');
      return;
    }

    if (!caption.trim() && !selectedMedia) {
      Alert.alert('Error', 'Please add a caption or media');
      return;
    }

    setIsSubmitting(true);

    try {
      let mediaUrl: string | undefined;

      // Upload media if selected
      if (selectedMedia) {
        const fileName = selectedMedia.split('/').pop() || 'media';
        const contentType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
        mediaUrl = await uploadMedia(selectedMedia, fileName, contentType);
      }

      // Parse hashtags
      const hashtagArray = hashtags
        .split(/\s+/)
        .map(tag => tag.trim())
        .filter(tag => tag.startsWith('#'))
        .map(tag => tag.slice(1));

      // Create post
      const post = await createPost({
        caption: caption.trim() || null,
        media_url: mediaUrl,
        media_type: mediaType,
        location: location.trim() || null,
        hashtags: hashtagArray.length > 0 ? hashtagArray : null,
        is_public: isPublic,
        allow_comments: allowComments,
      });

      Alert.alert('Success', 'Post created!', [
        {
          text: 'View Feed',
          onPress: () => router.replace('/streets/feed'),
        },
        {
          text: 'Create Another',
          onPress: () => {
            setCaption('');
            setLocation('');
            setHashtags('');
            setSelectedMedia(null);
          },
        },
      ]);
    } catch (err: any) {
      console.error('Create post error:', err);
      Alert.alert('Error', err.message || 'Failed to create post');
    } finally {
      setIsSubmitting(false);
    }
  }, [
    userId, caption, selectedMedia, mediaType, location,
    hashtags, isPublic, allowComments, router,
  ]);

  const isVideo = mediaType === 'video';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.scrollView} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <X size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Post</Text>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isSubmitting}
            style={[styles.postButton, isSubmitting && styles.postButtonDisabled]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" />
            )}
          </TouchableOpacity>
        </View>

        {/* Caption Input */}
        <View style={styles.inputSection}>
          <TextInput
            style={styles.captionInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            value={caption}
            onChangeText={setCaption}
            maxLength={500}
          />
          <Text style={styles.charCount}>{caption.length}/500</Text>
        </View>

        {/* Media Preview */}
        {selectedMedia && (
          <View style={styles.mediaPreview}>
            <TouchableOpacity style={styles.removeButton} onPress={removeMedia}>
              <X size={16} color="#fff" />
            </TouchableOpacity>
            {isVideo ? (
              <Video
                source={{ uri: selectedMedia }}
                style={styles.mediaPreviewImage}
                resizeMode="cover"
                isLooping
                shouldPlay={false}
                isMuted
                useNativeControls
              />
            ) : (
              <Image source={{ uri: selectedMedia }} style={styles.mediaPreviewImage} />
            )}
          </View>
        )}

        {/* Media Pickers */}
        {!selectedMedia && (
          <View style={styles.mediaButtons}>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => pickMedia('image')}
            >
              <Camera size={24} color="#007AFF" />
              <Text style={styles.mediaButtonText}>Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.mediaButton}
              onPress={() => pickMedia('video')}
            >
              <Camera size={24} color="#FF2D55" />
              <Text style={styles.mediaButtonText}>Video</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Location */}
        <View style={styles.inputRow}>
          <MapPin size={20} color="#666" />
          <TextInput
            style={styles.rowInput}
            placeholder="Add location"
            placeholderTextColor="#999"
            value={location}
            onChangeText={setLocation}
          />
        </View>

        {/* Hashtags */}
        <View style={styles.inputRow}>
          <Hash size={20} color="#666" />
          <TextInput
            style={styles.rowInput}
            placeholder="Add hashtags (e.g. #mtaa #africa)"
            placeholderTextColor="#999"
            value={hashtags}
            onChangeText={setHashtags}
          />
        </View>

        {/* Options */}
        <View style={styles.optionsSection}>
          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setIsPublic(!isPublic)}
          >
            <Text style={styles.optionText}>Public Post</Text>
            <View style={[styles.toggle, isPublic && styles.toggleActive]}>
              <View style={[styles.toggleDot, isPublic && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionRow}
            onPress={() => setAllowComments(!allowComments)}
          >
            <Text style={styles.optionText}>Allow Comments</Text>
            <View style={[styles.toggle, allowComments && styles.toggleActive]}>
              <View style={[styles.toggleDot, allowComments && styles.toggleDotActive]} />
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  postButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postButtonDisabled: {
    backgroundColor: '#ccc',
  },
  inputSection: {
    padding: 16,
  },
  captionInput: {
    fontSize: 16,
    lineHeight: 22,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  mediaPreview: {
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaButtons: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  mediaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 12,
  },
  mediaButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  rowInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: '#333',
  },
  optionsSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 15,
    color: '#333',
  },
  toggle: {
    width: 50,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#007AFF',
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    transform: [{ translateX: 0 }],
  },
  toggleDotActive: {
    transform: [{ translateX: 22 }],
  },
});
