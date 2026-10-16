import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function UploadAudioScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'music' | 'podcast'>('music');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'audio/*',
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleUpload = async () => {
    if (!title.trim() || !selectedFile || !user?.id) {
      Alert.alert('Error', 'Please provide a title and select an audio file.');
      return;
    }
    setUploading(true);
    try {
      // 1. Upload file to Supabase Storage
      const response = await fetch(selectedFile.uri);
      const blob = await response.blob();
      const fileName = `${user.id}/${Date.now()}-${selectedFile.name}`;
      const bucket = type === 'music' ? 'music' : 'podcasts';
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, blob, { contentType: selectedFile.mimeType || 'audio/mpeg' });
      
      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
      
      // 3. Save record to database
      const { error: dbError } = await supabase.from('studio_tracks').insert({
        creator_id: user.id,
        title: title.trim(),
        audio_url: urlData.publicUrl,
        track_type: type,
        created_at: new Date().toISOString(),
      });

      if (dbError) throw dbError;
      Alert.alert('Success', `${type === 'music' ? 'Track' : 'Episode'} uploaded successfully!`);
      router.back();
    } catch (e: any) {
      Alert.alert('Upload Failed', e.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Upload {type === 'music' ? 'Music' : 'Podcast'}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Title *</Text>
        <TextInput style={styles.input} placeholder="Enter title..." placeholderTextColor="#666" value={title} onChangeText={setTitle} />

        <Text style={styles.label}>Type</Text>
        <View style={styles.row}>
          <TouchableOpacity style={[styles.chip, type === 'music' && styles.chipActive]} onPress={() => setType('music')}>
            <Text style={[styles.chipText, type === 'music' && styles.chipTextActive]}>Music</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.chip, type === 'podcast' && styles.chipActive]} onPress={() => setType('podcast')}>
            <Text style={[styles.chipText, type === 'podcast' && styles.chipTextActive]}>Podcast</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Audio File *</Text>
        <TouchableOpacity style={styles.fileBtn} onPress={pickFile}>
          <Ionicons name="musical-note" size={24} color={selectedFile ? '#10b981' : '#888'} />
          <Text style={[styles.fileText, selectedFile && { color: '#10b981' }]}>
            {selectedFile ? selectedFile.name : 'Tap to select audio file'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.uploadBtn, uploading && styles.disabledBtn]} onPress={handleUpload} disabled={uploading}>
          {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.uploadText}>Upload {type === 'music' ? 'Track' : 'Episode'}</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  form: { padding: 20 },
  label: { color: '#888', fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#333' },
  row: { flexDirection: 'row', gap: 12 },
  chip: { flex: 1, padding: 14, borderRadius: 12, backgroundColor: '#1a1a1a', alignItems: 'center', borderWidth: 1, borderColor: '#333' },
  chipActive: { borderColor: '#ff0040', backgroundColor: '#2a0a10' },
  chipText: { color: '#888', fontWeight: '600' },
  chipTextActive: { color: '#ff0040' },
  fileBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333', borderStyle: 'dashed' },
  fileText: { color: '#888', fontSize: 14, marginLeft: 12, flex: 1 },
  uploadBtn: { backgroundColor: '#ff0040', borderRadius: 12, padding: 18, alignItems: 'center', marginTop: 32 },
  disabledBtn: { opacity: 0.6 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
