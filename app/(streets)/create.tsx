import { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, Image, ScrollView, KeyboardAvoidingView, Platform 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

export default function CreatePostScreen() {
  const [content, setContent] = useState('');
  const [media, setMedia] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState('');

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      setMedia([...media, ...result.assets.map(a => a.uri)]);
    }
  };

  const removeImage = (index: number) => {
    setMedia(media.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!content.trim() && media.length === 0) {
      Alert.alert('Empty Post', 'Please add some text or media');
      return;
    }

    setLoading(true);

    // Upload media first
    const mediaUrls: string[] = [];
    for (const uri of media) {
      const fileName = uri.split('/').pop() || `${Date.now()}.jpg`;
      const fileExt = fileName.split('.').pop() || 'jpg';
      const filePath = `${Date.now()}_${fileName}`;
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      } as any);

      const { data, error } = await supabase.storage
        .from('streets-media')
        .upload(filePath, formData);

      if (error) {
        Alert.alert('Upload Failed', error.message);
        setLoading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('streets-media')
        .getPublicUrl(filePath);
      
      mediaUrls.push(publicUrl);
    }

    // Create post
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      Alert.alert('Not Authenticated', 'Please log in to post');
      setLoading(false);
      return;
    }

    const { error } = await supabase.from('streets_posts').insert({
      user_id: user.id,
      content: content.trim(),
      media_urls: mediaUrls,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      created_at: new Date().toISOString(),
    });

    setLoading(false);

    if (error) {
      Alert.alert('Post Failed', error.message);
      return;
    }

    Alert.alert('Posted', 'Your post is live!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>New Post</Text>
        
        <TextInput
          style={styles.input}
          placeholder="What's happening?"
          placeholderTextColor="#888"
          multiline
          numberOfLines={6}
          textAlignVertical="top"
          value={content}
          onChange={setContent}
          maxLength={2000}
        />

        <TextInput
          style={styles.tagInput}
          placeholder="Tags (comma separated)"
          placeholderTextColor="#888"
          value={tags}
          onChange={setTags}
        />

        <TouchableOpacity style={styles.mediaButton} onPress={pickImage}>
          <Text style={styles.mediaButtonText}>📎 Add Photos ({media.length})</Text>
        </TouchableOpacity>

        <View style={styles.mediaGrid}>
          {media.map((uri, index) => (
            <View key={index} style={styles.mediaWrapper}>
              <Image source={{ uri }} style={styles.mediaThumb} />
              <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
                <Text style={styles.removeText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleSubmit} 
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Post</Text>}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} disabled={loading}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  scroll: { padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16, marginTop: 40 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  tagInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  mediaButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#6366f1',
    marginBottom: 16,
  },
  mediaButtonText: { color: '#6366f1', fontSize: 16, fontWeight: '600' },
  mediaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  mediaWrapper: { position: 'relative', width: 100, height: 100 },
  mediaThumb: { width: 100, height: 100, borderRadius: 8 },
  removeBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  button: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  cancelButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  cancelText: { color: '#888', fontSize: 16 },
});
