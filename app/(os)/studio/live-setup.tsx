import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Radio } from 'lucide-react-native';
import { useStudio } from '@/domains/studio/hooks/useStudio';

const CATEGORIES = ['All', 'Music', 'Gaming', 'Education', 'News', 'Sports', 'Comedy', 'Tech', 'Church', 'Radio', 'TV'];

export default function LiveSetupScreen() {
  const router = useRouter();
  const { createLiveStream } = useStudio();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('All');
  const [goingLive, setGoingLive] = useState(false);
  const [stream, setStream] = useState<any>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera preview (web only)
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    navigator.mediaDevices?.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      })
      .catch((err) => console.log('Camera error:', err));

    return () => {
      if (videoRef.current?.srcObject) {
        (videoRef.current.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const handleGoLive = async () => {
    if (!title.trim() || goingLive) return;
    setGoingLive(true);
    const s = await createLiveStream(title, category);
    if (s) {
      setStream(s);
      // Redirect to live stream player
      setTimeout(() => {
        router.push(`/(os)/studio/live-stream?id=${s.id}` as any);
      }, 500);
    }
    setGoingLive(false);
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <ArrowLeft size={24} color="#fff" />
        </Pressable>
        <Text style={styles.headerTitle}>Go Live</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Camera Preview */}
      <View style={styles.previewWrap}>
        {Platform.OS === 'web' ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: '100%', height: 220, borderRadius: 12, objectFit: 'cover', backgroundColor: '#000' }}
          />
        ) : (
          <View style={[styles.previewFallback, { height: 220 }]}>
            <Radio size={40} color="#444" />
            <Text style={styles.previewText}>Camera preview</Text>
          </View>
        )}
      </View>

      {/* Stream Title */}
      <View style={styles.section}>
        <Text style={styles.label}>Stream Title</Text>
        <TextInput
          style={styles.input}
          placeholder="What's your stream about?"
          placeholderTextColor="#555"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Category */}
      <View style={styles.section}>
        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat}
              style={[styles.catChip, category === cat && styles.catChipActive]}
              onPress={() => setCategory(cat)}
            >
              <Text style={[styles.catText, category === cat && styles.catTextActive]}>{cat}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* GO LIVE Button */}
      <Pressable
        style={[styles.goLiveBtn, (!title.trim() || goingLive) && styles.goLiveBtnDisabled]}
        onPress={handleGoLive}
        disabled={!title.trim() || goingLive}
      >
        {goingLive ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <View style={styles.liveDot} />
            <Text style={styles.goLiveText}>GO LIVE</Text>
          </>
        )}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  headerTitle: { color: '#fff', fontSize: 16, fontWeight: '700' },
  previewWrap: { paddingHorizontal: 16, marginBottom: 16 },
  previewFallback: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: { color: '#555', fontSize: 13, marginTop: 8 },
  section: { paddingHorizontal: 16, marginBottom: 16 },
  label: { color: '#888', fontSize: 12, marginBottom: 6 },
  input: {
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fff',
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#333',
  },
  catScroll: { maxHeight: 36 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1a1a1a',
    marginRight: 6,
    height: 32,
  },
  catChipActive: { backgroundColor: '#ff0040' },
  catText: { color: '#aaa', fontSize: 12, fontWeight: '600' },
  catTextActive: { color: '#fff' },
  goLiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ff0040',
    marginHorizontal: 16,
    marginVertical: 20,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  goLiveBtnDisabled: { opacity: 0.5 },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  goLiveText: { color: '#fff', fontWeight: '800', fontSize: 15 },
});
