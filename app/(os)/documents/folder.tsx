import { useState } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, TextInput, 
  ActivityIndicator, Alert 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';
import * as DocumentPicker from 'expo-document-picker';

export default function FolderScreen() {
  const { user } = useAuthStore();
  const [name, setName] = useState('');
  const [uploading, setUploading] = useState(false);

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      setName(file.name);
      
      setUploading(true);
      
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      const filePath = `${user?.id}/${Date.now()}_${file.name}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, formData);

      if (uploadError) {
        Alert.alert('Upload Failed', uploadError.message);
        setUploading(false);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          user_id: user?.id,
          name: file.name,
          type: file.mimeType || 'unknown',
          size: file.size || 0,
          url: publicUrl,
          folder: 'root',
          created_at: new Date().toISOString(),
        });

      setUploading(false);

      if (dbError) {
        Alert.alert('Error', dbError.message);
      } else {
        Alert.alert('Uploaded', 'Document saved successfully', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      }
    } catch (e) {
      Alert.alert('Error', 'Could not pick document');
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload Document</Text>
      <Text style={styles.subtitle}>Add a file to your documents</Text>

      <View style={styles.uploadBox}>
        <Text style={styles.uploadIcon}>📁</Text>
        <Text style={styles.uploadText}>Tap below to select a file</Text>
        <Text style={styles.uploadSub}>Supported: PDF, images, documents</Text>
      </View>

      {name ? (
        <View style={styles.filePreview}>
          <Text style={styles.fileName}>📄 {name}</Text>
        </View>
      ) : null}

      <TouchableOpacity 
        style={[styles.uploadButton, uploading && styles.uploadButtonDisabled]} 
        onPress={handlePickDocument}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>📎 Select File</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()} disabled={uploading}>
        <Text style={styles.backText}>← Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a', padding: 24, paddingTop: 48 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#888', marginBottom: 32 },
  uploadBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  uploadIcon: { fontSize: 48, marginBottom: 12 },
  uploadText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  uploadSub: { color: '#888', fontSize: 12, marginTop: 4 },
  filePreview: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  fileName: { color: '#fff', fontSize: 14 },
  uploadButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  uploadButtonDisabled: { opacity: 0.6 },
  uploadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  backButton: { marginTop: 16, alignItems: 'center' },
  backText: { color: '#888', fontSize: 14 },
});
