import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, Image,
  ScrollView, Alert, ActivityIndicator, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

let ImagePicker: any = null;
try {
  ImagePicker = require('expo-image-picker');
} catch (e) {
  console.warn('expo-image-picker not available');
}

export default function CreatePostScreen() {
  const router = useRouter();
  const { editPostId } = useLocalSearchParams<{ editPostId?: string }>();
  const { user, isAuthenticated } = useAuthStore();
  const isEditMode = !!editPostId;

  const [content, setContent] = useState('');
  const [caption, setCaption] = useState('');
  const [hashtags, setHashtags] = useState('');
  const [mediaUri, setMediaUri] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [isPublic, setIsPublic] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [pickerError, setPickerError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from('user_profiles')
      .select('user_id, full_name, display_name, username, avatar_url, verified')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) setUserProfile(data);
      });
  }, [user?.id]);

  useEffect(() => {
    if (!editPostId) return;
    const loadPost = async () => {
      const { data, error } = await supabase
        .from('streets_posts')
        .select('*')
        .eq('id', editPostId)
        .single();
      if (error || !data) {
        Alert.alert('Error', 'Could not load post for editing');
        router.back();
        return;
      }
      if (data.creator_id !== user?.id) {
        Alert.alert('Unauthorized', 'You can only edit your own posts');
        router.back();
        return;
      }
      setContent(data.content || '');
      setCaption(data.caption || '');
      setHashtags((data.hashtags || []).join(' '));
      setMediaUri(data.media_url);
      setMediaType(data.media_type || 'text');
      setIsPublic(data.is_public ?? true);
      setAllowComments(data.allow_comments ?? true);
      setLoading(false);
    };
    loadPost();
  }, [editPostId, user?.id]);

  const pickMedia = async (type: 'image' | 'video') => {
    setPickerError(null);
    if (!ImagePicker) {
      setPickerError('Image picker not available. Please install expo-image-picker.');
      return;
    }
    try {
      let mediaTypes: any;
      if (ImagePicker.MediaType) {
        mediaTypes = type === 'image' ? [ImagePicker.MediaType.IMAGE] : [ImagePicker.MediaType.VIDEO];
      } else if (ImagePicker.MediaTypeOptions) {
        mediaTypes = type === 'image' ? ImagePicker.MediaTypeOptions.Images : ImagePicker.MediaTypeOptions.Videos;
      } else {
        setPickerError('Image picker API not recognized');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        quality: 0.8,
      });
      if (!result.canceled && result.assets && result.assets[0]) {
        setMediaUri(result.assets[0].uri);
        setMediaType(type);
      }
    } catch (e: any) {
      setPickerError(e.message || 'Failed to pick media');
    }
  };

  const uploadMedia = async (uri: string, type: 'image' | 'video'): Promise<string> => {
    const ext = type === 'image' ? 'jpg' : 'mp4';
    const fileName = `${user!.id}/${Date.now()}.${ext}`;
    const response = await fetch(uri);
    const blob = await response.blob();
    const { error } = await supabase.storage.from('streets-media').upload(fileName, blob, {
      contentType: type === 'image' ? 'image/jpeg' : 'video/mp4',
      upsert: false,
    });
    if (error) throw error;
    const { data: { publicUrl } } = supabase.storage.from('streets-media').getPublicUrl(fileName);
    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to create posts.');
      return;
    }
    if (!content.trim() && !mediaUri) {
      Alert.alert('Empty Post', 'Please add some text or media.');
      return;
    }

    if (!isEditMode) {
      const draft = {
        content: content.trim(),
        caption: caption.trim(),
        hashtags: hashtags.split(/\s+/).map((h: string) => h.trim()).filter((h: string) => h.startsWith('#')),
        mediaUri,
        mediaType,
        isPublic,
        allowComments,
      };
      router.back();
      setTimeout(() => uploadInBackground(draft), 100);
      return;
    }

    setUploading(true);
    try {
      let mediaUrl = mediaUri;
      let thumbnailUrl: string | null = null;
      if (mediaUri && !mediaUri.startsWith('http')) {
        mediaUrl = await uploadMedia(mediaUri, mediaType);
        if (mediaType === 'video') thumbnailUrl = mediaUrl;
      }
      const hashtagArray = hashtags.split(/\s+/).map((h: string) => h.trim()).filter((h: string) => h.startsWith('#'));
      const payload: any = {
        content: content.trim() || null,
        caption: caption.trim() || null,
        media_url: mediaUrl || null,
        media_type: mediaType,
        thumbnail_url: thumbnailUrl,
        hashtags: hashtagArray.length > 0 ? hashtagArray : null,
        is_public: isPublic,
        allow_comments: allowComments,
        updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('streets_posts').update(payload).eq('id', editPostId);
      if (error) throw error;
      Alert.alert('Updated', 'Your post has been updated.');
      router.back();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to update post');
    } finally {
      setUploading(false);
    }
  };

  const uploadInBackground = async (draft: any) => {
    try {
      let mediaUrl = draft.mediaUri;
      let thumbnailUrl: string | null = null;
      if (draft.mediaUri && !draft.mediaUri.startsWith('http')) {
        mediaUrl = await uploadMedia(draft.mediaUri, draft.mediaType);
        if (draft.mediaType === 'video') thumbnailUrl = mediaUrl;
      }
      const payload = {
        creator_id: user!.id,
        content: draft.content || null,
        caption: draft.caption || null,
        media_url: mediaUrl || null,
        media_type: draft.mediaType,
        thumbnail_url: thumbnailUrl,
        hashtags: draft.hashtags.length > 0 ? draft.hashtags : null,
        is_public: draft.isPublic,
        allow_comments: draft.allowComments,
        created_at: new Date().toISOString(),
        title: draft.content.slice(0, 100) || 'Post',
      };
      const { error } = await supabase.from('streets_posts').insert(payload);
      if (error) console.error('Background upload error:', error);
    } catch (e: any) {
      console.error('Background upload failed:', e);
    }
  };

  const handleDelete = async () => {
    if (!editPostId) return;
    Alert.alert('Delete Post?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          setUploading(true);
          const { error } = await supabase.from('streets_posts').delete().eq('id', editPostId);
          setUploading(false);
          if (error) { Alert.alert('Error', error.message); }
          else { Alert.alert('Deleted', 'Post removed.'); router.back(); }
        },
      },
    ]);
  };

  const profileName = userProfile?.full_name || userProfile?.display_name || userProfile?.username || 'You';

  if (loading && isEditMode) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#00d4ff" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditMode ? 'Edit Post' : 'Create Post'}</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={uploading}>
            {uploading ? <ActivityIndicator size="small" color="#00d4ff" /> : <Text style={styles.postBtn}>{isEditMode ? 'Save' : 'Post'}</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.avatarRow}>
          {userProfile?.avatar_url ? (
            <Image source={{ uri: userProfile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Ionicons name="person" size={20} color="#fff" />
            </View>
          )}
          <View style={styles.avatarInfo}>
            <Text style={styles.avatarName}>{profileName}</Text>
            {userProfile?.verified && (
              <View style={styles.verifiedRow}>
                <Ionicons name="checkmark-circle" size={14} color="#00d4ff" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            )}
          </View>
        </View>

        <TextInput style={styles.input} placeholder="What's on your mind?" placeholderTextColor="#666" multiline value={content} onChangeText={setContent} maxLength={2000} />
        <TextInput style={[styles.input, styles.captionInput]} placeholder="Add a caption..." placeholderTextColor="#666" value={caption} onChangeText={setCaption} maxLength={500} />
        <TextInput style={[styles.input, styles.hashtagInput]} placeholder="#hashtag #mtaa #streets" placeholderTextColor="#666" value={hashtags} onChangeText={setHashtags} autoCapitalize="none" />

        {mediaUri && (
          <View style={styles.mediaPreview}>
            {mediaType === 'video' ? (
              <View style={[styles.previewImage, styles.videoPreview]}>
                {Platform.OS === 'web' ? (
                  <video src={mediaUri} style={{ width: '100%', height: 200, borderRadius: 12, objectFit: 'cover' }} autoPlay muted loop playsInline />
                ) : (
                  <><Ionicons name="videocam" size={48} color="#00d4ff" /><Text style={styles.videoText}>Video selected</Text></>
                )}
              </View>
            ) : (
              <Image source={{ uri: mediaUri }} style={styles.previewImage} resizeMode="cover" />
            )}
            <TouchableOpacity style={styles.removeMedia} onPress={() => { setMediaUri(null); setMediaType('text'); }}>
              <Ionicons name="close-circle" size={28} color="#ff4444" />
            </TouchableOpacity>
          </View>
        )}

        {pickerError && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{pickerError}</Text>
          </View>
        )}

        <View style={styles.mediaButtons}>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => pickMedia('image')}>
            <Ionicons name="image-outline" size={24} color="#00d4ff" />
            <Text style={styles.mediaBtnText}>Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.mediaBtn} onPress={() => pickMedia('video')}>
            <Ionicons name="videocam-outline" size={24} color="#00d4ff" />
            <Text style={styles.mediaBtnText}>Video</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.settingRow} onPress={() => setIsPublic(!isPublic)}>
            <Ionicons name={isPublic ? "globe-outline" : "lock-closed-outline"} size={20} color="#888" />
            <Text style={styles.settingText}>{isPublic ? 'Public' : 'Private'}</Text>
            <Ionicons name={isPublic ? "checkbox" : "square-outline"} size={20} color="#00d4ff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingRow} onPress={() => setAllowComments(!allowComments)}>
            <Ionicons name="chatbubble-outline" size={20} color="#888" />
            <Text style={styles.settingText}>{allowComments ? 'Comments On' : 'Comments Off'}</Text>
            <Ionicons name={allowComments ? "checkbox" : "square-outline"} size={20} color="#00d4ff" />
          </TouchableOpacity>
        </View>

        {isEditMode && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete} disabled={uploading}>
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
            <Text style={styles.deleteText}>Delete Post</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, paddingTop: Platform.OS === 'ios' ? 40 : 16 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  postBtn: { color: '#00d4ff', fontSize: 16, fontWeight: '700' },
  avatarRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  avatar: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarPlaceholder: { backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  avatarInfo: { justifyContent: 'center' },
  avatarName: { color: '#fff', fontSize: 16, fontWeight: '600' },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  verifiedText: { color: '#00d4ff', fontSize: 12, marginLeft: 4 },
  input: { color: '#fff', fontSize: 16, minHeight: 80, borderWidth: 1, borderColor: '#222', borderRadius: 12, padding: 12, marginBottom: 12, textAlignVertical: 'top' },
  captionInput: { minHeight: 50, fontSize: 14 },
  hashtagInput: { minHeight: 44, fontSize: 14, color: '#00d4ff' },
  mediaPreview: { position: 'relative', marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
  previewImage: { width: '100%', height: 200, borderRadius: 12, backgroundColor: '#111' },
  videoPreview: { justifyContent: 'center', alignItems: 'center' },
  videoText: { color: '#fff', fontSize: 16, marginTop: 8 },
  removeMedia: { position: 'absolute', top: 8, right: 8 },
  errorBox: { backgroundColor: '#1a0000', borderWidth: 1, borderColor: '#ff4444', borderRadius: 8, padding: 12, marginBottom: 12 },
  errorBoxText: { color: '#ff4444', fontSize: 13 },
  mediaButtons: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#111', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, borderWidth: 1, borderColor: '#222' },
  mediaBtnText: { color: '#fff', marginLeft: 8, fontSize: 14 },
  settingsSection: { marginBottom: 20 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  settingText: { color: '#fff', fontSize: 14, flex: 1, marginLeft: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a0000', paddingVertical: 14, borderRadius: 12, borderWidth: 1, borderColor: '#ff4444', marginTop: 8 },
  deleteText: { color: '#ff4444', fontSize: 16, fontWeight: '600', marginLeft: 8 },
});
