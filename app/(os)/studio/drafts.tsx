import React, { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useMDrafts } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioDraftsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { drafts, load, remove, loading } = useMDrafts(user?.id);

  useEffect(() => { load(); }, []);

  const handleDelete = (id: string) => {
    Alert.alert('Delete Draft', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(id) },
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a', padding: 16, paddingTop: 48 }}>
      <Text style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 16 }}>Drafts</Text>

      <FlatList
        data={drafts}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/(os)/studio/editor?videoId=${item.video_id || ''}`)}
            style={{ backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 12 }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600' }} numberOfLines={1}>{item.title || 'Untitled Draft'}</Text>
                <Text style={{ color: '#888', fontSize: 12, marginTop: 4 }}>{item.content_type} • Last edited {new Date(item.last_edited_at).toLocaleDateString()}</Text>
              </View>
              <TouchableOpacity onPress={() => handleDelete(item.id)} style={{ padding: 8 }}>
                <Text style={{ color: '#ff6b6b', fontSize: 12 }}>Delete</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: '#666', textAlign: 'center', padding: 32 }}>No drafts saved.</Text>}
      />
    </View>
  );
}
