import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Draft {
  id: string;
  title: string;
  type: 'video' | 'audio' | 'thumbnail';
  lastEdited: string;
  progress: number;
  autoSaved: boolean;
}

export default function DraftsManagerScreen() {
  const router = useRouter();
  const [drafts, setDrafts] = useState<Draft[]>([
    { id: '1', title: 'Mombasa Sunset Vlog', type: 'video', lastEdited: '2 hours ago', progress: 75, autoSaved: true },
    { id: '2', title: 'Afrobeat Instrumental', type: 'audio', lastEdited: '1 day ago', progress: 40, autoSaved: true },
    { id: '3', title: 'Street Food Thumbnail', type: 'thumbnail', lastEdited: '3 days ago', progress: 90, autoSaved: false },
    { id: '4', title: 'Kibera Documentary', type: 'video', lastEdited: '1 week ago', progress: 20, autoSaved: true },
  ]);

  const handleResume = (draft: Draft) => {
    if (draft.type === 'video') router.push('/(os)/studio/editor');
    else if (draft.type === 'audio') router.push('/(os)/studio/music');
    else if (draft.type === 'thumbnail') router.push('/(os)/studio/thumbnail');
  };

  const handleDelete = (draftId: string) => {
    Alert.alert('Delete Draft?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setDrafts((prev) => prev.filter((d) => d.id !== draftId)) },
    ]);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video': return 'videocam';
      case 'audio': return 'musical-note';
      case 'thumbnail': return 'image';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video': return '#3B82F6';
      case 'audio': return '#A855F7';
      case 'thumbnail': return '#22C55E';
      default: return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📝 Drafts</Text>
        <Text style={styles.headerSubtitle}>{drafts.length} drafts</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {drafts.map((draft) => (
          <View key={draft.id} style={styles.draftCard}>
            <View style={[styles.draftIcon, { backgroundColor: getTypeColor(draft.type) + '20' }]}>
              <Ionicons name={getTypeIcon(draft.type)} size={22} color={getTypeColor(draft.type)} />
            </View>
            <View style={styles.draftInfo}>
              <Text style={styles.draftTitle}>{draft.title}</Text>
              <View style={styles.draftMeta}>
                <Text style={styles.draftType}>{draft.type.toUpperCase()}</Text>
                <Text style={styles.draftDot}>•</Text>
                <Text style={styles.draftTime}>{draft.lastEdited}</Text>
                {draft.autoSaved && (
                  <>
                    <Text style={styles.draftDot}>•</Text>
                    <Text style={styles.draftAutoSaved}>Auto-saved</Text>
                  </>
                )}
              </View>
              {/* Progress Bar */}
              <View style={styles.progressWrap}>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${draft.progress}%` }]} />
                </View>
                <Text style={styles.progressText}>{draft.progress}%</Text>
              </View>
            </View>
            <View style={styles.draftActions}>
              <TouchableOpacity style={styles.resumeBtn} onPress={() => handleResume(draft)}>
                <Text style={styles.resumeText}>Resume</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(draft.id)}>
                <Ionicons name="trash-outline" size={18} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {drafts.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color="#475569" />
            <Text style={styles.emptyText}>No drafts yet</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={() => router.push('/(os)/studio/camera')}>
              <Text style={styles.emptyBtnText}>Start Creating</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  backBtn: { padding: 8, alignSelf: 'flex-start' },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', marginTop: 4 },
  headerSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  draftCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  draftIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  draftInfo: { flex: 1 },
  draftTitle: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  draftMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  draftType: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  draftDot: { fontSize: 10, color: '#475569' },
  draftTime: { fontSize: 11, color: '#94A3B8' },
  draftAutoSaved: { fontSize: 11, color: '#22C55E', fontWeight: '600' },
  progressWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  progressBg: {
    flex: 1, height: 6, backgroundColor: '#0F172A',
    borderRadius: 3, overflow: 'hidden',
  },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 3 },
  progressText: { fontSize: 11, color: '#64748B', fontWeight: '600' },
  draftActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  resumeBtn: {
    backgroundColor: '#3B82F620', paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 8, borderWidth: 1, borderColor: '#3B82F640',
  },
  resumeText: { fontSize: 12, color: '#3B82F6', fontWeight: '600' },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#64748B', marginTop: 12 },
  emptyBtn: {
    marginTop: 16, backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
});
