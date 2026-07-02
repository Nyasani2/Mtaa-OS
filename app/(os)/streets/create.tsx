import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { createPost, uploadMedia, StreetsError } from '@/lib/services/streets-service';
import { compressMedia, formatBytes } from '@/lib/utils/media-compressor';

const { width: SCREEN_W } = Dimensions.get('window');

export default function CreatePostScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [mediaSize, setMediaSize] = useState(0);
  const [compressedSize, setCompressedSize] = useState(0);
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ─── PICK IMAGE ────────────────────────────────────
  const pickImage = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 5],
      quality: 1, // We compress manually
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType('image');
      setMediaSize(asset.fileSize || 0);

      // Show compression preview
      try {
        const compressed = await compressMedia(asset.uri, 'image/jpeg');
        setCompressedSize(compressed.size);
      } catch (e) {
        console.warn('Compression preview failed:', e);
      }
    }
  }, []);

  // ─── PICK VIDEO ────────────────────────────────────
  const pickVideo = useCallback(async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setMediaUri(asset.uri);
      setMediaType('video');
      setMediaSize(asset.fileSize || 0);

      try {
        const compressed = await compressMedia(asset.uri, 'video/mp4');
        setCompressedSize(compressed.size);
      } catch (e) {
        console.warn('Compression preview failed:', e);
      }
    }
  }, []);

  // ─── ADD HASHTAG ───────────────────────────────────
  const addHashtag = useCallback(() => {
    const tag = hashtagInput.trim().replace(/^#/, '');
    if (tag && !hashtags.includes(tag)) {
      setHashtags(prev => [...prev, tag]);
      setHashtagInput('');
    }
  }, [hashtagInput, hashtags]);

  const removeHashtag = useCallback((tag: string) => {
    setHashtags(prev => prev.filter(t => t !== tag));
  }, []);

  // ─── SUBMIT ──────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !mediaUri) {
      Alert.alert('Error', 'Please add some content or media');
      return;
    }

    setSubmitting(true);
    setUploadProgress(0);

    try {
      let mediaUrl: string | null = null;
      let thumbnailUrl: string | null = null;

      if (mediaUri) {
        const fileName = mediaUri.split('/').pop() || 'media';
        const mimeType = mediaType === 'image' ? 'image/jpeg' : 'video/mp4';

        const result = await uploadMedia(
          mediaUri,
          fileName,
          mimeType,
          (progress) => setUploadProgress(progress.percentage)
        );

        mediaUrl = result.mediaUrl;
        thumbnailUrl = result.thumbnailUrl || null;
      }

      await createPost({
        content: content.trim(),
        caption: caption.trim() || content.trim(),
        media_url: mediaUrl,
        media_type: mediaType,
        hashtags,
        is_public: isPublic,
        allow_comments: allowComments,
        thumbnail_url: thumbnailUrl,
      });

      router.back();
    } catch (e: any) {
      const message = e instanceof StreetsError ? e.message : 'Failed to create post';
      Alert.alert('Error', message);
      console.error('Create post error:', e);
    } finally {
      setSubmitting(false);
    }
  }, [content, caption, mediaUri, mediaType, hashtags, isPublic, allowComments, router]);

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="close" size={26} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting}
          style={[styles.postBtn, submitting && styles.postBtnDisabled]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Media Preview */}
      {mediaUri ? (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: mediaUri }} style={styles.mediaImage} resizeMode="cover" />
          <TouchableOpacity style={styles.removeMediaBtn} onPress={() => { setMediaUri(null); setMediaType('text'); }}>
            <Ionicons name="close-circle" size={28} color="#fff" />
          </TouchableOpacity>
          {mediaSize > 0 && (
            <View style={styles.sizeBadge}>
              <Text style={styles.sizeText}>
                {formatBytes(mediaSize)} → {formatBytes(compressedSize || mediaSize)}
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaBtn} onPress={pickImage}>
            <Ionicons name="image-outline" size={32} color="#E91E63" />
            <Text style={styles.mediaBtnText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={pickVideo}>
            <Ionicons name="videocam-outline" size={32} color="#E91E63" />
            <Text style={styles.mediaBtnText}>Video</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content Input */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.contentInput}
          placeholder="What's on your mind?"
          placeholderTextColor="#666"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={500}
        />
        <Text style={styles.charCount}>{content.length}/500</Text>
      </View>

      {/* Caption (optional) */}
      <View style={styles.inputSection}>
        <TextInput
          style={styles.captionInput}
          placeholder="Add a caption (optional)"
          placeholderTextColor="#666"
          value={caption}
          onChangeText={setCaption}
          maxLength={100}
        />
      </View>

      {/* Hashtags */}
      <View style={styles.inputSection}>
        <View style={styles.hashtagInputRow}>
          <TextInput
            style={styles.hashtagInput}
            placeholder="Add hashtag"
            placeholderTextColor="#666"
            value={hashtagInput}
            onChangeText={setHashtagInput}
            onSubmitEditing={addHashtag}
          />
          <TouchableOpacity onPress={addHashtag} style={styles.addTagBtn}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={styles.hashtagList}>
          {hashtags.map(tag => (
            <TouchableOpacity key={tag} style={styles.hashtagChip} onPress={() => removeHashtag(tag)}>
              <Text style={styles.hashtagChipText}>#{tag}</Text>
              <Ionicons name="close" size={12} color="#E91E63" />
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Options */}
      <View style={styles.optionsSection}>
        <TouchableOpacity style={styles.optionRow} onPress={() => setIsPublic(!isPublic)}>
          <Ionicons name={isPublic ? "globe-outline" : "lock-closed-outline"} size={22} color="#888" />
          <Text style={styles.optionText}>{isPublic ? 'Public' : 'Private'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.optionRow} onPress={() => setAllowComments(!allowComments)}>
          <Ionicons name={allowComments ? "chatbubble-outline" : "chatbubble-off-outline"} size={22} color="#888" />
          <Text style={styles.optionText}>{allowComments ? 'Comments on' : 'Comments off'}</Text>
        </TouchableOpacity>
      </View>

      {/* Upload Progress */}
      {submitting && uploadProgress > 0 && (
        <View style={styles.progressSection}>
          <Text style={styles.progressText}>Uploading... {Math.round(uploadProgress)}%</Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: '#222',
  },
  backBtn: { padding: 8 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600' },
  postBtn: { backgroundColor: '#E91E63', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  postBtnDisabled: { opacity: 0.5 },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },

  mediaPreview: { position: 'relative', margin: 16, borderRadius: 12, overflow: 'hidden' },
  mediaImage: { width: SCREEN_W - 32, height: (SCREEN_W - 32) * 1.25, borderRadius: 12 },
  removeMediaBtn: { position: 'absolute', top: 8, right: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 14 },
  sizeBadge: { position: 'absolute', bottom: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.7)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  sizeText: { color: '#fff', fontSize: 11 },

  mediaButtons: { flexDirection: 'row', gap: 16, padding: 16 },
  mediaBtn: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  mediaBtnText: { color: '#fff', marginTop: 8, fontSize: 14 },

  inputSection: { paddingHorizontal: 16, paddingVertical: 8 },
  contentInput: { color: '#fff', fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
  captionInput: { color: '#fff', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 8 },
  charCount: { color: '#666', fontSize: 12, textAlign: 'right', marginTop: 4 },

  hashtagInputRow: { flexDirection: 'row', gap: 8 },
  hashtagInput: { flex: 1, color: '#fff', fontSize: 14, borderBottomWidth: 1, borderBottomColor: '#333', paddingVertical: 8 },
  addTagBtn: { backgroundColor: '#E91E63', width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  hashtagList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  hashtagChip: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1a1a1a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#E91E63' },
  hashtagChipText: { color: '#E91E63', fontSize: 13 },

  optionsSection: { paddingHorizontal: 16, paddingVertical: 8 },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  optionText: { color: '#fff', fontSize: 14 },

  progressSection: { padding: 16 },
  progressText: { color: '#E91E63', fontSize: 14, marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: '#1a1a1a', borderRadius: 2 },
  progressFill: { height: 4, backgroundColor: '#E91E63', borderRadius: 2 },
});
