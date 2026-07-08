import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Dimensions, Animated } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

const { width: SCREEN_W } = Dimensions.get('window');

interface Track {
  id: string;
  type: 'video' | 'audio' | 'voiceover' | 'text';
  name: string;
  duration: number; // seconds
  color: string;
}

interface Filter {
  id: string;
  name: string;
  preview: string;
}

const FILTERS: Filter[] = [
  { id: 'none', name: 'None', preview: 'Original' },
  { id: 'vivid', name: 'Vivid', preview: 'High saturation' },
  { id: 'dramatic', name: 'Dramatic', preview: 'High contrast' },
  { id: 'noir', name: 'Noir', preview: 'B&W' },
  { id: 'warm', name: 'Warm', preview: 'Golden tones' },
  { id: 'cool', name: 'Cool', preview: 'Blue tones' },
  { id: 'vintage', name: 'Vintage', preview: 'Faded' },
  { id: 'cyber', name: 'Cyber', preview: 'Neon' },
];

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export default function AdvancedEditorScreen() {
  const { videoUri, draftId } = useLocalSearchParams<{ videoUri?: string; draftId?: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [selectedFilter, setSelectedFilter] = useState('none');
  const [speed, setSpeed] = useState(1);
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(60);
  const [isReversed, setIsReversed] = useState(false);
  const [volume, setVolume] = useState(100);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [activeTab, setActiveTab] = useState<'timeline' | 'filters' | 'audio' | 'text' | 'export'>('timeline');
  const [tracks, setTracks] = useState<Track[]>([
    { id: 'v1', type: 'video', name: 'Main Video', duration: 60, color: '#6366f1' },
  ]);
  const [subtitles, setSubtitles] = useState<{ id: string; text: string; start: number; end: number }[]>([]);
  const [generatingSubtitles, setGeneratingSubtitles] = useState(false);
  const [saving, setSaving] = useState(false);

  const timelineScrollRef = useRef<ScrollView>(null);
  const playheadAnim = useRef(new Animated.Value(0)).current;

  const addTrack = (type: Track['type']) => {
    const newTrack: Track = {
      id: `${type}_${Date.now()}`,
      type,
      name: type === 'audio' ? 'Background Music' : type === 'voiceover' ? 'Voice Over' : 'Text Overlay',
      duration: 30,
      color: type === 'audio' ? '#10b981' : type === 'voiceover' ? '#f59e0b' : '#ec4899',
    };
    setTracks(prev => [...prev, newTrack]);
  };

  const removeTrack = (id: string) => {
    setTracks(prev => prev.filter(t => t.id !== id));
  };

  const generateAISubtitles = async () => {
    setGeneratingSubtitles(true);
    // Placeholder for AI subtitle generation
    setTimeout(() => {
      setSubtitles([
        { id: '1', text: 'Welcome to this video', start: 0, end: 3 },
        { id: '2', text: 'In this tutorial we will learn', start: 4, end: 8 },
        { id: '3', text: 'Let us get started', start: 9, end: 12 },
      ]);
      setGeneratingSubtitles(false);
    }, 2000);
  };

  const saveDraft = async () => {
    if (!user?.id) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('studio_videos').upsert({
        id: draftId,
        creator_id: user.id,
        title,
        description,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        visibility,
        status: 'draft',
        filter: selectedFilter,
        speed,
        trim_start: trimStart,
        trim_end: trimEnd,
        is_reversed: isReversed,
        volume,
        brightness,
        contrast,
        saturation,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      router.push('/(os)/studio/drafts');
    } catch (e) {
      console.error('Save draft error:', e);
    } finally {
      setSaving(false);
    }
  };

  const goToPublish = () => {
    router.push({
      pathname: '/(os)/studio/publish',
      params: { draftId, title, description, tags, visibility },
    });
  };

  const renderTimeline = () => (
    <View style={styles.timelineContainer}>
      <View style={styles.timelineHeader}>
        <Text style={styles.timelineTitle}>Timeline</Text>
        <View style={styles.timelineActions}>
          <TouchableOpacity onPress={() => addTrack('audio')} style={styles.timelineAction}>
            <Feather name="music" size={16} color="#10b981" />
            <Text style={styles.timelineActionText}>Audio</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addTrack('voiceover')} style={styles.timelineAction}>
            <Feather name="mic" size={16} color="#f59e0b" />
            <Text style={styles.timelineActionText}>Voice</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => addTrack('text')} style={styles.timelineAction}>
            <Feather name="type" size={16} color="#ec4899" />
            <Text style={styles.timelineActionText}>Text</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView ref={timelineScrollRef} horizontal showsHorizontalScrollIndicator={false} style={styles.timelineScroll}>
        <View style={styles.timelineRuler}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View key={i} style={styles.rulerMark}>
              <Text style={styles.rulerText}>{i * 5}s</Text>
            </View>
          ))}
        </View>

        {tracks.map(track => (
          <View key={track.id} style={[styles.trackRow, { borderLeftColor: track.color }]}>
            <View style={styles.trackLabel}>
              <Text style={styles.trackName}>{track.name}</Text>
              <TouchableOpacity onPress={() => removeTrack(track.id)}>
                <Feather name="x" size={14} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.trackClip}>
              <View style={[styles.trackBar, { width: track.duration * 4, backgroundColor: track.color }]}>
                <Text style={styles.trackDuration}>{track.duration}s</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Playhead */}
      <Animated.View style={[styles.playhead, { left: playheadAnim }]}>
        <View style={styles.playheadLine} />
        <View style={styles.playheadTriangle} />
      </Animated.View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
        {FILTERS.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setSelectedFilter(f.id)} style={[styles.filterCard, selectedFilter === f.id && styles.filterCardActive]}>
            <View style={[styles.filterPreview, { backgroundColor: f.id === 'none' ? '#333' : f.id === 'vivid' ? '#ff6b6b' : f.id === 'dramatic' ? '#4ecdc4' : f.id === 'noir' ? '#2d2d2d' : f.id === 'warm' ? '#f4a261' : f.id === 'cool' ? '#457b9d' : f.id === 'vintage' ? '#e9c46a' : '#a8dadc' }]}>
              <Text style={styles.filterPreviewText}>{f.name[0]}</Text>
            </View>
            <Text style={[styles.filterName, selectedFilter === f.id && styles.filterNameActive]}>{f.name}</Text>
            <Text style={styles.filterDesc}>{f.preview}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.adjustmentsPanel}>
        <Text style={styles.adjustTitle}>Color Adjustments</Text>
        {[
          { label: 'Brightness', value: brightness, setter: setBrightness, min: -50, max: 50 },
          { label: 'Contrast', value: contrast, setter: setContrast, min: -50, max: 50 },
          { label: 'Saturation', value: saturation, setter: setSaturation, min: -50, max: 50 },
        ].map(adj => (
          <View key={adj.label} style={styles.adjustRow}>
            <Text style={styles.adjustLabel}>{adj.label}</Text>
            <View style={styles.adjustControls}>
              <TouchableOpacity onPress={() => adj.setter(v => Math.max(adj.min, v - 5))}>
                <Feather name="minus" size={16} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.adjustValue}>{adj.value}</Text>
              <TouchableOpacity onPress={() => adj.setter(v => Math.min(adj.max, v + 5))}>
                <Feather name="plus" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>
    </View>
  );

  const renderAudio = () => (
    <View style={styles.audioContainer}>
      <View style={styles.audioSection}>
        <Text style={styles.audioTitle}>Volume</Text>
        <View style={styles.volumeRow}>
          <Feather name="volume-1" size={18} color="#666" />
          <View style={styles.volumeTrack}>
            <View style={[styles.volumeFill, { width: `${volume}%` }]} />
          </View>
          <TouchableOpacity onPress={() => setVolume(v => Math.max(0, v - 10))}>
            <Feather name="minus" size={16} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.volumeValue}>{volume}%</Text>
          <TouchableOpacity onPress={() => setVolume(v => Math.min(100, v + 10))}>
            <Feather name="plus" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.audioSection}>
        <Text style={styles.audioTitle}>Speed</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.speedScroll}>
          {SPEEDS.map(s => (
            <TouchableOpacity key={s} onPress={() => setSpeed(s)} style={[styles.speedBtn, speed === s && styles.speedBtnActive]}>
              <Text style={[styles.speedText, speed === s && styles.speedTextActive]}>{s}x</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.audioSection}>
        <Text style={styles.audioTitle}>Trim</Text>
        <View style={styles.trimRow}>
          <View style={styles.trimControl}>
            <Text style={styles.trimLabel}>Start</Text>
            <Text style={styles.trimValue}>{trimStart}s</Text>
            <View style={styles.trimButtons}>
              <TouchableOpacity onPress={() => setTrimStart(v => Math.max(0, v - 1))}><Feather name="minus" size={14} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setTrimStart(v => Math.min(trimEnd - 1, v + 1))}><Feather name="plus" size={14} color="#fff" /></TouchableOpacity>
            </View>
          </View>
          <View style={styles.trimControl}>
            <Text style={styles.trimLabel}>End</Text>
            <Text style={styles.trimValue}>{trimEnd}s</Text>
            <View style={styles.trimButtons}>
              <TouchableOpacity onPress={() => setTrimEnd(v => Math.max(trimStart + 1, v - 1))}><Feather name="minus" size={14} color="#fff" /></TouchableOpacity>
              <TouchableOpacity onPress={() => setTrimEnd(v => v + 1)}><Feather name="plus" size={14} color="#fff" /></TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <TouchableOpacity style={[styles.reverseBtn, isReversed && styles.reverseBtnActive]} onPress={() => setIsReversed(!isReversed)}>
        <Feather name="rewind" size={18} color={isReversed ? '#6366f1' : '#fff'} />
        <Text style={[styles.reverseText, isReversed && styles.reverseTextActive]}>Reverse Video</Text>
      </TouchableOpacity>
    </View>
  );

  const renderText = () => (
    <View style={styles.textContainer}>
      <TouchableOpacity style={styles.aiSubtitleBtn} onPress={generateAISubtitles} disabled={generatingSubtitles}>
        <Feather name="cpu" size={18} color="#6366f1" />
        <Text style={styles.aiSubtitleText}>
          {generatingSubtitles ? 'Generating...' : 'AI Generate Subtitles'}
        </Text>
      </TouchableOpacity>

      {subtitles.length > 0 && (
        <View style={styles.subtitlesList}>
          <Text style={styles.subtitleHeader}>Generated Subtitles</Text>
          {subtitles.map(sub => (
            <View key={sub.id} style={styles.subtitleItem}>
              <Text style={styles.subtitleTime}>{sub.start}s - {sub.end}s</Text>
              <Text style={styles.subtitleText}>{sub.text}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.textOverlaySection}>
        <Text style={styles.textOverlayTitle}>Text Overlays</Text>
        <TextInput
          style={styles.textOverlayInput}
          placeholder="Add text overlay..."
          placeholderTextColor="#666"
          multiline
        />
        <TouchableOpacity style={styles.addTextBtn}>
          <Text style={styles.addTextBtnText}>Add to Timeline</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderExport = () => (
    <View style={styles.exportContainer}>
      <View style={styles.metaSection}>
        <Text style={styles.metaLabel}>Title</Text>
        <TextInput style={styles.metaInput} value={title} onChangeText={setTitle} placeholder="Video title" placeholderTextColor="#666" />

        <Text style={styles.metaLabel}>Description</Text>
        <TextInput style={[styles.metaInput, styles.metaTextarea]} value={description} onChangeText={setDescription} placeholder="Describe your video..." placeholderTextColor="#666" multiline numberOfLines={4} />

        <Text style={styles.metaLabel}>Tags (comma separated)</Text>
        <TextInput style={styles.metaInput} value={tags} onChangeText={setTags} placeholder="education, tutorial, africa" placeholderTextColor="#666" />

        <Text style={styles.metaLabel}>Visibility</Text>
        <View style={styles.visibilityRow}>
          {(['public', 'unlisted', 'private'] as const).map(v => (
            <TouchableOpacity key={v} onPress={() => setVisibility(v)} style={[styles.visibilityBtn, visibility === v && styles.visibilityBtnActive]}>
              <Feather name={v === 'public' ? 'globe' : v === 'unlisted' ? 'link' : 'lock'} size={16} color={visibility === v ? '#6366f1' : '#9ca3af'} />
              <Text style={[styles.visibilityText, visibility === v && styles.visibilityTextActive]}>{v}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.exportActions}>
        <TouchableOpacity style={styles.saveDraftBtn} onPress={saveDraft} disabled={saving}>
          <Feather name="save" size={18} color="#fff" />
          <Text style={styles.saveDraftText}>{saving ? 'Saving...' : 'Save Draft'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.publishBtn} onPress={goToPublish}>
          <Feather name="upload-cloud" size={18} color="#fff" />
          <Text style={styles.publishText}>Continue to Publish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Preview Area */}
      <View style={styles.previewBox}>
        <View style={styles.previewPlaceholder}>
          <Feather name="film" size={48} color="#333" />
          <Text style={styles.previewText}>Video Preview</Text>
          {videoUri && <Text style={styles.previewUri} numberOfLines={1}>{videoUri}</Text>}
        </View>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {[
          { id: 'timeline', icon: 'layers', label: 'Timeline' },
          { id: 'filters', icon: 'droplet', label: 'Filters' },
          { id: 'audio', icon: 'mic', label: 'Audio' },
          { id: 'text', icon: 'type', label: 'Text' },
          { id: 'export', icon: 'upload', label: 'Export' },
        ].map(tab => (
          <TouchableOpacity key={tab.id} onPress={() => setActiveTab(tab.id as any)} style={[styles.tab, activeTab === tab.id && styles.tabActive]}>
            <Feather name={tab.icon as any} size={18} color={activeTab === tab.id ? '#6366f1' : '#666'} />
            <Text style={[styles.tabText, activeTab === tab.id && styles.tabTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.tabContent}>
        {activeTab === 'timeline' && renderTimeline()}
        {activeTab === 'filters' && renderFilters()}
        {activeTab === 'audio' && renderAudio()}
        {activeTab === 'text' && renderText()}
        {activeTab === 'export' && renderExport()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  previewBox: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000' },
  previewPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  previewText: { color: '#666', fontSize: 16, marginTop: 12 },
  previewUri: { color: '#333', fontSize: 10, marginTop: 8, paddingHorizontal: 20 },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, gap: 4 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#6366f1' },
  tabText: { color: '#666', fontSize: 11, fontWeight: '500' },
  tabTextActive: { color: '#6366f1', fontWeight: '700' },

  tabContent: { flex: 1 },

  // Timeline
  timelineContainer: { flex: 1, padding: 12 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  timelineTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timelineActions: { flexDirection: 'row', gap: 12 },
  timelineAction: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#1f1f1f', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  timelineActionText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  timelineScroll: { flex: 1 },
  timelineRuler: { flexDirection: 'row', height: 24, borderBottomWidth: 1, borderBottomColor: '#333', marginBottom: 8 },
  rulerMark: { width: 50, alignItems: 'center' },
  rulerText: { color: '#666', fontSize: 10 },
  trackRow: { flexDirection: 'row', alignItems: 'center', height: 44, borderLeftWidth: 3, marginBottom: 4, backgroundColor: '#141414' },
  trackLabel: { width: 100, paddingHorizontal: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trackName: { color: '#fff', fontSize: 11, fontWeight: '600' },
  trackClip: { flex: 1, paddingHorizontal: 8 },
  trackBar: { height: 32, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  trackDuration: { color: '#fff', fontSize: 10, fontWeight: '700' },
  playhead: { position: 'absolute', top: 0, bottom: 0, width: 2, backgroundColor: '#ef4444' },
  playheadLine: { width: 2, height: '100%', backgroundColor: '#ef4444' },
  playheadTriangle: { width: 0, height: 0, borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: '#ef4444', alignSelf: 'center' },

  // Filters
  filtersContainer: { flex: 1, padding: 12 },
  filterScroll: { marginBottom: 16 },
  filterCard: { width: 80, alignItems: 'center', marginRight: 12, padding: 8, borderRadius: 12, backgroundColor: '#1f1f1f' },
  filterCardActive: { borderWidth: 2, borderColor: '#6366f1' },
  filterPreview: { width: 56, height: 56, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  filterPreviewText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  filterName: { color: '#fff', fontSize: 12, fontWeight: '600' },
  filterNameActive: { color: '#6366f1' },
  filterDesc: { color: '#666', fontSize: 10, marginTop: 2 },
  adjustmentsPanel: { backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16 },
  adjustTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12 },
  adjustRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  adjustLabel: { color: '#9ca3af', fontSize: 13 },
  adjustControls: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  adjustValue: { color: '#fff', fontSize: 14, fontWeight: '600', minWidth: 30, textAlign: 'center' },

  // Audio
  audioContainer: { flex: 1, padding: 16 },
  audioSection: { marginBottom: 20 },
  audioTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 10 },
  volumeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  volumeTrack: { flex: 1, height: 4, backgroundColor: '#333', borderRadius: 2 },
  volumeFill: { height: 4, backgroundColor: '#6366f1', borderRadius: 2 },
  volumeValue: { color: '#fff', fontSize: 13, fontWeight: '600', minWidth: 36 },
  speedScroll: { marginTop: 8 },
  speedBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1f1f1f', marginRight: 8 },
  speedBtnActive: { backgroundColor: '#6366f1' },
  speedText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  speedTextActive: { color: '#fff', fontWeight: '700' },
  trimRow: { flexDirection: 'row', gap: 16 },
  trimControl: { flex: 1, backgroundColor: '#1f1f1f', borderRadius: 8, padding: 12, alignItems: 'center' },
  trimLabel: { color: '#9ca3af', fontSize: 11, marginBottom: 4 },
  trimValue: { color: '#fff', fontSize: 18, fontWeight: '700' },
  trimButtons: { flexDirection: 'row', gap: 16, marginTop: 8 },
  reverseBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1f1f1f', padding: 12, borderRadius: 8, alignSelf: 'flex-start' },
  reverseBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  reverseText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  reverseTextActive: { color: '#6366f1' },

  // Text
  textContainer: { flex: 1, padding: 16 },
  aiSubtitleBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#1f1f1f', padding: 14, borderRadius: 12, marginBottom: 16 },
  aiSubtitleText: { color: '#6366f1', fontSize: 14, fontWeight: '700' },
  subtitlesList: { marginBottom: 16 },
  subtitleHeader: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  subtitleItem: { backgroundColor: '#1f1f1f', padding: 10, borderRadius: 8, marginBottom: 6 },
  subtitleTime: { color: '#6366f1', fontSize: 11, fontWeight: '600', marginBottom: 2 },
  subtitleText: { color: '#fff', fontSize: 13 },
  textOverlaySection: { marginTop: 8 },
  textOverlayTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 8 },
  textOverlayInput: { backgroundColor: '#1f1f1f', borderRadius: 8, padding: 12, color: '#fff', fontSize: 14, minHeight: 60, textAlignVertical: 'top' },
  addTextBtn: { backgroundColor: '#6366f1', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 10 },
  addTextBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // Export
  exportContainer: { flex: 1, padding: 16 },
  metaSection: { marginBottom: 16 },
  metaLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 12, textTransform: 'uppercase' },
  metaInput: { backgroundColor: '#1f1f1f', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, color: '#fff', fontSize: 14 },
  metaTextarea: { minHeight: 80, textAlignVertical: 'top' },
  visibilityRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  visibilityBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f1f1f', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, flex: 1, justifyContent: 'center' },
  visibilityBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  visibilityText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  visibilityTextActive: { color: '#6366f1' },
  exportActions: { flexDirection: 'row', gap: 12, marginTop: 'auto' },
  saveDraftBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#1f1f1f', padding: 14, borderRadius: 12 },
  saveDraftText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  publishBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#6366f1', padding: 14, borderRadius: 12 },
  publishText: { color: '#fff', fontSize: 14, fontWeight: '700' },
});
