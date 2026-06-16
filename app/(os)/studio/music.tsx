import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

interface Track {
  id: string;
  title: string;
  artist: string;
  duration: string;
  type: 'uploaded' | 'ai-generated' | 'licensed';
  status: 'draft' | 'published';
}

const MOODS = [
  { id: 'happy', name: 'Happy', icon: 'sunny', color: '#F59E0B' },
  { id: 'sad', name: 'Sad', icon: 'rainy', color: '#3B82F6' },
  { id: 'energetic', name: 'Energetic', icon: 'flash', color: '#EF4444' },
  { id: 'calm', name: 'Calm', icon: 'leaf', color: '#22C55E' },
  { id: 'romantic', name: 'Romantic', icon: 'heart', color: '#EC4899' },
  { id: 'epic', name: 'Epic', icon: 'trophy', color: '#A855F7' },
];

export default function MusicStudioScreen() {
  const router = useRouter();
  const [tracks, setTracks] = useState<Track[]>([
    { id: '1', title: 'Nairobi Nights', artist: 'You', duration: '3:24', type: 'uploaded', status: 'published' },
    { id: '2', title: 'Coast Vibes', artist: 'AI Composer', duration: '2:45', type: 'ai-generated', status: 'draft' },
  ]);
  const [activeTab, setActiveTab] = useState<'library' | 'generate' | 'beats'>('library');
  const [selectedMood, setSelectedMood] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = () => {
    if (!selectedMood && !prompt.trim()) {
      Alert.alert('Select Mood or Enter Prompt', 'Choose a mood or describe the music you want.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      const newTrack: Track = {
        id: `ai_${Date.now()}`,
        title: prompt || `${selectedMood.charAt(0).toUpperCase() + selectedMood.slice(1)} Track`,
        artist: 'AI Composer',
        duration: '2:30',
        type: 'ai-generated',
        status: 'draft',
      };
      setTracks((prev) => [newTrack, ...prev]);
      setIsGenerating(false);
      setPrompt('');
      Alert.alert('✅ Generated', 'Your AI track is ready in your library.');
    }, 3000);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'uploaded': return 'cloud-upload';
      case 'ai-generated': return 'sparkles';
      case 'licensed': return 'shield-checkmark';
      default: return 'musical-note';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'uploaded': return '#3B82F6';
      case 'ai-generated': return '#A855F7';
      case 'licensed': return '#22C55E';
      default: return '#64748B';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎵 Music Studio</Text>
        <TouchableOpacity style={styles.uploadBtn}>
          <Ionicons name="cloud-upload" size={20} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {(['library', 'generate', 'beats'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Ionicons
              name={tab === 'library' ? 'library' : tab === 'generate' ? 'sparkles' : 'pulse'}
              size={16}
              color={activeTab === tab ? '#FFF' : '#94A3B8'}
            />
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {activeTab === 'library' && (
          <>
            {tracks.map((track) => (
              <View key={track.id} style={styles.trackCard}>
                <View style={[styles.trackIcon, { backgroundColor: getTypeColor(track.type) + '20' }]}>
                  <Ionicons name={getTypeIcon(track.type)} size={22} color={getTypeColor(track.type)} />
                </View>
                <View style={styles.trackInfo}>
                  <Text style={styles.trackTitle}>{track.title}</Text>
                  <Text style={styles.trackMeta}>{track.artist} • {track.duration}</Text>
                </View>
                <View style={styles.trackActions}>
                  <View style={[styles.statusBadge, { backgroundColor: track.status === 'published' ? '#22C55E20' : '#F59E0B20' }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: track.status === 'published' ? '#22C55E' : '#F59E0B' }}>
                      {track.status.toUpperCase()}
                    </Text>
                  </View>
                  <TouchableOpacity>
                    <Ionicons name="play-circle" size={28} color="#3B82F6" />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {tracks.length === 0 && (
              <View style={styles.empty}>
                <Ionicons name="musical-notes" size={48} color="#475569" />
                <Text style={styles.emptyText}>No tracks yet. Generate or upload your first.</Text>
              </View>
            )}
          </>
        )}

        {activeTab === 'generate' && (
          <>
            <Text style={styles.sectionTitle}>🎭 Select Mood</Text>
            <View style={styles.moodGrid}>
              {MOODS.map((mood) => (
                <TouchableOpacity
                  key={mood.id}
                  style={[styles.moodCard, selectedMood === mood.id && styles.moodCardActive]}
                  onPress={() => setSelectedMood(mood.id)}
                >
                  <Ionicons name={mood.icon as any} size={24} color={selectedMood === mood.id ? '#FFF' : mood.color} />
                  <Text style={[styles.moodName, selectedMood === mood.id && styles.moodNameActive]}>{mood.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.sectionTitle}>✍️ Or Describe Your Track</Text>
            <TextInput
              style={styles.promptInput}
              value={prompt}
              onChangeText={setPrompt}
              placeholder="e.g. Upbeat afrobeat with saxophone for a vlog intro..."
              placeholderTextColor="#475569"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <TouchableOpacity
              style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
              onPress={handleGenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Ionicons name="sync" size={20} color="#FFF" />
                  <Text style={styles.generateBtnText}>Composing...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="sparkles" size={20} color="#FFF" />
                  <Text style={styles.generateBtnText}>Generate with ASIS</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        )}

        {activeTab === 'beats' && (
          <View style={styles.empty}>
            <Ionicons name="pulse" size={48} color="#475569" />
            <Text style={styles.emptyText}>Beat Maker coming in v2</Text>
            <Text style={styles.emptySubtext}>Create drum patterns, basslines, and melodies</Text>
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
  uploadBtn: { padding: 8 },
  tabRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginTop: 8, marginBottom: 12 },
  tabBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 10, borderRadius: 10,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  tabBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  tabText: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  tabTextActive: { color: '#FFF' },
  trackCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginBottom: 10,
    padding: 12, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  trackIcon: {
    width: 44, height: 44, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', marginRight: 12,
  },
  trackInfo: { flex: 1 },
  trackTitle: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  trackMeta: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  trackActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  empty: { alignItems: 'center', marginTop: 60 },
  emptyText: { fontSize: 15, color: '#64748B', marginTop: 12, textAlign: 'center', paddingHorizontal: 24 },
  emptySubtext: { fontSize: 13, color: '#475569', marginTop: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 16, marginBottom: 10 },
  moodGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8,
  },
  moodCard: {
    width: '30%', backgroundColor: '#1E293B', borderRadius: 12,
    padding: 14, alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: '#334155',
  },
  moodCardActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  moodName: { fontSize: 12, color: '#94A3B8', fontWeight: '600' },
  moodNameActive: { color: '#FFF' },
  promptInput: {
    backgroundColor: '#1E293B', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: '#F1F5F9', fontSize: 14,
    borderWidth: 1, borderColor: '#334155',
    marginHorizontal: 16, height: 100, paddingTop: 14,
  },
  generateBtn: {
    backgroundColor: '#A855F7', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8, marginHorizontal: 16, marginTop: 16,
  },
  generateBtnDisabled: { backgroundColor: '#6B21A8' },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
