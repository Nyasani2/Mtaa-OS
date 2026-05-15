import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Alert, Share 
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { WebView } from 'react-native-webview';

export default function DocumentPreviewScreen() {
  const { id } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [doc, setDoc] = useState<any>(null);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    if (!id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('id', id)
      .single();

    setLoading(false);

    if (error) {
      Alert.alert('Error', 'Document not found');
      return;
    }

    setDoc(data);
  };

  const handleShare = async () => {
    if (!doc) return;
    try {
      await Share.share({
        title: doc.name,
        message: `Document: ${doc.name}`,
      });
    } catch (e) {
      // ignore
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Document',
      'This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('documents')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.back();
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 100 }} />
      </View>
    );
  }

  if (!doc) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Document not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>{doc.name}</Text>
        <Text style={styles.meta}>{doc.type} • {(doc.size / 1024).toFixed(1)} KB</Text>
      </View>

      <View style={styles.previewArea}>
        {doc.type?.includes('pdf') ? (
          <WebView source={{ uri: doc.url }} style={styles.webview} />
        ) : doc.type?.includes('image') ? (
          <Image source={{ uri: doc.url }} style={styles.imagePreview} resizeMode="contain" />
        ) : (
          <View style={styles.unsupported}>
            <Text style={styles.unsupportedText}>📄</Text>
            <Text style={styles.unsupportedSub}>Preview not available for this file type</Text>
            <Text style={styles.unsupportedSub}>Download to view</Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleShare}>
          <Text style={styles.actionText}>📤 Share</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionBtn, styles.dangerBtn]} onPress={handleDelete}>
          <Text style={[styles.actionText, styles.dangerText]}>🗑️ Delete</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { padding: 16, paddingTop: 48, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  title: { color: '#fff', fontSize: 18, fontWeight: '600' },
  meta: { color: '#888', fontSize: 12, marginTop: 4 },
  previewArea: { flex: 1 },
  webview: { flex: 1 },
  imagePreview: { flex: 1, width: '100%' },
  unsupported: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  unsupportedText: { fontSize: 48, marginBottom: 16 },
  unsupportedSub: { color: '#888', fontSize: 14, marginBottom: 4 },
  actions: { flexDirection: 'row', gap: 12, padding: 16, borderTopWidth: 1, borderTopColor: '#1a1a1a' },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  dangerBtn: { borderColor: '#ef4444' },
  actionText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  dangerText: { color: '#ef4444' },
  backButton: { padding: 16, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
  errorText: { color: '#ef4444', fontSize: 16, textAlign: 'center', marginTop: 100 },
});
