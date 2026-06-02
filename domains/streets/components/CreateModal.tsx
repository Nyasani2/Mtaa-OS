import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, Image, StyleSheet, ScrollView } from 'react-native';
import { useCreate } from '../hooks/useCreate';

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
}

export function CreateModal({ visible, onClose }: CreateModalProps) {
  const { draft, updateDraft, addMedia, removeMedia, mediaPreview, createPost } = useCreate();
  const [caption, setCaption] = useState('');

  if (!visible) return null;

  const handlePublish = () => {
    createPost.mutate({ caption, mediaUris: mediaPreview });
    onClose();
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modal}>
        <View style={styles.header}>
          <Pressable onPress={onClose}><Text style={styles.closeBtn}>✕</Text></Pressable>
          <Text style={styles.title}>New Post</Text>
          <Pressable onPress={handlePublish} disabled={createPost.isPending}>
            <Text style={[styles.publishBtn, createPost.isPending && styles.disabled]}>Publish</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="What's happening?"
          multiline
          value={caption}
          onChangeText={setCaption}
        />

        <ScrollView horizontal style={styles.mediaPreview}>
          {mediaPreview.map((uri, idx) => (
            <View key={idx} style={styles.previewItem}>
              <Image source={{ uri }} style={styles.previewImage} />
              <Pressable onPress={() => removeMedia(idx)} style={styles.removeBtn}>
                <Text style={styles.removeText}>✕</Text>
              </Pressable>
            </View>
          ))}
        </ScrollView>

        <View style={styles.toolbar}>
          <Pressable style={styles.toolBtn}><Text>📷 Camera</Text></Pressable>
          <Pressable style={styles.toolBtn}><Text>🎬 Video</Text></Pressable>
          <Pressable style={styles.toolBtn}><Text>📁 Gallery</Text></Pressable>
          <Pressable style={styles.toolBtn}><Text>🎙️ Audio</Text></Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modal: { backgroundColor: '#fff', width: '90%', maxHeight: '80%', borderRadius: 16, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  closeBtn: { fontSize: 20, padding: 4 },
  title: { fontSize: 16, fontWeight: '700' },
  publishBtn: { color: '#E91E63', fontWeight: '700' },
  disabled: { opacity: 0.5 },
  input: { minHeight: 80, borderWidth: 1, borderColor: '#eee', borderRadius: 8, padding: 12, fontSize: 14, textAlignVertical: 'top' },
  mediaPreview: { flexDirection: 'row', marginVertical: 12 },
  previewItem: { marginRight: 8, position: 'relative' },
  previewImage: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: { position: 'absolute', top: -4, right: -4, backgroundColor: '#000', borderRadius: 10, width: 20, height: 20, justifyContent: 'center', alignItems: 'center' },
  removeText: { color: '#fff', fontSize: 10 },
  toolbar: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  toolBtn: { padding: 8 },
});
