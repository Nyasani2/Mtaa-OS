import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface VideoComment {
  id: string;
  video_id: string;
  user_name: string;
  body: string;
  created_at: string;
  is_flagged: boolean;
  video_title: string;
}

export default function CommentsScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [filter, setFilter] = useState<'all' | 'flagged'>('all');
  const [loading, setLoading] = useState(true);

  const fetchComments = async () => {
    if (!user?.id) return;
    try {
      const query = supabase
        .from('studio_video_comments')
        .select(`
          id, video_id, user_name, body, created_at, is_flagged,
          studio_videos!inner(title)
        `)
        .eq('studio_videos.creator_id', user.id)
        .order('created_at', { ascending: false });

      if (filter === 'flagged') {
        query.eq('is_flagged', true);
      }

      const { data, error } = await query;
      if (error) throw error;

      const formatted = (data || []).map((c: any) => ({
        ...c,
        video_title: c.studio_videos?.title || 'Untitled',
      }));
      setComments(formatted);
    } catch (e) {
      console.error('Comments error:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchComments(); }, [user?.id, filter]);

  const deleteComment = async (id: string) => {
    Alert.alert('Delete Comment', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await supabase.from('studio_video_comments').delete().eq('id', id);
            setComments(prev => prev.filter(c => c.id !== id));
          } catch (e) {
            Alert.alert('Error', 'Could not delete comment');
          }
        },
      },
    ]);
  };

  const toggleFlag = async (id: string, current: boolean) => {
    try {
      await supabase.from('studio_video_comments').update({ is_flagged: !current }).eq('id', id);
      setComments(prev => prev.map(c => c.id === id ? { ...c, is_flagged: !current } : c));
    } catch (e) {
      console.error('Flag error:', e);
    }
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const renderItem = ({ item }: { item: VideoComment }) => (
    <View style={[styles.commentCard, item.is_flagged && styles.flaggedCard]}>
      <View style={styles.commentHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.user_name.charAt(0).toUpperCase()}</Text>
          </View>
          <View>
            <Text style={styles.userName}>{item.user_name}</Text>
            <Text style={styles.videoName} numberOfLines={1}>{item.video_title}</Text>
          </View>
        </View>
        <Text style={styles.date}>{formatDate(item.created_at)}</Text>
      </View>
      <Text style={styles.commentBody}>{item.body}</Text>
      <View style={styles.commentActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => toggleFlag(item.id, item.is_flagged)}>
          <Feather name={item.is_flagged ? 'flag' : 'minus-circle'} size={14} color={item.is_flagged ? '#ef4444' : '#9ca3af'} />
          <Text style={[styles.actionText, item.is_flagged && styles.flaggedText]}>
            {item.is_flagged ? 'Flagged' : 'Flag'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => deleteComment(item.id)}>
          <Feather name="trash-2" size={14} color="#ef4444" />
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        <TouchableOpacity style={[styles.filterBtn, filter === 'all' && styles.filterBtnActive]} onPress={() => setFilter('all')}>
          <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterBtn, filter === 'flagged' && styles.filterBtnActive]} onPress={() => setFilter('flagged')}>
          <Text style={[styles.filterText, filter === 'flagged' && styles.filterTextActive]}>Flagged</Text>
        </TouchableOpacity>
      </View>

      {comments.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Feather name="message-circle" size={48} color="#666" />
          <Text style={styles.emptyText}>No comments yet</Text>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={c => c.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  filterRow: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 16, backgroundColor: '#1f1f1f', borderWidth: 1, borderColor: '#2a2a2a' },
  filterBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  filterText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  filterTextActive: { color: '#fff' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  emptyText: { color: '#666', fontSize: 16 },
  commentCard: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 14, marginBottom: 10 },
  flaggedCard: { borderLeftWidth: 3, borderLeftColor: '#ef4444' },
  commentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  userInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#6366f1', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  userName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  videoName: { color: '#666', fontSize: 12, marginTop: 1, maxWidth: 180 },
  date: { color: '#666', fontSize: 11 },
  commentBody: { color: '#e5e5e5', fontSize: 14, lineHeight: 20, marginBottom: 10 },
  commentActions: { flexDirection: 'row', gap: 16 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { color: '#9ca3af', fontSize: 12 },
  flaggedText: { color: '#ef4444' },
});
