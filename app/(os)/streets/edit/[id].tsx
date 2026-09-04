// @ts-nocheck
import React, { useState, useEffect, useCallback } from 'react';
import { Alert, View, Text, TextInput, Image, Pressable, StyleSheet, ScrollView, Switch, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Alert, Video, ResizeMode } from 'expo-av';
import { Alert, getPostById, updatePost, deletePost, StreetsPost } from '@/lib/services/streets-service';

// ─── Component ─────────────────────────────────────────────
export default function EditPostScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [post, setPost] = useState<StreetsPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [allowDuet, setAllowDuet] = useState(false);
  const [location, setLocation] = useState('');

  // ─── Load Post ───────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const data = await getPostById(id);
        setPost(data);
        setContent(data.content || '');
        setCaption(data.caption || '');
        setTitle(data.title || '');
        setIsPublic(data.is_public ?? true);
        setAllowComments(data.allow_comments ?? true);
        setAllowDuet(data.allow_duet ?? false);
        setLocation(data.location || '');
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load post');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  // ─── Save ────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!id) return;

    setSaving(true);
    try {
      await updatePost(id, {
        content: content.trim(),
        caption: caption.trim(),
        title: title.trim() || undefined,
        is_public: isPublic,
        allow_comments: allowComments,
        allow_duet: allowDuet,
        location: location.trim() || undefined,
      });

      Alert.alert('Saved', 'Post updated successfully');
      router.back();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update post');
    } finally {
      setSaving(false);
    }
  }, [id, content, caption, title, isPublic, allowComments, allowDuet, location, router]);

  // ─── Delete ──────────────────────────────────────────────
  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Post',
      'This cannot be undone. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!id) return;
            setDeleting(true);
            try {
              await deletePost(id);
              router.back();
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete post');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  }, [id, router]);

  // ─── Loading ─────────────────────────────────────────────
  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color="#FF2D55" />
      </View>
    );
  }

  // ─── Render ──────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.headerButton}>
          <Ionicons name="close" size={28} color="#fff" />
        </Pressable>

        <Text style={styles.headerTitle}>Edit Post</Text>

        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Save</Text>
          )}
        </Pressable>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Media Preview */}
        {post?.media_url && (
          <View style={styles.mediaPreview}>
            {post.media_type === 'video' ? (
              <Video
                source={{ uri: post.media_url }}
                style={styles.mediaPreviewImage}
                resizeMode={ResizeMode.COVER}
                useNativeControls
                isLooping
              />
            ) : (
              <Image source={{ uri: post.media_url }} style={styles.mediaPreviewImage} />
            )}
            <View style={styles.mediaOverlay}>
              <Text style={styles.mediaOverlayText}>
                {post.media_type === 'video' ? 'Video' : 'Image'}
              </Text>
            </View>
          </View>
        )}

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Add a title..."
            placeholderTextColor="#666"
            maxLength={200}
          />
        </View>

        {/* Content */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Content</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor="#666"
            multiline
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>
        </View>

        {/* Caption */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Caption</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Add a caption..."
            placeholderTextColor="#666"
            multiline
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{caption.length}/500</Text>
        </View>

        {/* Location */}
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Add location..."
            placeholderTextColor="#666"
          />
        </View>

        {/* Toggles */}
        <View style={styles.togglesSection}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="globe" size={20} color="#fff" />
              <Text style={styles.toggleLabel}>Public Post</Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: '#333', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="chatbubble" size={20} color="#fff" />
              <Text style={styles.toggleLabel}>Allow Comments</Text>
            </View>
            <Switch
              value={allowComments}
              onValueChange={setAllowComments}
              trackColor={{ false: '#333', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleInfo}>
              <Ionicons name="git-merge" size={20} color="#fff" />
              <Text style={styles.toggleLabel}>Allow Duet</Text>
            </View>
            <Switch
              value={allowDuet}
              onValueChange={setAllowDuet}
              trackColor={{ false: '#333', true: '#34C759' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Delete Button */}
        <Pressable
          style={[styles.deleteButton, deleting && styles.deleteButtonDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <ActivityIndicator size="small" color="#FF2D55" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#FF2D55" />
              <Text style={styles.deleteButtonText}>Delete Post</Text>
            </>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Styles ────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerButton: {
    padding: 4,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  saveButton: {
    backgroundColor: '#FF2D55',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#333',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mediaPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    marginVertical: 16,
    backgroundColor: '#111',
    position: 'relative',
  },
  mediaPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  mediaOverlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  field: {
    marginTop: 16,
  },
  fieldLabel: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    color: '#fff',
    fontSize: 15,
    backgroundColor: '#111',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    color: '#666',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  togglesSection: {
    marginTop: 24,
    marginBottom: 16,
    gap: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  toggleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  toggleLabel: {
    color: '#fff',
    fontSize: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF2D55',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 40,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    color: '#FF2D55',
    fontSize: 16,
    fontWeight: '600',
  },
});
