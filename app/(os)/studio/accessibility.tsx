import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function AccessibilityScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  const [autoCaptions, setAutoCaptions] = useState(true);
  const [closedCaptions, setClosedCaptions] = useState(true);
  const [signLanguage, setSignLanguage] = useState(false);
  const [audioDescription, setAudioDescription] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [keyboardNav, setKeyboardNav] = useState(false);
  const [captionLanguage, setCaptionLanguage] = useState('English');
  const [captionSize, setCaptionSize] = useState('medium');
  const [captionStyle, setCaptionStyle] = useState('default');

  const languages = ['English', 'Swahili', 'French', 'Arabic', 'Portuguese', 'Zulu', 'Yoruba', 'Amharic', 'Luganda', 'Hausa'];
  const sizes = [
    { id: 'small', label: 'Small', sample: 'Aa' },
    { id: 'medium', label: 'Medium', sample: 'Aa' },
    { id: 'large', label: 'Large', sample: 'Aa' },
    { id: 'xlarge', label: 'Extra Large', sample: 'Aa' },
  ];
  const styles = [
    { id: 'default', label: 'White on Black', bg: '#000', text: '#fff' },
    { id: 'yellow', label: 'Yellow on Black', bg: '#000', text: '#fbbf24' },
    { id: 'black', label: 'Black on White', bg: '#fff', text: '#000' },
    { id: 'blue', label: 'White on Blue', bg: '#1e3a8a', text: '#fff' },
  ];

  const toggleSetting = (setter: (v: boolean) => void, value: boolean, name: string) => {
    setter(!value);
    // In production, save to user preferences in Supabase
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Accessibility</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Captions Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Captions</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="type" size={18} color="#6366f1" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Auto-Generated Captions</Text>
                <Text style={styles.settingDesc}>AI generates captions for all videos</Text>
              </View>
            </View>
            <Switch value={autoCaptions} onValueChange={(v) => setAutoCaptions(v)} trackColor={{ false: '#333', true: '#6366f1' }} thumbColor={autoCaptions ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="message-square" size={18} color="#6366f1" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Closed Captions (CC)</Text>
                <Text style={styles.settingDesc}>Show captions when available</Text>
              </View>
            </View>
            <Switch value={closedCaptions} onValueChange={(v) => setClosedCaptions(v)} trackColor={{ false: '#333', true: '#6366f1' }} thumbColor={closedCaptions ? '#fff' : '#666'} />
          </View>

          <Text style={styles.subLabel}>Caption Language</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.langScroll}>
            {languages.map(l => (
              <TouchableOpacity key={l} onPress={() => setCaptionLanguage(l)} style={[styles.langChip, captionLanguage === l && styles.langChipActive]}>
                <Text style={[styles.langChipText, captionLanguage === l && styles.langChipTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.subLabel}>Caption Size</Text>
          <View style={styles.sizeRow}>
            {sizes.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setCaptionSize(s.id)} style={[styles.sizeBtn, captionSize === s.id && styles.sizeBtnActive]}>
                <Text style={[styles.sizeSample, captionSize === s.id && styles.sizeSampleActive, s.id === 'small' && { fontSize: 10 }, s.id === 'medium' && { fontSize: 14 }, s.id === 'large' && { fontSize: 18 }, s.id === 'xlarge' && { fontSize: 22 }]}>
                  {s.sample}
                </Text>
                <Text style={[styles.sizeLabel, captionSize === s.id && styles.sizeLabelActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.subLabel}>Caption Style</Text>
          <View style={styles.styleRow}>
            {styles.map(s => (
              <TouchableOpacity key={s.id} onPress={() => setCaptionStyle(s.id)} style={[styles.styleBtn, captionStyle === s.id && styles.styleBtnActive]}>
                <View style={[styles.stylePreview, { backgroundColor: s.bg }]}>
                  <Text style={[styles.stylePreviewText, { color: s.text, fontSize: s.id === 'default' ? 12 : 12 }]}>ABC</Text>
                </View>
                <Text style={[styles.styleLabel, captionStyle === s.id && styles.styleLabelActive]}>{s.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Visual Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Visual</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="sun" size={18} color="#f59e0b" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>High Contrast Mode</Text>
                <Text style={styles.settingDesc}>Increase contrast for better visibility</Text>
              </View>
            </View>
            <Switch value={highContrast} onValueChange={(v) => setHighContrast(v)} trackColor={{ false: '#333', true: '#f59e0b' }} thumbColor={highContrast ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="mic" size={18} color="#10b981" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Audio Descriptions</Text>
                <Text style={styles.settingDesc}>Narrated descriptions of visual content</Text>
              </View>
            </View>
            <Switch value={audioDescription} onValueChange={(v) => setAudioDescription(v)} trackColor={{ false: '#333', true: '#10b981' }} thumbColor={audioDescription ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="video" size={18} color="#ec4899" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Sign Language Overlay</Text>
                <Text style={styles.settingDesc}>Show sign language interpreter window</Text>
              </View>
            </View>
            <Switch value={signLanguage} onValueChange={(v) => setSignLanguage(v)} trackColor={{ false: '#333', true: '#ec4899' }} thumbColor={signLanguage ? '#fff' : '#666'} />
          </View>
        </View>

        {/* Navigation Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="cpu" size={18} color="#8b5cf6" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Screen Reader Support</Text>
                <Text style={styles.settingDesc}>Optimize for assistive screen readers</Text>
              </View>
            </View>
            <Switch value={screenReader} onValueChange={(v) => setScreenReader(v)} trackColor={{ false: '#333', true: '#8b5cf6' }} thumbColor={screenReader ? '#fff' : '#666'} />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Feather name="command" size={18} color="#06b6d4" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingName}>Keyboard Navigation</Text>
                <Text style={styles.settingDesc}>Full keyboard control support</Text>
              </View>
            </View>
            <Switch value={keyboardNav} onValueChange={(v) => setKeyboardNav(v)} trackColor={{ false: '#333', true: '#06b6d4' }} thumbColor={keyboardNav ? '#fff' : '#666'} />
          </View>
        </View>

        {/* Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Caption Preview</Text>
          <View style={styles.previewBox}>
            <View style={[styles.captionPreview, { backgroundColor: styles.find(s => s.id === captionStyle)?.bg || '#000' }]}>
              <Text style={[
                styles.captionText, 
                { color: styles.find(s => s.id === captionStyle)?.text || '#fff' },
                captionSize === 'small' && { fontSize: 12 },
                captionSize === 'medium' && { fontSize: 16 },
                captionSize === 'large' && { fontSize: 20 },
                captionSize === 'xlarge' && { fontSize: 24 },
              ]}>
                This is how captions will appear
              </Text>
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },

  content: { flex: 1 },
  section: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },

  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingInfo: { flex: 1 },
  settingName: { color: '#fff', fontSize: 14, fontWeight: '600' },
  settingDesc: { color: '#666', fontSize: 12, marginTop: 2, lineHeight: 18 },

  subLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginTop: 12, marginBottom: 8, textTransform: 'uppercase' },

  langScroll: { marginBottom: 8 },
  langChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: '#1f1f1f', marginRight: 8 },
  langChipActive: { backgroundColor: '#6366f1' },
  langChipText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  langChipTextActive: { fontWeight: '700' },

  sizeRow: { flexDirection: 'row', gap: 10 },
  sizeBtn: { flex: 1, alignItems: 'center', backgroundColor: '#1f1f1f', padding: 10, borderRadius: 8 },
  sizeBtnActive: { borderWidth: 1, borderColor: '#6366f1' },
  sizeSample: { color: '#fff', fontWeight: '700' },
  sizeSampleActive: { color: '#6366f1' },
  sizeLabel: { color: '#666', fontSize: 11, marginTop: 4 },
  sizeLabelActive: { color: '#6366f1', fontWeight: '600' },

  styleRow: { flexDirection: 'row', gap: 10 },
  styleBtn: { flex: 1, alignItems: 'center' },
  styleBtnActive: { borderWidth: 2, borderColor: '#6366f1', borderRadius: 8, padding: 2 },
  stylePreview: { width: '100%', height: 40, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  stylePreviewText: { fontWeight: '700' },
  styleLabel: { color: '#666', fontSize: 10, marginTop: 4, textAlign: 'center' },
  styleLabelActive: { color: '#6366f1', fontWeight: '600' },

  previewBox: { backgroundColor: '#000', borderRadius: 8, padding: 16, marginTop: 8 },
  captionPreview: { padding: 12, borderRadius: 4, alignSelf: 'center' },
  captionText: { fontWeight: '600', textAlign: 'center' },
});
