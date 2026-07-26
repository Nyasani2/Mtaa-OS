// app/(os)/tribes/post-create.tsx
// Create Post Screen

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { tribesService } from '@/lib/tribes/services/tribes.service';

export default function PostCreateScreen() {
  const router = useRouter();
  const { tribeId } = useLocalSearchParams();
  const [type, setType] = useState<'text' | 'image' | 'poll' | 'announcement'>('text');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [pollOptions, setPollOptions] = useState(['', '']);
  const [isAnnouncement, setIsAnnouncement] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Required', 'Enter post content');
      return;
    }

    setSubmitting(true);
    const res = await tribesService.createPost(tribeId as string, {
      type: isAnnouncement ? 'announcement' : type,
      title: title.trim() || undefined,
      content: content.trim(),
      poll_options: type === 'poll' ? pollOptions.filter(o => o.trim()) : undefined,
      is_announcement: isAnnouncement,
    });
    setSubmitting(false);

    if (res.success) {
      Alert.alert('Posted!', 'Your post is live.');
      router.back();
    } else {
      Alert.alert('Error', res.error || 'Could not post');
    }
  };

  const addPollOption = () => setPollOptions([...pollOptions, '']);
  const updatePollOption = (idx: number, val: string) => {
    const updated = [...pollOptions];
    updated[idx] = val;
    setPollOptions(updated);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backBtn}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <View style={{ width: 30 }} />
        </View>

        <View style={styles.typeRow}>
          {(['text', 'image', 'poll', 'announcement'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, type === t && styles.typeChipActive]}
              onPress={() => { setType(t); setIsAnnouncement(t === 'announcement'); }}
            >
              <Text style={type === t ? styles.typeChipTextActive : styles.typeChipText}>
                {t === 'text' ? '📝' : t === 'image' ? '📷' : t === 'poll' ? '📊' : '📢'} {t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput style={styles.input} placeholder="Title (optional)" placeholderTextColor="#666" value={title} onChangeText={setTitle} />
        <TextInput style={[styles.input, styles.contentInput]} placeholder="What's on your mind?" placeholderTextColor="#666" value={content} onChangeText={setContent} multiline numberOfLines={6} />

        {type === 'poll' && (
          <View style={styles.pollSection}>
            <Text style={styles.pollLabel}>Poll Options</Text>
            {pollOptions.map((opt, idx) => (
              <TextInput
                key={idx}
                style={styles.pollInput}
                placeholder={`Option ${idx + 1}`}
                placeholderTextColor="#666"
                value={opt}
                onChangeText={(val) => updatePollOption(idx, val)}
              />
            ))}
            <TouchableOpacity onPress={addPollOption}>
              <Text style={styles.addOption}>+ Add Option</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Post</Text>}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0f' },
  scroll: { padding: 16, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn: { fontSize: 24, color: '#fff' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1a1a2e', borderWidth: 1, borderColor: '#2a2a3e' },
  typeChipActive: { borderColor: '#007AFF', backgroundColor: '#0d1b3e' },
  typeChipText: { fontSize: 12, color: '#ccc' },
  typeChipTextActive: { fontSize: 12, color: '#fff', fontWeight: '600' },
  input: { backgroundColor: '#1a1a2e', borderRadius: 12, padding: 14, fontSize: 15, color: '#fff', marginBottom: 12, borderWidth: 1, borderColor: '#2a2a3e' },
  contentInput: { height: 120, textAlignVertical: 'top' },
  pollSection: { marginBottom: 16 },
  pollLabel: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 10 },
  pollInput: { backgroundColor: '#1a1a2e', borderRadius: 10, padding: 12, fontSize: 14, color: '#fff', marginBottom: 8, borderWidth: 1, borderColor: '#2a2a3e' },
  addOption: { fontSize: 14, color: '#007AFF', fontWeight: '600', marginTop: 4 },
  submitBtn: { backgroundColor: '#007AFF', borderRadius: 14, padding: 18, alignItems: 'center', marginTop: 10 },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
