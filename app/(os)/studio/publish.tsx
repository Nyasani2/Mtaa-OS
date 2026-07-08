import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

interface StudioVideo {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: string;
  visibility: string;
  duration_seconds: number | null;
  tags: string[] | null;
}

export default function PublishScreen() {
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const [video, setVideo] = useState<StudioVideo | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoId) { router.back(); return; }
    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from('studio_videos')
        .select('*')
        .eq('id', videoId)
        .single();
      if (error) throw error;
      setVideo(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load video');
    } finally {
      setLoading(false);
    }
  };

  const publishVideo = async () => {
    if (!videoId) return;
    setPublishing(true);
    try {
      const { error } = await supabase
        .from('studio_videos')
        .update({
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', videoId);
      if (error) throw error;
      Alert.alert('Published!', 'Your video is now live.', [
        { text: 'View', onPress: () => router.replace('/(os)/studio/dashboard') },
        { text: 'Done', onPress: () => router.replace('/(os)/studio/dashboard') },
      ]);
    } catch (e) {
      Alert.alert('Error', 'Could not publish video');
    } finally {
      setPublishing(false);
    }
  };

  const scheduleVideo = () => {
    Alert.alert('Coming Soon', 'Scheduled publishing will be available in the next update.');
  };

  const formatDuration = (s: number | null) => {
    if (!s) return '0:00';
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator color="#6366f1" size="large" style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Publish</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View style={styles.thumbBox}>
            {video?.thumbnail_url ? (
              <Text style={styles.thumbText}>🎬</Text>
            ) : (
              <Feather name="film" size={32} color="#666" />
            )}
          </View>
          <View style={styles.previewInfo}>
            <Text style={styles.previewTitle} numberOfLines={2}>{video?.title || 'Untitled'}</Text>
            <Text style={styles.previewMeta}>{formatDuration(video?.duration_seconds || null)} • {video?.visibility}</Text>
            {video?.tags && video.tags.length > 0 && (
              <Text style={styles.previewTags}>{video.tags.slice(0, 3).join(' • ')}</Text>
            )}
          </View>
        </View>

        {/* Checklist */}
        <View style={styles.checklist}>
          <Text style={styles.checkTitle}>Before you publish</Text>
          <View style={styles.checkItem}>
            <Feather name={video?.title && video.title !== 'Untitled' ? 'check-circle' : 'circle'} size={18} color={video?.title && video.title !== 'Untitled' ? '#22c55e' : '#666'} />
            <Text style={styles.checkText}>Title added</Text>
          </View>
          <View style={styles.checkItem}>
            <Feather name={video?.description ? 'check-circle' : 'circle'} size={18} color={video?.description ? '#22c55e' : '#666'} />
            <Text style={styles.checkText}>Description added</Text>
          </View>
          <View style={styles.checkItem}>
            <Feather name={video?.thumbnail_url ? 'check-circle' : 'circle'} size={18} color={video?.thumbnail_url ? '#22c55e' : '#666'} />
            <Text style={styles.checkText}>Thumbnail set</Text>
          </View>
        </View>

        {/* Visibility Summary */}
        <View style={styles.visCard}>
          <Feather name={video?.visibility === 'public' ? 'globe' : video?.visibility === 'unlisted' ? 'link' : 'lock'} size={20} color="#6366f1" />
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={styles.visLabel}>Visibility</Text>
            <Text style={styles.visValue}>{video?.visibility?.charAt(0).toUpperCase()}{video?.visibility?.slice(1)}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push(`/(os)/studio/editor?videoId=${videoId}`)}>
            <Text style={styles.visEdit}>Edit</Text>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.publishBtn} onPress={publishVideo} disabled={publishing}>
            {publishing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="upload" size={18} color="#fff" />
                <Text style={styles.publishText}>Publish Now</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.scheduleBtn} onPress={scheduleVideo}>
            <Feather name="clock" size={18} color="#fff" />
            <Text style={styles.scheduleText}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.draftBtn} onPress={() => router.replace('/(os)/studio/dashboard')}>
            <Text style={styles.draftText}>Save as Draft & Exit</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  previewCard: { flexDirection: 'row', margin: 16, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 12, gap: 12 },
  thumbBox: { width: 80, height: 80, borderRadius: 8, backgroundColor: '#2a2a2a', alignItems: 'center', justifyContent: 'center' },
  thumbText: { fontSize: 32 },
  previewInfo: { flex: 1, justifyContent: 'center' },
  previewTitle: { color: '#fff', fontSize: 15, fontWeight: '600' },
  previewMeta: { color: '#9ca3af', fontSize: 13, marginTop: 4 },
  previewTags: { color: '#6366f1', fontSize: 12, marginTop: 4 },
  checklist: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16 },
  checkTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  checkText: { color: '#9ca3af', fontSize: 14 },
  visCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 20, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16 },
  visLabel: { color: '#9ca3af', fontSize: 12 },
  visValue: { color: '#fff', fontSize: 14, fontWeight: '600', marginTop: 2 },
  visEdit: { color: '#6366f1', fontSize: 14, fontWeight: '600' },
  actions: { marginHorizontal: 16, gap: 12 },
  publishBtn: { backgroundColor: '#6366f1', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  publishText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  scheduleBtn: { backgroundColor: '#1f1f1f', paddingVertical: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1, borderColor: '#2a2a2a' },
  scheduleText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  draftBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  draftText: { color: '#9ca3af', fontSize: 14, fontWeight: '600' },
});
