import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPostById, updatePost, StreetsPost } from '@/lib/services/streets-service';

export default function EditPostScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<StreetsPost | null>(null);
  const [caption, setCaption] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPost();
  }, [id]);

  const loadPost = async () => {
    if (!id || typeof id !== 'string') {
      Alert.alert('Error', 'Invalid post ID');
      router.back();
      return;
    }

    const { post: data, error } = await getPostById(id);
    if (error || !data) {
      Alert.alert('Error', error || 'Post not found');
      router.back();
      return;
    }

    setPost(data);
    setCaption(data.caption || '');
    setLoading(false);
  };

  const handleSave = async () => {
    if (!id || typeof id !== 'string') return;

    setIsSaving(true);
    const { post: updated, error } = await updatePost(id, {
      caption: caption.trim(),
    });
    setIsSaving(false);

    if (error) {
      Alert.alert('Error', error);
      return;
    }

    Alert.alert('Success', 'Post updated!');
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Post</Text>
        <TouchableOpacity
          style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.captionInput}
            placeholder="What's on your mind?"
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={8}
            textAlignVertical="top"
            value={caption}
            onChangeText={setCaption}
            maxLength={2000}
          />
          <Text style={styles.charCount}>{caption.length}/2000</Text>
        </View>

        {post?.media_url && post.media_type === 'image' && (
          <Image source={{ uri: post.media_url }} style={styles.mediaPreview} resizeMode="cover" />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  closeButton: { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  closeText: { fontSize: 20, color: '#374151', fontWeight: '600' },
  headerTitle: { fontSize: 17, fontWeight: '600', color: '#111827' },
  saveButton: { backgroundColor: '#3B82F6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, minWidth: 60, alignItems: 'center' },
  saveButtonDisabled: { backgroundColor: '#93C5FD' },
  saveText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  scrollView: { flex: 1 },
  inputContainer: { paddingHorizontal: 16, paddingVertical: 12 },
  captionInput: { fontSize: 16, color: '#111827', lineHeight: 24, minHeight: 150, textAlignVertical: 'top' },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right', marginTop: 4 },
  mediaPreview: { width: '100%', height: 240, marginHorizontal: 16, borderRadius: 8 },
});
