// domains/streets/components/CreateModal.tsx — FIXED
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { useAuth } from '@/lib/auth/useAuth';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

interface CreateModalProps {
  visible?: boolean;
  onClose: () => void;
}

export default function CreateModal({ visible = true, onClose }: CreateModalProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [caption, setCaption] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video' | 'text'>('text');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = async () => {
    if (!caption.trim() && !mediaUrl) {
      alert('Please add a caption or media');
      return;
    }
    if (!user) {
      alert('Please sign in to post');
      return;
    }

    setIsPublishing(true);
    try {
      const { error } = await supabase.from('streets_posts').insert({
        creator_id: user.id,
        caption: caption.trim(),
        title: caption.trim().substring(0, 100),
        content: caption.trim(),
        media_type: mediaUrl ? mediaType : 'text',
        media_url: mediaUrl || null,
        is_public: true,
        allow_comments: true,
        views_count: 0,
        likes_count: 0,
        comments_count: 0,
        shares_count: 0,
      });

      if (error) throw error;
      setCaption('');
      setMediaUrl('');
      setMediaType('text');
      onClose();
      // Refresh feed
      router.replace('/streets/feed');
    } catch (err: any) {
      console.error('[Streets] Publish error:', err);
      alert('Failed to publish: ' + err.message);
    } finally {
      setIsPublishing(false);
    }
  };

  const content = (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeBtn}>×</Text>
        </TouchableOpacity>
        <Text style={styles.title}>New Post</Text>
        <TouchableOpacity onPress={handlePublish} disabled={isPublishing || (!caption.trim() && !mediaUrl)}>
          <Text style={[styles.publishBtn, (isPublishing || (!caption.trim() && !mediaUrl)) && styles.disabled]}>
            {isPublishing ? 'Publishing...' : 'Publish'}
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="What's happening?"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        value={caption}
        onChangeText={setCaption}
        maxLength={500}
      />

      <TextInput
        style={styles.mediaInput}
        placeholder="Media URL (optional - paste image or video URL)"
        value={mediaUrl}
        onChangeText={setMediaUrl}
      />

      <View style={styles.mediaButtons}>
        <TouchableOpacity 
          style={[styles.mediaBtn, mediaType === 'image' && styles.mediaBtnActive]} 
          onPress={() => setMediaType('image')}
        >
          <Ionicons name="image" size={20} color={mediaType === 'image' ? '#007AFF' : '#666'} />
          <Text style={[styles.mediaBtnText, mediaType === 'image' && styles.mediaBtnTextActive]}>Image</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mediaBtn, mediaType === 'video' && styles.mediaBtnActive]} 
          onPress={() => setMediaType('video')}
        >
          <Ionicons name="videocam" size={20} color={mediaType === 'video' ? '#007AFF' : '#666'} />
          <Text style={[styles.mediaBtnText, mediaType === 'video' && styles.mediaBtnTextActive]}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.mediaBtn, mediaType === 'text' && styles.mediaBtnActive]} 
          onPress={() => { setMediaType('text'); setMediaUrl(''); }}
        >
          <Ionicons name="text" size={20} color={mediaType === 'text' ? '#007AFF' : '#666'} />
          <Text style={[styles.mediaBtnText, mediaType === 'text' && styles.mediaBtnTextActive]}>Text</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  // If used as modal (FeedScreen passes visible prop)
  if (visible !== undefined) {
    return (
      <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
        {content}
      </Modal>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, paddingTop: 40 },
  closeBtn: { fontSize: 32, color: '#333', paddingHorizontal: 8 },
  title: { fontSize: 18, fontWeight: '600' },
  publishBtn: { color: '#007AFF', fontWeight: '600', fontSize: 16 },
  disabled: { opacity: 0.5 },
  input: { fontSize: 16, minHeight: 120, textAlignVertical: 'top', marginBottom: 16, lineHeight: 22 },
  mediaInput: { fontSize: 14, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, marginBottom: 16 },
  mediaButtons: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  mediaBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 10, borderRadius: 20, backgroundColor: '#f5f5f5' },
  mediaBtnActive: { backgroundColor: '#E3F2FD' },
  mediaBtnText: { fontSize: 13, color: '#666' },
  mediaBtnTextActive: { color: '#007AFF', fontWeight: '600' },
});
