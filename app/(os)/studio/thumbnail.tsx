import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface ThumbnailTemplate {
  id: string;
  name: string;
  style: string;
  color: string;
}

const TEMPLATES: ThumbnailTemplate[] = [
  { id: 'bold', name: 'Bold Text', style: 'Large centered text with gradient', color: '#EF4444' },
  { id: 'minimal', name: 'Minimal', style: 'Clean with subtle border', color: '#3B82F6' },
  { id: 'vlog', name: 'Vlog Style', style: 'Face + title overlay', color: '#F59E0B' },
  { id: 'news', name: 'News', style: 'Lower third banner style', color: '#22C55E' },
  { id: 'gaming', name: 'Gaming', style: 'Neon borders, bold fonts', color: '#A855F7' },
  { id: 'cinematic', name: 'Cinematic', style: 'Dark with gold accents', color: '#EC4899' },
];

export default function ThumbnailMakerScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('bold');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedThumbnails, setGeneratedThumbnails] = useState<string[]>([]);
  const [selectedThumbnail, setSelectedThumbnail] = useState<number | null>(null);

  const handleGenerate = () => {
    if (!title.trim()) {
      Alert.alert('Enter Title', 'Add a title for your thumbnail.');
      return;
    }
    setIsGenerating(true);
    setTimeout(() => {
      setGeneratedThumbnails([
        'Thumbnail A — AI Generated',
        'Thumbnail B — AI Generated',
        'Thumbnail C — AI Generated',
        'Thumbnail D — AI Generated',
      ]);
      setIsGenerating(false);
    }, 3000);
  };

  const handleUse = () => {
    if (selectedThumbnail === null) {
      Alert.alert('Select One', 'Pick a thumbnail to use.');
      return;
    }
    Alert.alert('✅ Applied', 'Thumbnail set for your video.');
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🎨 Thumbnail Maker</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title Input */}
        <Text style={styles.label}>Video Title</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Enter your video title..."
          placeholderTextColor="#475569"
        />

        {/* Template Selection */}
        <Text style={styles.label}>Select Style</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 10 }}>
          {TEMPLATES.map((t) => (
            <TouchableOpacity
              key={t.id}
              style={[styles.templateCard, selectedTemplate === t.id && styles.templateCardActive]}
              onPress={() => setSelectedTemplate(t.id)}
            >
              <View style={[styles.templatePreview, { backgroundColor: t.color + '20', borderColor: t.color }]}>
                <Text style={[styles.templatePreviewText, { color: t.color }]}>{t.name[0]}</Text>
              </View>
              <Text style={[styles.templateName, selectedTemplate === t.id && styles.templateNameActive]}>{t.name}</Text>
              <Text style={styles.templateStyle}>{t.style}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Generate Button */}
        <TouchableOpacity
          style={[styles.generateBtn, isGenerating && styles.generateBtnDisabled]}
          onPress={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <Ionicons name="sync" size={20} color="#FFF" />
              <Text style={styles.generateBtnText}>ASIS is designing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#FFF" />
              <Text style={styles.generateBtnText}>Generate Thumbnails</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Generated Thumbnails */}
        {generatedThumbnails.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pick Your Thumbnail</Text>
            <View style={styles.thumbnailGrid}>
              {generatedThumbnails.map((thumb, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[styles.thumbnailCard, selectedThumbnail === idx && styles.thumbnailCardSelected]}
                  onPress={() => setSelectedThumbnail(idx)}
                >
                  <View style={styles.thumbnailPlaceholder}>
                    <Ionicons name="image" size={32} color="#64748B" />
                    <Text style={styles.thumbnailLabel}>{thumb}</Text>
                  </View>
                  {selectedThumbnail === idx && (
                    <View style={styles.selectedOverlay}>
                      <Ionicons name="checkmark-circle" size={28} color="#22C55E" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.useBtn} onPress={handleUse}>
              <Ionicons name="checkmark" size={18} color="#FFF" />
              <Text style={styles.useBtnText}>Use Selected Thumbnail</Text>
            </TouchableOpacity>
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
  label: { fontSize: 14, fontWeight: '600', color: '#F1F5F9', marginHorizontal: 16, marginTop: 16, marginBottom: 8 },
  input: {
    backgroundColor: '#1E293B', borderRadius: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    color: '#F1F5F9', fontSize: 14,
    borderWidth: 1, borderColor: '#334155',
    marginHorizontal: 16,
  },
  templateScroll: { marginTop: 4 },
  templateCard: {
    width: 120, backgroundColor: '#1E293B', borderRadius: 12,
    padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#334155',
    marginRight: 10,
  },
  templateCardActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  templatePreview: {
    width: 60, height: 60, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center', borderWidth: 2,
  },
  templatePreviewText: { fontSize: 24, fontWeight: '800' },
  templateName: { fontSize: 12, fontWeight: '600', color: '#F1F5F9', marginTop: 8 },
  templateNameActive: { color: '#3B82F6' },
  templateStyle: { fontSize: 10, color: '#64748B', textAlign: 'center', marginTop: 2 },
  generateBtn: {
    backgroundColor: '#3B82F6', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8, marginHorizontal: 16, marginTop: 20,
  },
  generateBtnDisabled: { backgroundColor: '#1D4ED8' },
  generateBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#F1F5F9', marginHorizontal: 16, marginTop: 20, marginBottom: 10 },
  thumbnailGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 12, gap: 8,
  },
  thumbnailCard: {
    width: (width - 40) / 2, height: 100,
    backgroundColor: '#1E293B', borderRadius: 12,
    overflow: 'hidden', borderWidth: 2, borderColor: 'transparent',
  },
  thumbnailCardSelected: { borderColor: '#22C55E' },
  thumbnailPlaceholder: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
  },
  thumbnailLabel: { fontSize: 11, color: '#64748B', marginTop: 4 },
  selectedOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(34,197,94,0.15)', justifyContent: 'center', alignItems: 'center',
  },
  useBtn: {
    backgroundColor: '#22C55E', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8, marginHorizontal: 16, marginTop: 16,
  },
  useBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
