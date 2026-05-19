import { useState, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, FlatList, 
  ActivityIndicator, Alert, TextInput 
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/stores/auth-store';

interface ApiKey {
  id: string;
  name: string;
  key_preview: string;
  created_at: string;
  last_used: string | null;
  permissions: string[];
}

export default function ApiKeysScreen() {
  const { user } = useAuthStore();
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    if (!user?.id) return;
    setLoading(true);

    const { data, error } = await supabase
      .from('api_keys')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    setLoading(false);

    if (error) {
      setKeys([]);
      return;
    }

    if (data) {
      setKeys(data.map((k: any) => ({
        id: k.id,
        name: k.name,
        key_preview: k.key_preview || '****',
        created_at: k.created_at,
        last_used: k.last_used,
        permissions: k.permissions || [],
      })));
    }
  };

  const handleCreate = async () => {
    if (!newKeyName.trim()) {
      Alert.alert('Name Required', 'Please enter a name for this API key');
      return;
    }

    setCreating(true);
    const keyValue = 'mtaa_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    const { error } = await supabase
      .from('api_keys')
      .insert({
        user_id: user?.id,
        name: newKeyName.trim(),
        key_hash: keyValue, // In production, hash this
        key_preview: keyValue.slice(0, 8) + '...',
        permissions: ['read'],
        created_at: new Date().toISOString(),
      });

    setCreating(false);
    setShowCreate(false);
    setNewKeyName('');

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Created', `Your new API key: ${keyValue}\n\nCopy it now — it won't be shown again.`);
      fetchKeys();
    }
  };

  const handleRevoke = async (id: string) => {
    Alert.alert(
      'Revoke Key',
      'This key will stop working immediately.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Revoke',
          style: 'destructive',
          onPress: async () => {
            const { error } = await supabase
              .from('api_keys')
              .delete()
              .eq('id', id);

            if (error) {
              Alert.alert('Error', error.message);
            } else {
              setKeys(keys.filter(k => k.id !== id));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: ApiKey }) => (
    <View style={styles.keyCard}>
      <View style={styles.keyHeader}>
        <Text style={styles.keyName}>{item.name}</Text>
        <TouchableOpacity onPress={() => handleRevoke(item.id)}>
          <Text style={styles.revokeText}>Revoke</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.keyPreview}>{item.key_preview}</Text>
      <Text style={styles.keyMeta}>
        Created: {new Date(item.created_at).toLocaleDateString()}
        {item.last_used && ` • Last used: ${new Date(item.last_used).toLocaleDateString()}`}
      </Text>
      <View style={styles.permsRow}>
        {item.permissions.map(p => (
          <View key={p} style={styles.permBadge}>
            <Text style={styles.permText}>{p}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>API Keys</Text>

      {showCreate ? (
        <View style={styles.createBox}>
          <TextInput
            style={styles.createInput}
            placeholder="Key name (e.g. Production)"
            placeholderTextColor="#888"
            value={newKeyName}
            onChangeText={setNewKeyName}
          />
          <View style={styles.createActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowCreate(false)}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.createBtn, creating && styles.createBtnDisabled]} 
              onPress={handleCreate}
              disabled={creating}
            >
              <Text style={styles.createBtnText}>{creating ? 'Creating...' : 'Create'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowCreate(true)}>
          <Text style={styles.addButtonText}>+ Generate New Key</Text>
        </TouchableOpacity>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#6366f1" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={keys}
          renderItem={renderItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No API keys</Text>
              <Text style={styles.emptySub}>Generate a key to access MTAA APIs</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
        <Text style={styles.backText}>← Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', padding: 16, paddingTop: 48 },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  createBox: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  createInput: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  createActions: { flexDirection: 'row', gap: 8 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  cancelBtnText: { color: '#fff', fontSize: 14 },
  createBtn: {
    flex: 1,
    backgroundColor: '#6366f1',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 100 },
  keyCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  keyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  keyName: { color: '#fff', fontSize: 15, fontWeight: '600' },
  revokeText: { color: '#ef4444', fontSize: 13 },
  keyPreview: { color: '#6366f1', fontSize: 14, fontFamily: 'monospace', marginBottom: 4 },
  keyMeta: { color: '#888', fontSize: 12, marginBottom: 8 },
  permsRow: { flexDirection: 'row', gap: 6 },
  permBadge: {
    backgroundColor: '#6366f120',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  permText: { color: '#6366f1', fontSize: 11, fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { color: '#666', fontSize: 16 },
  emptySub: { color: '#444', fontSize: 12, marginTop: 8 },
  backButton: { marginTop: 24, marginBottom: 40, alignItems: 'center' },
  backText: { color: '#6366f1', fontSize: 14 },
});
