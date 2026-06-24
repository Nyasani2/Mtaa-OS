import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image,
  ActivityIndicator, RefreshControl, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

interface Draft {
  id: string;
  content: string;
  media_url: string | null;
  media_type: 'video' | 'image' | 'text' | null;
  is_public: boolean;
  created_at: string;
}

export default function DraftsScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setDrafts([]); return; }

      const { data, error } = await supabase
        .from('streets_drafts')
        .select('id, content, media_url, media_type, is_public, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDrafts(data || []);
    } catch (e) {
      console.error('Drafts error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDrafts();
  }, [loadDrafts]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    loadDrafts();
  }, [loadDrafts]);

  const deleteDraft = async (draftId: string) => {
    Alert.alert('Delete Draft', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('streets_drafts').delete().eq('id', draftId);
          loadDrafts();
        },
      },
    ]);
  };

  const publishDraft = async (draft: Draft) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('streets_posts').insert({
        user_id: user.id,
        content: draft.content,
        media_url: draft.media_url,
        media_type: draft.media_type,
        likes_count: 0,
        comments_count: 0,
        is_public: draft.is_public,
      });

      if (error) throw error;
      await supabase.from('streets_drafts').delete().eq('id', draft.id);
      Alert.alert('Published!', 'Your draft is now live.');
      loadDrafts();
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  };

  const renderItem = ({ item }: { item: Draft }) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
      {item.media_url ? (
        <Image source={{ uri: item.media_url }} style={{ width: 60, height: 60, borderRadius: 8 }} />
      ) : (
        <View style={{ width: 60, height: 60, borderRadius: 8, backgroundColor: '#1a1a1a', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="document-text" size={24} color="#666" />
        </View>
      )}
      <View style={{ marginLeft: 12, flex: 1 }}>
        <Text style={{ color: '#fff', fontSize: 14 }} numberOfLines={2}>{item.content || 'No caption'}</Text>
        <Text style={{ color: '#666', fontSize: 12, marginTop: 4 }}>{new Date(item.created_at).toLocaleDateString()}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <TouchableOpacity onPress={() => publishDraft(item)} style={{ backgroundColor: '#00d4ff', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Text style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>Publish</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => deleteDraft(item.id)} style={{ backgroundColor: '#333', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
          <Ionicons name="trash" size={14} color="#ff3040" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      <View style={{ paddingTop: 50, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#222' }}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 24, fontWeight: '700' }}>Drafts</Text>
      </View>

      <FlatList
        data={drafts}
        keyExtractor={d => d.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#fff" />}
        ListEmptyComponent={!loading ? (
          <View style={{ paddingTop: 60, alignItems: 'center' }}>
            <Ionicons name="document-text" size={48} color="#333" />
            <Text style={{ color: '#666', fontSize: 16, marginTop: 12 }}>No drafts</Text>
            <Text style={{ color: '#888', fontSize: 14, marginTop: 4 }}>Save a draft while creating a post</Text>
          </View>
        ) : <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />}
      />
    </View>
  );
}
