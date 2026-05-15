import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  created_at: string;
  folder: string;
}

export default function DocumentsScreen() {
  const { user } = useAuthStore();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [currentFolder, setCurrentFolder] = useState('root');

  useEffect(() => {
    fetchDocuments();
  }, [currentFolder]);

  const fetchDocuments = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .eq('folder', currentFolder)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
      return;
    }

    setDocuments(data || []);
  };

  const handleDelete = async (id: string) => {
    Alert.alert(
      'Delete Document',
      'Are you sure? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('documents').delete().eq('id', id);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setDocuments(docs => docs.filter(d => d.id !== id));
            }
          }
        }
      ]
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocs = documents.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  const renderItem = ({ item }: { item: Document }) => (
    <TouchableOpacity 
      style={styles.docItem}
      onPress={() => router.push({ pathname: '/(os)/documents/preview', params: { id: item.id } })}
      onLongPress={() => handleDelete(item.id)}
    >
      <Text style={styles.docIcon}>
        {item.type.includes('pdf') ? '📄' : item.type.includes('image') ? '🖼️' : '📁'}
      </Text>
      <View style={styles.docInfo}>
        <Text style={styles.docName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.docMeta}>{formatSize(item.size)} • {new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Documents</Text>
      
      <TextInput
        style={styles.searchInput}
        placeholder="Search documents..."
        placeholderTextColor="#888"
        value={search}
        onChange={setSearch}
      />

      {currentFolder !== 'root' && (
        <TouchableOpacity style={styles.backButton} onPress={() => setCurrentFolder('root')}>
          <Text style={styles.backText}>← Back to Root</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filteredDocs}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No documents found</Text>
              <Text style={styles.emptySub}>Long press to delete • Tap to preview</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/(os)/documents/folder')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  searchInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  backButton: { paddingHorizontal: 16, marginBottom: 8 },
  backText: { color: '#6366f1', fontSize: 14 },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  docItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  docIcon: { fontSize: 24, marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { color: '#fff', fontSize: 15, fontWeight: '500' },
  docMeta: { color: '#888', fontSize: 12, marginTop: 2 },
  chevron: { color: '#666', fontSize: 18 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6366f1',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  fabText: { color: '#fff', fontSize: 24, fontWeight: '300' },
});
