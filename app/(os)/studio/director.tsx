import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface CameraFeed {
  id: string;
  name: string;
  isActive: boolean;
  isRecording: boolean;
  battery: number;
  signal: number;
}

export default function DirectorControlPanelScreen() {
  const router = useRouter();
  const [feeds, setFeeds] = useState<CameraFeed[]>([
    { id: 'cam1', name: 'Main Cam', isActive: true, isRecording: true, battery: 85, signal: 95 },
    { id: 'cam2', name: 'Angle 2', isActive: true, isRecording: true, battery: 72, signal: 88 },
    { id: 'cam3', name: 'Close-up', isActive: false, isRecording: false, battery: 45, signal: 62 },
    { id: 'cam4', name: 'Wide Shot', isActive: false, isRecording: false, battery: 91, signal: 98 },
  ]);
  const [mainFeed, setMainFeed] = useState('cam1');
  const [isRecordingAll, setIsRecordingAll] = useState(true);
  const [showGrid, setShowGrid] = useState(false);

  const toggleFeed = (feedId: string) => {
    setFeeds((prev) =>
      prev.map((f) => (f.id === feedId ? { ...f, isActive: !f.isActive } : f))
    );
  };

  const switchMain = (feedId: string) => {
    setMainFeed(feedId);
  };

  const toggleRecordAll = () => {
    const newState = !isRecordingAll;
    setIsRecordingAll(newState);
    setFeeds((prev) => prev.map((f) => ({ ...f, isRecording: newState && f.isActive })));
  };

  const getSignalColor = (signal: number) => {
    if (signal >= 80) return '#22C55E';
    if (signal >= 50) return '#F59E0B';
    return '#EF4444';
  };

  const mainFeedData = feeds.find((f) => f.id === mainFeed) || feeds[0];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎬 Director Panel</Text>
        <View style={styles.liveBadge}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>LIVE</Text>
        </View>
      </View>

      {/* Main Preview */}
      <View style={styles.mainPreview}>
        <View style={styles.previewPlaceholder}>
          <Ionicons name="videocam" size={48} color="#3B82F6" />
          <Text style={styles.previewText}>{mainFeedData.name}</Text>
          <Text style={styles.previewSubtext}>Main Feed</Text>
        </View>
        {mainFeedData.isRecording && (
          <View style={styles.recordingOverlay}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>REC</Text>
          </View>
        )}
      </View>

      {/* Control Bar */}
      <View style={styles.controlBar}>
        <TouchableOpacity style={styles.controlBtn} onPress={toggleRecordAll}>
          <Ionicons name={isRecordingAll ? "stop-circle" : "radio-button-on"} size={24} color={isRecordingAll ? "#EF4444" : "#22C55E"} />
          <Text style={[styles.controlText, { color: isRecordingAll ? '#EF4444' : '#22C55E' }]}>
            {isRecordingAll ? 'Stop All' : 'Record All'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => setShowGrid(!showGrid)}>
          <Ionicons name={showGrid ? "grid" : "grid-outline"} size={24} color="#3B82F6" />
          <Text style={styles.controlText}>Grid View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => router.push('/(os)/studio/pairing')}>
          <Ionicons name="add-circle" size={24} color="#A855F7" />
          <Text style={styles.controlText}>Add Cam</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Grid View */}
        {showGrid && (
          <View style={styles.gridRow}>
            {feeds.filter((f) => f.isActive).map((feed) => (
              <TouchableOpacity
                key={feed.id}
                style={[styles.gridCell, mainFeed === feed.id && styles.gridCellMain]}
                onPress={() => switchMain(feed.id)}
              >
                <View style={styles.gridPlaceholder}>
                  <Ionicons name="videocam" size={24} color="#64748B" />
                  <Text style={styles.gridName}>{feed.name}</Text>
                </View>
                {feed.isRecording && (
                  <View style={styles.gridRecBadge}>
                    <View style={styles.gridRecDot} />
                  </View>
                )}
                {mainFeed === feed.id && (
                  <View style={styles.gridMainBadge}>
                    <Text style={styles.gridMainText}>MAIN</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Feed List */}
        <Text style={styles.sectionTitle}>Camera Feeds</Text>
        {feeds.map((feed) => (
          <View key={feed.id} style={styles.feedCard}>
            <TouchableOpacity
              style={[styles.feedThumb, mainFeed === feed.id && styles.feedThumbMain]}
              onPress={() => switchMain(feed.id)}
            >
              <Ionicons name="videocam" size={20} color={mainFeed === feed.id ? '#3B82F6' : '#64748B'} />
              {feed.isRecording && <View style={styles.feedRecDot} />}
            </TouchableOpacity>

            <View style={styles.feedInfo}>
              <Text style={styles.feedName}>{feed.name}</Text>
              <View style={styles.feedMeta}>
                <Ionicons name="battery-half" size={12} color="#64748B" />
                <Text style={styles.feedMetaText}>{feed.battery}%</Text>
                <Text style={styles.feedDot}>•</Text>
                <View style={[styles.signalBar, { backgroundColor: getSignalColor(feed.signal) }]}>
                  <Text style={styles.signalText}>{feed.signal}%</Text>
                </View>
              </View>
            </View>

            <View style={styles.feedActions}>
              <TouchableOpacity
                style={[styles.toggleBtn, feed.isActive && styles.toggleBtnActive]}
                onPress={() => toggleFeed(feed.id)}
              >
                <Ionicons name={feed.isActive ? "eye" : "eye-off"} size={16} color={feed.isActive ? "#22C55E" : "#64748B"} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.mainBtn, mainFeed === feed.id && styles.mainBtnActive]}
                onPress={() => switchMain(feed.id)}
              >
                <Text style={[styles.mainBtnText, mainFeed === feed.id && styles.mainBtnTextActive]}>
                  {mainFeed === feed.id ? 'MAIN' : 'SET'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8,
  },
  backBtn: { padding: 8, marginRight: 8 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#F8FAFC', flex: 1 },
  liveBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#EF444420', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 20, borderWidth: 1, borderColor: '#EF444440',
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444' },
  liveText: { fontSize: 11, fontWeight: '800', color: '#EF4444' },
  mainPreview: {
    height: 220, backgroundColor: '#1E293B', marginHorizontal: 16,
    borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#3B82F6',
  },
  previewPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  previewText: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginTop: 8 },
  previewSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  recordingOverlay: {
    position: 'absolute', top: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(239,68,68,0.8)', paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6,
  },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFF' },
  recText: { fontSize: 11, color: '#FFF', fontWeight: '800' },
  controlBar: {
    flexDirection: 'row', justifyContent: 'space-around',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  controlBtn: { alignItems: 'center', gap: 4 },
  controlText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  gridRow: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, paddingTop: 12, gap: 8,
  },
  gridCell: {
    width: (width - 40) / 2, height: 100,
    backgroundColor: '#1E293B', borderRadius: 12,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  gridCellMain: { borderColor: '#3B82F6' },
  gridPlaceholder: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  gridName: { fontSize: 11, color: '#64748B', marginTop: 4 },
  gridRecBadge: {
    position: 'absolute', top: 8, right: 8,
    backgroundColor: '#EF4444', borderRadius: 4, padding: 4,
  },
  gridRecDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FFF' },
  gridMainBadge: {
    position: 'absolute', bottom: 8, left: 8,
    backgroundColor: '#3B82F6', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2,
  },
  gridMainText: { fontSize: 9, color: '#FFF', fontWeight: '800' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  feedCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  feedThumb: {
    width: 50, height: 50, borderRadius: 12,
    backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'transparent', marginRight: 12,
  },
  feedThumbMain: { borderColor: '#3B82F6' },
  feedRecDot: {
    position: 'absolute', top: 4, right: 4,
    width: 8, height: 8, borderRadius: 4, backgroundColor: '#EF4444',
  },
  feedInfo: { flex: 1 },
  feedName: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  feedMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  feedMetaText: { fontSize: 12, color: '#64748B' },
  feedDot: { fontSize: 12, color: '#475569' },
  signalBar: {
    paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  signalText: { fontSize: 10, color: '#FFF', fontWeight: '700' },
  feedActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toggleBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#334155',
  },
  toggleBtnActive: { borderColor: '#22C55E40' },
  mainBtn: {
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
    backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#334155',
  },
  mainBtnActive: { backgroundColor: '#3B82F620', borderColor: '#3B82F6' },
  mainBtnText: { fontSize: 10, color: '#64748B', fontWeight: '700' },
  mainBtnTextActive: { color: '#3B82F6' },
});
