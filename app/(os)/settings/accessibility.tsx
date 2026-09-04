// @ts-nocheck
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AccessibilitySettingsScreen() {
  const router = useRouter();
  const [talkBack, setTalkBack] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [largeText, setLargeText] = useState(false);
  const [colorCorrection, setColorCorrection] = useState(false);
  const [magnification, setMagnification] = useState(false);
  const [closedCaptions, setClosedCaptions] = useState(false);
  const [monoAudio, setMonoAudio] = useState(false);

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Accessibility</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>VISION</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Ionicons name="eye-outline" size={20} color="#6366f1" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>TalkBack</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Screen reader</Text>
              </View>
              <Switch value={talkBack} onValueChange={setTalkBack}
                trackColor={{ false: '#334155', true: '#6366f1' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Ionicons name="contrast-outline" size={20} color="#EF4444" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>High Contrast</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Increase text contrast</Text>
              </View>
              <Switch value={highContrast} onValueChange={setHighContrast}
                trackColor={{ false: '#334155', true: '#EF4444' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Ionicons name="text-outline" size={20} color="#10B981" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Large Text</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Increase font size system-wide</Text>
              </View>
              <Switch value={largeText} onValueChange={setLargeText}
                trackColor={{ false: '#334155', true: '#10B981' }} thumbColor="#fff" />
            </View>
            <View style={s.row}>
              <Ionicons name="color-palette-outline" size={20} color="#F59E0B" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Color Correction</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Adjust for color blindness</Text>
              </View>
              <Switch value={colorCorrection} onValueChange={setColorCorrection}
                trackColor={{ false: '#334155', true: '#F59E0B' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="scan-outline" size={20} color="#8B5CF6" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Magnification</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Zoom gestures</Text>
              </View>
              <Switch value={magnification} onValueChange={setMagnification}
                trackColor={{ false: '#334155', true: '#8B5CF6' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>MOTION</Text>
          <View style={s.card}>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="pulse-outline" size={20} color="#06B6D4" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Reduce Motion</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Minimize animations</Text>
              </View>
              <Switch value={reduceMotion} onValueChange={setReduceMotion}
                trackColor={{ false: '#334155', true: '#06B6D4' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>HEARING</Text>
          <View style={s.card}>
            <View style={s.row}>
              <Ionicons name="subtitles-outline" size={20} color="#EC4899" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Closed Captions</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Show subtitles for media</Text>
              </View>
              <Switch value={closedCaptions} onValueChange={setClosedCaptions}
                trackColor={{ false: '#334155', true: '#EC4899' }} thumbColor="#fff" />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Ionicons name="ear-outline" size={20} color="#3B82F6" style={{ marginRight: 12 }} />
              <View style={{ flex: 1 }}>
                <Text style={s.rowText}>Mono Audio</Text>
                <Text style={{ color: '#64748B', fontSize: 12, marginTop: 2 }}>Combine stereo to mono</Text>
              </View>
              <Switch value={monoAudio} onValueChange={setMonoAudio}
                trackColor={{ false: '#334155', true: '#3B82F6' }} thumbColor="#fff" />
            </View>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  backBtn: { padding: 8, marginLeft: -8 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  section: { marginBottom: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5, textTransform: 'uppercase' },
  card: { backgroundColor: '#1E293B', borderRadius: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, borderBottomWidth: 0.5, borderBottomColor: '#334155' },
  rowText: { fontSize: 16, color: '#fff' },
});
