import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface DraftVideo {
  id: string;
  title: string;
  status: string;
  created_at: string;
  duration_seconds: number | null;
}

export default function DraftsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [drafts, setDrafts] = useState<DraftVideo[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDrafts = async () => {
    if (!user?.id) return;
    try {
      const { data, error } = await supabase
        .from('studio_videos')
        .select('id, title, status, created_at, duration_seconds')
        .eq('creator_id', user.id)
        .eq('status', 'draft')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setDrafts(data || []);
    } catch (e) {
      console.error('Fetch drafts error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchDrafts(); }, [user?.id]);

  const deleteDraft = async (id: string) => {
    try {
      await supabase.from('studio_videos').delete().eq('id', id);
      setDrafts(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error('Delete draft error:', e);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDuration = (s: number | null) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const renderItem = ({ item }: { item: DraftVideo }) => (
    <TouchableOpacity
      style={styles.draftCard}
      onPress={() => router.push(`/(os)/studio/editor?videoId=${item.id}`)}
    >
      <View style={styles.thumb}>
        <Feather name="film" size={24} color="#666" />
      </View>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>{item.title || 'Untitled'}</Text>
        <Text style={styles.meta}>{formatDuration(item.duration_seconds)} • {formatDate(item.created_at)}</Text>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteDraft(item.id)}>
        <Feather name="trash-2" size={18} color="#ef4444" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Drafts</Text>
        <View style={{ width: 24 }} />
      </View>

      {drafts.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Feather name="file-minus" size={48} color="#666" />
          <Text style={styles.emptyText}>No drafts yet</Text>
          <Text style={styles.emptySub}>Record a video to get started</Text>
          <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/studio/camera')}>
            <Text style={styles.emptyBtnText}>Record Video</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={drafts}
          keyExtractor={d => d.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDrafts(); }} tintColor="#6366f1" />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: 40 },
  emptyText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  emptySub: { color: '#666', fontSize: 14 },
  emptyBtn: { marginTop: 8, backgroundColor: '#6366f1', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  draftCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1f1f1f', borderRadius: 12, padding: 12, marginBottom: 10 },
  thumb: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, marginLeft: 12 },
  title: { color: '#fff', fontSize: 15, fontWeight: '600' },
  meta: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  deleteBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
});
