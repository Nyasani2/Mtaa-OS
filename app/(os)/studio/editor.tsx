import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface TimelineClip {
  id: string;
  name: string;
  duration: number; // seconds
  color: string;
}

const FILTERS = [
  { id: 'none', name: 'None', icon: 'sunny' },
  { id: 'vivid', name: 'Vivid', icon: 'color-wand' },
  { id: 'mono', name: 'Mono', icon: 'contrast' },
  { id: 'warm', name: 'Warm', icon: 'flame' },
  { id: 'cool', name: 'Cool', icon: 'snow' },
  { id: 'vintage', name: 'Vintage', icon: 'time' },
];

export default function VideoEditorScreen() {
  const router = useRouter();
  const [clips, setClips] = useState<TimelineClip[]>([
    { id: '1', name: 'Intro', duration: 5, color: '#3B82F6' },
    { id: '2', name: 'Main', duration: 45, color: '#22C55E' },
    { id: '3', name: 'Outro', duration: 8, color: '#A855F7' },
  ]);
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [activeTab, setActiveTab] = useState<'trim' | 'filters' | 'text' | 'audio'>('trim');
  const totalDuration = clips.reduce((sum, c) => sum + c.duration, 0);

  const handleSplit = (clipId: string) => {
    setClips((prev) => {
      const idx = prev.findIndex((c) => c.id === clipId);
      if (idx === -1) return prev;
      const clip = prev[idx];
      const half = clip.duration / 2;
      const newClip: TimelineClip = {
        id: `${clipId}_split`,
        name: `${clip.name} (2)`,
        duration: half,
        color: clip.color,
      };
      const updated = [...prev];
      updated[idx] = { ...clip, duration: half };
      updated.splice(idx + 1, 0, newClip);
      return updated;
    });
  };

  const handleDelete = (clipId: string) => {
    Alert.alert('Delete Clip?', 'Remove this segment from the timeline?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setClips((prev) => prev.filter((c) => c.id !== clipId)) },
    ]);
  };

  const handleSave = () => {
    Alert.alert('Save Draft?', 'Save your edits to drafts?', [
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      { text: 'Save Draft', onPress: () => { Alert.alert('Saved!'); router.back(); } },
      { text: 'Publish', onPress: () => router.push('/(os)/studio/publish') },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>✂️ Editor</Text>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Preview */}
      <View style={styles.preview}>
        <View style={styles.previewPlaceholder}>
          <Ionicons name="play-circle" size={64} color="#3B82F6" />
          <Text style={styles.previewText}>Preview</Text>
          <Text style={styles.previewTime}>{Math.floor(currentTime / 60)}:{(currentTime % 60).toString().padStart(2, '0')} / {Math.floor(totalDuration / 60)}:{(totalDuration % 60).toString().padStart(2, '0')}</Text>
        </View>
      </View>

      {/* Playback Controls */}
      <View style={styles.playbackBar}>
        <TouchableOpacity onPress={() => setCurrentTime(Math.max(0, currentTime - 10))}>
          <Ionicons name="play-back" size={24} color="#F1F5F9" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setIsPlaying(!isPlaying)}>
          <Ionicons name={isPlaying ? "pause-circle" : "play-circle"} size={40} color="#3B82F6" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setCurrentTime(Math.min(totalDuration, currentTime + 10))}>
          <Ionicons name="play-forward" size={24} color="#F1F5F9" />
        </TouchableOpacity>
      </View>

      {/* Editor Tabs */}
      <View style={styles.tabRow}>
        {(['trim', 'filters', 'text', 'audio'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'trim' ? 'cut' : tab === 'filters' ? 'color-wand' : tab === 'text' ? 'text' : 'musical-notes'}
              size={16}
              color={activeTab === tab ? '#FFF' : '#94A3B8'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {activeTab === 'trim' && (
          <>
            <Text style={styles.sectionTitle}>Timeline</Text>
            <View style={styles.timeline}>
              {clips.map((clip) => (
                <View key={clip.id} style={styles.clipRow}>
                  <View style={[styles.clipBar, { width: Math.max(60, (clip.duration / totalDuration) * (width - 80)), backgroundColor: clip.color }]}>
                    <Text style={styles.clipName}>{clip.name}</Text>
                    <Text style={styles.clipDuration}>{clip.duration}s</Text>
                  </View>
                  <View style={styles.clipActions}>
                    <TouchableOpacity onPress={() => handleSplit(clip.id)}>
                      <Ionicons name="git-merge" size={18} color="#3B82F6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(clip.id)}>
                      <Ionicons name="trash" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
            <Text style={styles.hint}>💡 Tap split to divide, trash to remove</Text>
          </>
        )}

        {activeTab === 'filters' && (
          <>
            <Text style={styles.sectionTitle}>Filters</Text>
            <View style={styles.filterGrid}>
              {FILTERS.map((filter) => (
                <TouchableOpacity
                  key={filter.id}
                  style={[styles.filterCard, selectedFilter === filter.id && styles.filterCardActive]}
                  onPress={() => setSelectedFilter(filter.id)}
                >
                  <Ionicons name={filter.icon as any} size={24} color={selectedFilter === filter.id ? '#3B82F6' : '#64748B'} />
                  <Text style={[styles.filterName, selectedFilter === filter.id && styles.filterNameActive]}>{filter.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {activeTab === 'text' && (
          <View style={styles.placeholderTab}>
            <Ionicons name="text" size={40} color="#475569" />
            <Text style={styles.placeholderText}>Text overlays coming in v2</Text>
          </View>
        )}

        {activeTab === 'audio' && (
          <View style={styles.placeholderTab}>
            <Ionicons name="musical-notes" size={40} color="#475569" />
            <Text style={styles.placeholderText}>Audio mixer coming in v2</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', flex: 1, marginLeft: 8 },
  saveBtn: {
    backgroundColor: '#22C55E', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10,
  },
  saveBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },
  preview: {
    height: 200, backgroundColor: '#1E293B', marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#334155',
  },
  previewPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  previewText: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginTop: 8 },
  previewTime: { fontSize: 13, color: '#64748B', marginTop: 4, fontFamily: 'monospace' },
  playbackBar: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    gap: 24, paddingVertical: 12,
  },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 8 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  tabBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  tabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 12, marginBottom: 10 },
  timeline: { paddingHorizontal: 16 },
  clipRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  clipBar: {
    height: 44, borderRadius: 8, justifyContent: 'center', paddingHorizontal: 10,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  clipName: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  clipDuration: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  clipActions: { flexDirection: 'row', gap: 12, marginLeft: 12 },
  hint: { fontSize: 12, color: '#64748B', marginHorizontal: 16, marginTop: 8, fontStyle: 'italic' },
  filterGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8,
  },
  filterCard: {
    width: '30%', backgroundColor: '#1E293B', borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#334155',
  },
  filterCardActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  filterName: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  filterNameActive: { color: '#3B82F6' },
  placeholderTab: { alignItems: 'center', marginTop: 40 },
  placeholderText: { fontSize: 14, color: '#64748B', marginTop: 12 },
});
