import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase/client';

export default function LiveSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('general');
  const [enableChat, setEnableChat] = useState(true);
  const [enableRecording, setEnableRecording] = useState(true);
  const [starting, setStarting] = useState(false);

  const categories = [
    { key: 'general', label: 'General', icon: 'hash' },
    { key: 'music', label: 'Music', icon: 'music' },
    { key: 'gaming', label: 'Gaming', icon: 'cpu' },
    { key: 'education', label: 'Education', icon: 'book-open' },
    { key: 'news', label: 'News', icon: 'radio' },
    { key: 'sports', label: 'Sports', icon: 'activity' },
  ];

  const startStream = async () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Please enter a stream title');
      return;
    }
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to stream');
      return;
    }

    setStarting(true);
    try {
      const { data, error } = await supabase
        .from('studio_live_streams')
        .insert({
          creator_id: user.id,
          title: title.trim(),
          description: description.trim(),
          category,
          status: 'live',
          enable_chat: enableChat,
          enable_recording: enableRecording,
          viewer_count: 0,
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Navigate to live active screen
      router.replace(`/(os)/studio/live-active?id=${data.id}`);
    } catch (e) {
      console.error('Start stream error:', e);
      Alert.alert('Error', 'Could not start stream. Please try again.');
      setStarting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="x" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Go Live</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Live Badge */}
        <View style={styles.liveBanner}>
          <View style={styles.liveDot} />
          <Text style={styles.liveBannerText}>You are about to go live</Text>
        </View>

        {/* Title */}
        <View style={styles.field}>
          <Text style={styles.label}>Stream Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="What's your stream about?"
            placeholderTextColor="#666"
            maxLength={100}
          />
          <Text style={styles.charCount}>{title.length}/100</Text>
        </View>

        {/* Description */}
        <View style={styles.field}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell viewers what to expect..."
            placeholderTextColor="#666"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.charCount}>{description.length}/500</Text>
        </View>

        {/* Category */}
        <View style={styles.field}>
          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryGrid}>
            {categories.map(cat => (
              <TouchableOpacity
                key={cat.key}
                style={[styles.catBtn, category === cat.key && styles.catBtnActive]}
                onPress={() => setCategory(cat.key)}
              >
                <Feather name={cat.icon as any} size={18} color={category === cat.key ? '#fff' : '#9ca3af'} />
                <Text style={[styles.catText, category === cat.key && styles.catTextActive]}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Settings */}
        <View style={styles.settingsCard}>
          <Text style={styles.settingsTitle}>Stream Settings</Text>
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Live Chat</Text>
              <Text style={styles.settingDesc}>Allow viewers to send messages</Text>
            </View>
            <Switch value={enableChat} onValueChange={setEnableChat} trackColor={{ false: '#333', true: '#6366f1' }} />
          </View>
          <View style={styles.divider} />
          <View style={styles.settingRow}>
            <View>
              <Text style={styles.settingLabel}>Auto Record</Text>
              <Text style={styles.settingDesc}>Save stream as video after ending</Text>
            </View>
            <Switch value={enableRecording} onValueChange={setEnableRecording} trackColor={{ false: '#333', true: '#6366f1' }} />
          </View>
        </View>

        {/* Start Button */}
        <TouchableOpacity
          style={[styles.startBtn, (!title.trim() || starting) && styles.startBtnDisabled]}
          onPress={startStream}
          disabled={!title.trim() || starting}
        >
          <View style={styles.liveIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.startText}>{starting ? 'Starting...' : 'Go Live Now'}</Text>
          </View>
        </TouchableOpacity>

        <Text style={styles.terms}>
          By going live, you agree to our Community Guidelines. Inappropriate content may result in account suspension.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1f1f1f' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  liveBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, margin: 16, paddingVertical: 12, backgroundColor: '#2a0a0a', borderRadius: 10, borderWidth: 1, borderColor: '#ef444422' },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  liveBannerText: { color: '#ef4444', fontSize: 14, fontWeight: '600' },
  field: { marginHorizontal: 16, marginBottom: 20 },
  label: { color: '#9ca3af', fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { backgroundColor: '#1f1f1f', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: '#fff', fontSize: 15, borderWidth: 1, borderColor: '#2a2a2a' },
  textArea: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  charCount: { color: '#666', fontSize: 12, textAlign: 'right', marginTop: 4 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#1f1f1f', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#2a2a2a' },
  catBtnActive: { backgroundColor: '#6366f1', borderColor: '#6366f1' },
  catText: { color: '#9ca3af', fontSize: 13, fontWeight: '500' },
  catTextActive: { color: '#fff' },
  settingsCard: { marginHorizontal: 16, marginBottom: 20, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 16 },
  settingsTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabel: { color: '#fff', fontSize: 14, fontWeight: '600' },
  settingDesc: { color: '#666', fontSize: 12, marginTop: 2 },
  divider: { height: 1, backgroundColor: '#2a2a2a', marginVertical: 12 },
  startBtn: { marginHorizontal: 16, backgroundColor: '#ef4444', paddingVertical: 18, borderRadius: 12, alignItems: 'center' },
  startBtnDisabled: { backgroundColor: '#5a1a1a' },
  liveIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pulseDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#fff' },
  startText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  terms: { color: '#666', fontSize: 12, textAlign: 'center', marginHorizontal: 24, marginTop: 16, lineHeight: 18 },
});
