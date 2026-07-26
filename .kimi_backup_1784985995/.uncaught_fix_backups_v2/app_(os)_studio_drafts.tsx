import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, Image, Alert, RefreshControl
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface Draft {
  id: string;
  title: string;
  thumbnail_url: string | null;
  type: 'video' | 'music' | 'podcast' | 'course';
  status: 'draft' | 'scheduled';
  scheduled_for: string | null;
  updated_at: string;
  progress: number;
}

export default function DraftsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDrafts, setSelectedDrafts] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);

  const fetchDrafts = async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('studio_videos')
      .select('id, title, thumbnail_url, status, scheduled_for, updated_at, type')
      .eq('creator_id', user.id)
      .in('status', ['draft', 'scheduled'])
      .order('updated_at', { ascending: false });

    if (!error) {
      setDrafts((data || []).map((d: any) => ({
        id: d.id,
        title: d.title || 'Untitled Draft',
        thumbnail_url: d.thumbnail_url,
        type: d.type || 'video',
        status: d.status,
        scheduled_for: d.scheduled_for,
        updated_at: d.updated_at,
        progress: Math.floor(Math.random() * 100),
      })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchDrafts(); }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDrafts();
    setRefreshing(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedDrafts(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const deleteDrafts = async () => {
    const ids = Array.from(selectedDrafts);
    Alert.alert('Delete Drafts', `Delete ${ids.length} draft${ids.length !== 1 ? 's' : ''}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await supabase.from('studio_videos').delete().in('id', ids);
          setSelectedDrafts(new Set());
          setSelectionMode(false);
          fetchDrafts();
        },
      },
    ]);
  };

  const duplicateDraft = async (draft: Draft) => {
    const { data: original } = await supabase.from('studio_videos').select('*').eq('id', draft.id).single();
    if (original) {
      const { id, created_at, updated_at, ...rest } = original;
      await supabase.from('studio_videos').insert({ ...rest, title: `${rest.title} (Copy)`, status: 'draft' });
      fetchDrafts();
    }
  };

  const publishDraft = async (id: string) => {
    await supabase.from('studio_videos').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id);
    fetchDrafts();
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderDraft = ({ item }: { item: Draft }) => (
    <TouchableOpacity
      onPress={() => selectionMode ? toggleSelection(item.id) : router.push(`/(os)/studio/editor?id=${item.id}`)}
      onLongPress={() => {
        setSelectionMode(true);
        toggleSelection(item.id);
      }}
      style={{
        flexDirection: 'row',
        padding: 12,
        backgroundColor: selectedDrafts.has(item.id) ? '#1a1a1a' : 'transparent',
        borderBottomWidth: 1,
        borderBottomColor: '#1a1a1a',
      }}
    >
      {/* Thumbnail */}
      <View style={{ width: 120, height: 68, borderRadius: 6, overflow: 'hidden', backgroundColor: '#1a1a1a', marginRight: 12 }}>
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="film" size={20} color="#444" />
          </View>
        )}
        {item.status === 'scheduled' && (
          <View style={{ position: 'absolute', bottom: 4, right: 4, backgroundColor: 'rgba(0,0,0,0.8)', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
            <Text style={{ color: '#fff', fontSize: 9 }}>SCHED</Text>
          </View>
        )}
      </View>

      {/* Info */}
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={{ color: '#fff', fontSize: 14, fontWeight: '500' }} numberOfLines={2}>{item.title}</Text>
        <Text style={{ color: '#666', fontSize: 11, marginTop: 4 }}>
          {item.type.charAt(0).toUpperCase() + item.type.slice(1)} • Edited {formatDate(item.updated_at)}
        </Text>
        {item.scheduled_for && (
          <Text style={{ color: '#ff6b6b', fontSize: 11, marginTop: 2 }}>
            <Feather name="clock" size={10} /> Scheduled for {formatDate(item.scheduled_for)}
          </Text>
        )}
      </View>

      {/* Actions */}
      {!selectionMode && (
        <View style={{ justifyContent: 'center', gap: 8 }}>
          <TouchableOpacity onPress={() => publishDraft(item.id)}>
            <Feather name="upload-cloud" size={18} color="#00ff00" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => duplicateDraft(item)}>
            <Feather name="copy" size={18} color="#888" />
          </TouchableOpacity>
        </View>
      )}

      {selectionMode && (
        <View style={{ justifyContent: 'center' }}>
          <MaterialCommunityIcons
            name={selectedDrafts.has(item.id) ? 'checkbox-marked' : 'checkbox-blank-outline'}
            size={24}
            color={selectedDrafts.has(item.id) ? '#ff0000' : '#555'}
          />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0a0a0a' }} edges={['top']}>
      {/* Header */}
      <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1a1a1a' }}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>Drafts</Text>
        {selectionMode ? (
          <View style={{ flexDirection: 'row', gap: 16 }}>
            <TouchableOpacity onPress={deleteDrafts}>
              <Feather name="trash-2" size={22} color="#ff0000" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setSelectionMode(false); setSelectedDrafts(new Set()); }}>
              <Text style={{ color: '#fff', fontSize: 14 }}>Done</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setSelectionMode(true)}>
            <Text style={{ color: '#ff0000', fontSize: 14 }}>Select</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Drafts List */}
      <FlatList
        data={drafts}
        keyExtractor={item => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#ff0000" />}
        renderItem={renderDraft}
        ListEmptyComponent={
          <View style={{ padding: 60, alignItems: 'center' }}>
            <Feather name="file-text" size={48} color="#333" />
            <Text style={{ color: '#666', marginTop: 16, fontSize: 16 }}>No drafts yet</Text>
            <Text style={{ color: '#444', marginTop: 4, fontSize: 13 }}>Start creating content</Text>
            <TouchableOpacity
              onPress={() => router.push('/(os)/studio/upload-center')}
              style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: 'bold' }}>Create New</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}
