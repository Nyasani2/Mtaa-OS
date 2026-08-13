// app/(media)/gallery/index.tsx
// MTAA Gallery — Photos & Videos

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLS = 3;
const SIZE = (width - 48) / COLS;

const MOCK_ALBUMS = [
  { id: '1', name: 'All Photos', count: 124 },
  { id: '2', name: 'Favorites', count: 23 },
  { id: '3', name: 'Screenshots', count: 45 },
  { id: '4', name: 'Videos', count: 12 },
];

export default function GalleryScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'photos' | 'albums'>('photos');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Gallery</Text>
        <TouchableOpacity onPress={() => router.push('/(media)/camera' as any)}>
          <Ionicons name="camera" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'photos' && styles.tabActive]}
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.tabTextActive]}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'albums' && styles.tabActive]}
          onPress={() => setActiveTab('albums')}
        >
          <Text style={[styles.tabText, activeTab === 'albums' && styles.tabTextActive]}>Albums</Text>
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {activeTab === 'albums' ? (
          <View style={styles.albumsGrid}>
            {MOCK_ALBUMS.map((album: any) => (
              <TouchableOpacity key={album.id} style={styles.albumCard}>
                <View style={styles.albumCover}>
                  <Ionicons name="images" size={32} color="#C7C7CC" />
                </View>
                <Text style={styles.albumName}>{album.name}</Text>
                <Text style={styles.albumCount}>{album.count}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.photoGrid}>
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i} style={styles.photoPlaceholder}>
                <Ionicons name="image" size={24} color="#C7C7CC" />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#000' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#007AFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#8E8E93' },
  tabTextActive: { color: '#007AFF' },
  albumsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  albumCard: {
    width: '48%',
    marginHorizontal: '1%',
    marginBottom: 12,
  },
  albumCover: {
    aspectRatio: 1,
    backgroundColor: '#E5E5EA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  albumName: { fontSize: 14, fontWeight: '600', color: '#000', marginTop: 8 },
  albumCount: { fontSize: 12, color: '#8E8E93', marginTop: 2 },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
  },
  photoPlaceholder: {
    width: SIZE,
    height: SIZE,
    backgroundColor: '#E5E5EA',
    margin: 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 4,
  },
});
