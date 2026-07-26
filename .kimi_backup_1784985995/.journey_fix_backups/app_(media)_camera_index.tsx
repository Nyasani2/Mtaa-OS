// app/(media)/camera/index.tsx
// MTAA Camera — Photo/Video capture

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function CameraScreen() {
  const router = useRouter();
  const [captured, setCaptured] = useState<string | null>(null);

  const handleCapture = () => {
    // Placeholder for actual camera capture
    setCaptured('placeholder');
  };

  const handleGallery = () => {
    router.push('/(media)/gallery');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Camera</Text>
        <TouchableOpacity onPress={handleGallery}>
          <Ionicons name="images" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.preview}>
        {captured ? (
          <View style={styles.capturedPlaceholder}>
            <Ionicons name="image" size={64} color="#666" />
            <Text style={styles.capturedText}>Photo captured</Text>
          </View>
        ) : (
          <View style={styles.cameraPlaceholder}>
            <Ionicons name="camera" size={80} color="#444" />
            <Text style={styles.placeholderText}>Camera preview</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlBtn}>
          <Ionicons name="flash" size={24} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.shutterBtn} onPress={handleCapture}>
          <View style={styles.shutterInner} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={handleGallery}>
          <Ionicons name="images" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '700' },
  preview: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  cameraPlaceholder: { alignItems: 'center' },
  placeholderText: { color: '#666', marginTop: 16, fontSize: 16 },
  capturedPlaceholder: { alignItems: 'center' },
  capturedText: { color: '#fff', marginTop: 16, fontSize: 16 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 32,
  },
  controlBtn: { padding: 12 },
  shutterBtn: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shutterInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
  },
});
