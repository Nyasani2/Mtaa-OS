import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStreets } from '@/lib/hooks/useStreets';

export default function CreatePostScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { handleCreate } = useStreets();

  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [mediaType, setMediaType] = useState<'text' | 'image' | 'video'>('text');
  const [mediaUrl, setMediaUrl] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = useCallback(async () => {
    if (!content.trim() && !mediaUrl.trim()) return;
    setSubmitting(true);
    try {
      await handleCreate({
        content: content.trim() || null,
        caption: caption.trim() || null,
        media_type: mediaType,
        media_url: mediaUrl.trim() || null,
        hashtags: hashtags.split(' ').filter((h) => h.startsWith('#')),
        is_public: isPublic,
        allow_comments: true,
        allow_duet: false,
        is_live: false,
        is_sponsored: false,
      });
      router.back();
    } catch (e) {
      console.error('Create post failed:', e);
    } finally {
      setSubmitting(false);
    }
  }, [content, caption, mediaType, mediaUrl, hashtags, isPublic, handleCreate, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Post</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={submitting || (!content.trim() && !mediaUrl.trim())}
          style={[
            styles.postBtn,
            (submitting || (!content.trim() && !mediaUrl.trim())) && styles.postBtnDisabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.postBtnText}>Post</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        <TextInput
          style={styles.contentInput}
          placeholder="What's happening on the streets?"
          placeholderTextColor="#999"
          multiline
          value={content}
          onChangeText={setContent}
          maxLength={500}
        />

        <TextInput
          style={styles.captionInput}
          placeholder="Caption (optional)"
          placeholderTextColor="#999"
          value={caption}
          onChangeText={setCaption}
          maxLength={200}
        />

        <TextInput
          style={styles.urlInput}
          placeholder="Media URL (image or video)"
          placeholderTextColor="#999"
          value={mediaUrl}
          onChangeText={setMediaUrl}
          autoCapitalize="none"
        />

        <View style={styles.mediaTypeRow}>
          {(['text', 'image', 'video'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.typeBtn, mediaType === type && styles.typeBtnActive]}
              onPress={() => setMediaType(type)}
            >
              <Ionicons
                name={type === 'text' ? 'text' : type === 'image' ? 'image' : 'videocam'}
                size={18}
                color={mediaType === type ? '#fff' : '#666'}
              />
              <Text style={[styles.typeBtnText, mediaType === type && styles.typeBtnTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.hashtagInput}
          placeholder="#hashtags (space separated)"
          placeholderTextColor="#999"
          value={hashtags}
          onChangeText={setHashtags}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.visibilityRow}
          onPress={() => setIsPublic(!isPublic)}
        >
          <Ionicons name={isPublic ? 'globe' : 'lock-closed'} size={20} color="#666" />
          <Text style={styles.visibilityText}>
            {isPublic ? 'Public — anyone can see' : 'Private — only followers'}
          </Text>
        </TouchableOpacity>
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
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111' },
  postBtn: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
  },
  postBtnDisabled: { backgroundColor: '#ccc' },
  postBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  form: { flex: 1, padding: 16 },
  contentInput: {
    fontSize: 18,
    color: '#111',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 12,
  },
  captionInput: {
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  urlInput: {
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  mediaTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  typeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f8f8',
  },
  typeBtnActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  typeBtnText: { fontSize: 13, color: '#666', fontWeight: '500' },
  typeBtnTextActive: { color: '#fff' },
  hashtagInput: {
    fontSize: 15,
    color: '#333',
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  visibilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  visibilityText: { fontSize: 14, color: '#666' },
});
