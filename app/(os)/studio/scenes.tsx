import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Scene {
  id: string;
  startTime: string;
  endTime: string;
  thumbnail: string;
  tags: string[];
  description: string;
  aiSuggestedThumbnail: boolean;
}

export default function SceneBatcherScreen() {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [selectedScenes, setSelectedScenes] = useState<string[]>([]);

  const handleAutoSplit = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const mockScenes: Scene[] = [
        { id: 's1', startTime: '00:00', endTime: '00:15', thumbnail: '', tags: ['intro', 'title'], description: 'Opening shot with title card', aiSuggestedThumbnail: true },
        { id: 's2', startTime: '00:15', endTime: '01:30', thumbnail: '', tags: ['interview', 'talking-head'], description: 'Main interview segment', aiSuggestedThumbnail: false },
        { id: 's3', startTime: '01:30', endTime: '02:45', thumbnail: '', tags: ['b-roll', 'street'], description: 'B-roll footage of Nairobi streets', aiSuggestedThumbnail: true },
        { id: 's4', startTime: '02:45', endTime: '03:20', thumbnail: '', tags: ['outro', 'credits'], description: 'Closing with social links', aiSuggestedThumbnail: false },
      ];
      setScenes(mockScenes);
      setIsProcessing(false);
      Alert.alert('✅ Scenes Detected', `ASIS found ${mockScenes.length} scenes with auto-tags.`);
    }, 4000);
  };

  const toggleScene = (sceneId: string) => {
    setSelectedScenes((prev) =>
      prev.includes(sceneId) ? prev.filter((id) => id !== sceneId) : [...prev, sceneId]
    );
  };

  const selectAll = () => {
    setSelectedScenes(scenes.map((s) => s.id));
  };

  const generateThumbnails = () => {
    if (selectedScenes.length === 0) {
      Alert.alert('Select Scenes', 'Choose at least one scene to generate thumbnails for.');
      return;
    }
    Alert.alert('🎨 Generating', `ASIS is creating thumbnails for ${selectedScenes.length} scenes...`);
  };

  const exportScenes = () => {
    router.push('/(os)/studio/editor');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎬 Scene Batcher</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Upload / Process Section */}
        {scenes.length === 0 && (
          <View style={styles.uploadArea}>
            <Ionicons name="film" size={48} color="#3B82F6" />
            <Text style={styles.uploadTitle}>Upload Video to Analyze</Text>
            <Text style={styles.uploadSubtitle}>
              ASIS will auto-detect scenes, suggest tags, and pick the best thumbnails
            </Text>
            <TouchableOpacity style={styles.processBtn} onPress={handleAutoSplit} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <ActivityIndicator color="#FFF" />
                  <Text style={styles.processBtnText}>Analyzing with ASIS...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="scan" size={20} color="#FFF" />
                  <Text style={styles.processBtnText}>Auto-Split Scenes</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Scenes List */}
        {scenes.length > 0 && (
          <>
            <View style={styles.sceneHeader}>
              <Text style={styles.sceneCount}>{scenes.length} scenes detected</Text>
              <View style={styles.sceneActions}>
                <TouchableOpacity onPress={selectAll}>
                  <Text style={styles.selectAllText}>Select All</Text>
                </TouchableOpacity>
              </View>
            </View>

            {scenes.map((scene) => (
              <TouchableOpacity
                key={scene.id}
                style={[styles.sceneCard, selectedScenes.includes(scene.id) && styles.sceneCardSelected]}
                onPress={() => toggleScene(scene.id)}
                activeOpacity={0.8}
              >
                <View style={styles.sceneThumb}>
                  <Ionicons name="image" size={24} color="#64748B" />
                  {scene.aiSuggestedThumbnail && (
                    <View style={styles.aiBadge}>
                      <Text style={styles.aiBadgeText}>AI</Text>
                    </View>
                  )}
                </View>
                <View style={styles.sceneInfo}>
                  <Text style={styles.sceneTime}>{scene.startTime} — {scene.endTime}</Text>
                  <Text style={styles.sceneDesc}>{scene.description}</Text>
                  <View style={styles.tagRow}>
                    {scene.tags.map((tag) => (
                      <View key={tag} style={styles.tag}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Ionicons
                  name={selectedScenes.includes(scene.id) ? "checkmark-circle" : "ellipse-outline"}
                  size={24}
                  color={selectedScenes.includes(scene.id) ? "#22C55E" : "#475569"}
                />
              </TouchableOpacity>
            ))}

            {/* Action Bar */}
            <View style={styles.actionBar}>
              <TouchableOpacity style={styles.actionBtn} onPress={generateThumbnails}>
                <Ionicons name="image" size={18} color="#3B82F6" />
                <Text style={styles.actionBtnText}>Generate Thumbnails</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.actionBtnPrimary]} onPress={exportScenes}>
                <Ionicons name="arrow-forward" size={18} color="#FFF" />
                <Text style={[styles.actionBtnText, styles.actionBtnTextPrimary]}>Export to Editor</Text>
              </TouchableOpacity>
            </View>
          </>
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
  uploadArea: {
    marginHorizontal: 16, marginTop: 20,
    backgroundColor: '#1E293B', borderRadius: 16,
    padding: 24, alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  uploadTitle: { fontSize: 18, fontWeight: '700', color: '#F1F5F9', marginTop: 16 },
  uploadSubtitle: { fontSize: 13, color: '#94A3B8', textAlign: 'center', marginTop: 8, lineHeight: 18 },
  processBtn: {
    backgroundColor: '#3B82F6', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8, marginTop: 20, width: '100%',
  },
  processBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sceneHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, marginTop: 16, marginBottom: 10,
  },
  sceneCount: { fontSize: 14, fontWeight: '700', color: '#F1F5F9' },
  sceneActions: {},
  selectAllText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  sceneCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  sceneCardSelected: { borderColor: '#22C55E', backgroundColor: '#1E293B' },
  sceneThumb: {
    width: 60, height: 60, borderRadius: 10,
    backgroundColor: '#0F172A', justifyContent: 'center', alignItems: 'center',
    marginRight: 12, position: 'relative',
  },
  aiBadge: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: '#A855F7', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 1,
  },
  aiBadgeText: { fontSize: 8, color: '#FFF', fontWeight: '800' },
  sceneInfo: { flex: 1 },
  sceneTime: { fontSize: 13, fontWeight: '700', color: '#3B82F6', fontFamily: 'monospace' },
  sceneDesc: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 6 },
  tag: {
    backgroundColor: '#334155', paddingHorizontal: 8, paddingVertical: 3,
    borderRadius: 4,
  },
  tagText: { fontSize: 10, color: '#CBD5E1', fontWeight: '600' },
  actionBar: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginTop: 16,
  },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 14, backgroundColor: '#1E293B',
    borderRadius: 12, borderWidth: 1, borderColor: '#334155',
  },
  actionBtnPrimary: { backgroundColor: '#22C55E', borderColor: '#22C55E' },
  actionBtnText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  actionBtnTextPrimary: { color: '#FFF' },
});
