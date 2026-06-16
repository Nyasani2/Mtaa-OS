import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function PublishFlowScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private'>('public');
  const [monetization, setMonetization] = useState(true);
  const [schedule, setSchedule] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  const handlePublish = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Enter a title for your video.');
      return;
    }
    setIsPublishing(true);
    setTimeout(() => {
      setIsPublishing(false);
      Alert.alert(
        '✅ Published!',
        'Your video is now live on MTAA Studio.',
        [{ text: 'View', onPress: () => router.push('/(os)/studio') }]
      );
    }, 2000);
  };

  const handleSchedule = () => {
    if (!scheduleDate.trim()) {
      Alert.alert('Date Required', 'Enter a schedule date (YYYY-MM-DD HH:MM).');
      return;
    }
    Alert.alert('✅ Scheduled', `Video will publish on ${scheduleDate}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🚀 Publish</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title */}
        <Text style={styles.label}>Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Give your video a catchy title..."
          placeholderTextColor="#475569"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell viewers what your video is about..."
          placeholderTextColor="#475569"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Tags */}
        <Text style={styles.label}>Tags (comma separated)</Text>
        <TextInput
          style={styles.input}
          value={tags}
          onChangeText={setTags}
          placeholder="nairobi, vlog, food, travel..."
          placeholderTextColor="#475569"
        />

        {/* Visibility */}
        <Text style={styles.label}>Visibility</Text>
        <View style={styles.visibilityRow}>
          {(['public', 'unlisted', 'private'] as const).map((v) => (
            <TouchableOpacity
              key={v}
              style={[styles.visibilityBtn, visibility === v && styles.visibilityBtnActive]}
              onPress={() => setVisibility(v)}
            >
              <Ionicons
                name={v === 'public' ? 'globe' : v === 'unlisted' ? 'link' : 'lock-closed'}
                size={16}
                color={visibility === v ? '#3B82F6' : '#64748B'}
              />
              <Text style={[styles.visibilityText, visibility === v && styles.visibilityTextActive]}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Monetization */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Enable Monetization</Text>
            <Text style={styles.switchSubtext}>Ads, memberships, and tips</Text>
          </View>
          <Switch value={monetization} onValueChange={setMonetization} trackColor={{ false: '#334155', true: '#22C55E' }} />
        </View>

        {/* Schedule */}
        <View style={styles.switchRow}>
          <View>
            <Text style={styles.switchLabel}>Schedule Publication</Text>
            <Text style={styles.switchSubtext}>Publish at a specific time</Text>
          </View>
          <Switch value={schedule} onValueChange={setSchedule} trackColor={{ false: '#334155', true: '#3B82F6' }} />
        </View>

        {schedule && (
          <>
            <Text style={styles.label}>Schedule Date & Time</Text>
            <TextInput
              style={styles.input}
              value={scheduleDate}
              onChangeText={setScheduleDate}
              placeholder="2026-06-20 14:00"
              placeholderTextColor="#475569"
            />
            <TouchableOpacity style={styles.scheduleBtn} onPress={handleSchedule}>
              <Ionicons name="calendar" size={18} color="#3B82F6" />
              <Text style={styles.scheduleBtnText}>Confirm Schedule</Text>
            </TouchableOpacity>
          </>
        )}

        {/* ASIS Suggestions */}
        <View style={styles.asisCard}>
          <View style={styles.asisHeader}>
            <Ionicons name="sparkles" size={18} color="#A855F7" />
            <Text style={styles.asisTitle}>ASIS Suggestions</Text>
          </View>
          <Text style={styles.asisItem}>• Add "Nairobi" to tags for better discovery</Text>
          <Text style={styles.asisItem}>• Your title is 40 chars — ideal length!</Text>
          <Text style={styles.asisItem}>• Schedule for 7 PM for max engagement</Text>
        </View>

        {/* Publish Button */}
        <TouchableOpacity
          style={[styles.publishBtn, isPublishing && styles.publishBtnDisabled]}
          onPress={handlePublish}
          disabled={isPublishing}
        >
          {isPublishing ? (
            <>
              <Ionicons name="sync" size={20} color="#FFF" />
              <Text style={styles.publishBtnText}>Publishing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="rocket" size={20} color="#FFF" />
              <Text style={styles.publishBtnText}>Publish Now</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.draftBtn} onPress={() => router.push('/(os)/studio/drafts')}>
          <Text style={styles.draftBtnText}>Save to Drafts Instead</Text>
        </TouchableOpacity>
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
  textArea: { height: 100, paddingTop: 14 },
  visibilityRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  visibilityBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  visibilityBtnActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  visibilityText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  visibilityTextActive: { color: '#3B82F6' },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginHorizontal: 16, marginTop: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: '#1E293B',
  },
  switchLabel: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  switchSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  scheduleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginHorizontal: 16, marginTop: 8,
    paddingVertical: 12, backgroundColor: '#1E293B', borderRadius: 12,
    borderWidth: 1, borderColor: '#3B82F640',
  },
  scheduleBtnText: { fontSize: 14, color: '#3B82F6', fontWeight: '600' },
  asisCard: {
    backgroundColor: '#1E293B', borderRadius: 14,
    marginHorizontal: 16, marginTop: 20, padding: 16,
    borderWidth: 1, borderColor: '#A855F730',
  },
  asisHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  asisTitle: { fontSize: 14, fontWeight: '700', color: '#A855F7' },
  asisItem: { fontSize: 13, color: '#94A3B8', marginBottom: 6, lineHeight: 18 },
  publishBtn: {
    backgroundColor: '#22C55E', borderRadius: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, gap: 8, marginHorizontal: 16, marginTop: 24,
  },
  publishBtnDisabled: { backgroundColor: '#14532D' },
  publishBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  draftBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 8 },
  draftBtnText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
});
