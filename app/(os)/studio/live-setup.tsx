import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch, Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function LiveStreamSetupScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [chatEnabled, setChatEnabled] = useState(true);
  const [donationsEnabled, setDonationsEnabled] = useState(true);
  const [cameraMode, setCameraMode] = useState<'single' | 'multi'>('single');
  const [isGoingLive, setIsGoingLive] = useState(false);

  const categories = ['Vlog', 'Gaming', 'Music', 'Talk', 'News', 'Education', 'Sports', 'Other'];

  const handleGoLive = () => {
    if (!title.trim()) {
      Alert.alert('Title Required', 'Enter a title for your live stream.');
      return;
    }
    setIsGoingLive(true);
    setTimeout(() => {
      setIsGoingLive(false);
      router.push({
        pathname: '/(os)/studio/live-active',
        params: { title, chatEnabled: chatEnabled ? '1' : '0', donationsEnabled: donationsEnabled ? '1' : '0' },
      });
    }, 2000);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>🔴 Go Live</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Title */}
        <Text style={styles.label}>Stream Title *</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="What's happening today?"
          placeholderTextColor="#475569"
        />

        {/* Description */}
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Tell viewers what to expect..."
          placeholderTextColor="#475569"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Category */}
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, category === cat && styles.categoryBtnActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.categoryText, category === cat && styles.categoryTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Camera Mode */}
        <Text style={styles.label}>Camera Setup</Text>
        <View style={styles.cameraModeRow}>
          <TouchableOpacity
            style={[styles.cameraModeBtn, cameraMode === 'single' && styles.cameraModeBtnActive]}
            onPress={() => setCameraMode('single')}
          >
            <Ionicons name="videocam" size={22} color={cameraMode === 'single' ? '#3B82F6' : '#64748B'} />
            <Text style={[styles.cameraModeText, cameraMode === 'single' && styles.cameraModeTextActive]}>Single Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cameraModeBtn, cameraMode === 'multi' && styles.cameraModeBtnActive]}
            onPress={() => setCameraMode('multi')}
          >
            <Ionicons name="grid" size={22} color={cameraMode === 'multi' ? '#3B82F6' : '#64748B'} />
            <Text style={[styles.cameraModeText, cameraMode === 'multi' && styles.cameraModeTextActive]}>Multi-Camera</Text>
          </TouchableOpacity>
        </View>

        {/* Toggles */}
        <View style={styles.toggleCard}>
          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Live Chat</Text>
              <Text style={styles.toggleSubtext}>Viewers can send messages</Text>
            </View>
            <Switch value={chatEnabled} onValueChange={setChatEnabled} trackColor={{ false: '#334155', true: '#3B82F6' }} />
          </View>
          <View style={[styles.toggleRow, { borderTopWidth: 1, borderTopColor: '#334155', marginTop: 12, paddingTop: 12 }]}>
            <View>
              <Text style={styles.toggleLabel}>Donations & Tips</Text>
              <Text style={styles.toggleSubtext}>Viewers can send money during stream</Text>
            </View>
            <Switch value={donationsEnabled} onValueChange={setDonationsEnabled} trackColor={{ false: '#334155', true: '#22C55E' }} />
          </View>
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbCard}>
          <Ionicons name="image" size={24} color="#64748B" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.thumbTitle}>Stream Thumbnail</Text>
            <Text style={styles.thumbDesc}>Add a thumbnail to attract viewers</Text>
          </View>
          <TouchableOpacity style={styles.thumbBtn}>
            <Text style={styles.thumbBtnText}>Upload</Text>
          </TouchableOpacity>
        </View>

        {/* Go Live Button */}
        <TouchableOpacity
          style={[styles.goLiveBtn, isGoingLive && styles.goLiveBtnDisabled]}
          onPress={handleGoLive}
          disabled={isGoingLive}
        >
          {isGoingLive ? (
            <>
              <Ionicons name="radio" size={20} color="#FFF" />
              <Text style={styles.goLiveText}>Starting Broadcast...</Text>
            </>
          ) : (
            <>
              <View style={styles.liveDot} />
              <Text style={styles.goLiveText}>GO LIVE NOW</Text>
            </>
          )}
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
  textArea: { height: 80, paddingTop: 14 },
  categoryScroll: { marginTop: 4 },
  categoryBtn: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155',
  },
  categoryBtnActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  categoryText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  categoryTextActive: { color: '#FFF' },
  cameraModeRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  cameraModeBtn: {
    flex: 1, alignItems: 'center', gap: 6,
    paddingVertical: 14, backgroundColor: '#1E293B',
    borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  cameraModeBtnActive: { borderColor: '#3B82F6', backgroundColor: '#3B82F610' },
  cameraModeText: { fontSize: 13, color: '#94A3B8', fontWeight: '600' },
  cameraModeTextActive: { color: '#3B82F6' },
  toggleCard: {
    backgroundColor: '#1E293B', borderRadius: 14,
    marginHorizontal: 16, marginTop: 16, padding: 16,
    borderWidth: 1, borderColor: '#334155',
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  toggleLabel: { fontSize: 15, fontWeight: '600', color: '#F1F5F9' },
  toggleSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  thumbCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1E293B', marginHorizontal: 16, marginTop: 16,
    padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#334155',
  },
  thumbTitle: { fontSize: 14, fontWeight: '600', color: '#F1F5F9' },
  thumbDesc: { fontSize: 12, color: '#94A3B8', marginTop: 2 },
  thumbBtn: {
    backgroundColor: '#3B82F620', paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 8,
  },
  thumbBtnText: { fontSize: 12, color: '#3B82F6', fontWeight: '700' },
  goLiveBtn: {
    backgroundColor: '#EF4444', borderRadius: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 18, gap: 10, marginHorizontal: 16, marginTop: 24,
    shadowColor: '#EF4444', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
  },
  goLiveBtnDisabled: { backgroundColor: '#7F1D1D' },
  liveDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#FFF' },
  goLiveText: { color: '#FFF', fontSize: 18, fontWeight: '800', letterSpacing: 1 },
});
