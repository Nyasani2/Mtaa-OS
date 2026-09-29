// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Alert, Dimensions } from 'react-native';
import * as MediaLibrary from 'expo-media-library';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const ITEM_SIZE = width / COLUMN_COUNT;

export default function GalleryScreen() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'albums'>('photos');

  useEffect(() => {
    (async () => {
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status === 'granted') {
        const { assets } = await MediaLibrary.getAssetsAsync({
          mediaType: ['photo', 'video'],
          sortBy: 'creationTime',
          first: 100, // Load latest 100 items
        });
        setPhotos(assets);
      } else {
        Alert.alert('Permission Denied', 'Please allow access to your photos in settings.');
      }
      setLoading(false);
    })();
  }, []);

  const renderPhoto = ({ item }) => (
    <TouchableOpacity 
      style={styles.photoItem} 
      onPress={() => router.push({ pathname: '/(os)/gallery/viewer', params: { uri: item.uri, type: item.mediaType } })}
    >
      <Image source={{ uri: item.uri }} style={styles.image} />
      {item.mediaType === 'video' && (
        <View style={styles.videoIconOverlay}>
          <Ionicons name="play-circle" size={24} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gallery</Text>
        <TouchableOpacity onPress={() => router.push('/(os)/camera')}>
          <Ionicons name="camera" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'photos' && styles.activeTab]} 
          onPress={() => setActiveTab('photos')}
        >
          <Text style={[styles.tabText, activeTab === 'photos' && styles.activeTabText]}>Photos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'albums' && styles.activeTab]} 
          onPress={() => setActiveTab('albums')}
        >
          <Text style={[styles.tabText, activeTab === 'albums' && styles.activeTabText]}>Albums</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}><Text style={styles.loadingText}>Loading media...</Text></View>
      ) : (
        <FlatList
          data={photos}
          renderItem={renderPhoto}
          keyExtractor={(item) => item.id}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.grid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800', color: '#000' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#e5e5e5' },
  tab: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#007AFF' },
  tabText: { fontSize: 15, fontWeight: '600', color: '#8e8e93' },
  activeTabText: { color: '#007AFF' },
  grid: { padding: 2 },
  photoItem: { width: ITEM_SIZE, height: ITEM_SIZE, padding: 1 },
  image: { width: '100%', height: '100%', backgroundColor: '#e5e5e5' },
  videoIconOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.2)' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#8e8e93', fontSize: 16 },
});
