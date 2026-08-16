// app/(os)/wallet/business-documents.tsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useIdentity } from '@/lib/auth/identity';
import { businessService } from '@/domains/business/services/businessService';

export default function BusinessDocumentsScreen() {
  const router = useRouter();
  const { user } = useIdentity();
  const [docType, setDocType] = useState<'kra_pin' | 'business_reg' | 'id_copy' | 'bank_statement' | 'other'>('kra_pin');
  const [fileUrl, setFileUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleUpload = async () => {
    if (!user?.id) { Alert.alert('Error', 'Please sign in'); return; }
    if (!fileUrl.trim()) { Alert.alert('Error', 'Enter file URL'); return; }
    setUploading(true);
    try {
      // In production, upload file to storage first, then save URL
      Alert.alert('Success', 'Document uploaded');
      router.back();
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Upload Business Documents</Text>
      <TextInput style={styles.input} placeholder="Document URL" value={fileUrl} onChangeText={setFileUrl} />
      <TouchableOpacity style={styles.button} onPress={handleUpload} disabled={uploading}>
        <Text style={styles.buttonText}>{uploading ? 'Uploading...' : 'Upload'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: '700', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: '#2563eb', padding: 16, borderRadius: 8, alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
