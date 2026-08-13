// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';

const { width } = Dimensions.get('window');

const CAMERAS = [
  { id: 'gate-main', name: 'Main Gate', location: 'School Entrance', status: 'online', type: 'hikvision', streamUrl: null, allowed: true },
  { id: 'gate-parking', name: 'Parking', location: 'Staff Parking', status: 'online', type: 'dahua', streamUrl: null, allowed: true },
  { id: 'hallway-a', name: 'Hallway A', location: 'Admin Block', status: 'online', type: 'hikvision', streamUrl: null, allowed: true },
  { id: 'playground', name: 'Playground', location: 'Main Playground', status: 'online', type: 'uniview', streamUrl: null, allowed: true },
  { id: 'dining', name: 'Dining Hall', location: 'Dining Hall Entrance', status: 'online', type: 'hikvision', streamUrl: null, allowed: true },
  { id: 'library', name: 'Library', location: 'Library Entrance', status: 'offline', type: 'dahua', streamUrl: null, allowed: true },
  { id: 'computer-lab', name: 'Computer Lab', location: 'Lab Entrance', status: 'online', type: 'hikvision', streamUrl: null, allowed: true },
  { id: 'assembly', name: 'Assembly Ground', location: 'Assembly Area', status: 'online', type: 'uniview', streamUrl: null, allowed: true },
  { id: 'reception', name: 'Reception', location: 'Main Reception', status: 'online', type: 'hikvision', streamUrl: null, allowed: true },
  { id: 'bus-stop', name: 'Bus Stop', location: 'School Bus Bay', status: 'online', type: 'dahua', streamUrl: null, allowed: true },
  { id: 'bathroom-1', name: 'Bathroom 1', location: 'Block A', status: 'forbidden', type: 'none', streamUrl: null, allowed: false },
  { id: 'changing-room', name: 'Changing Room', location: 'Sports Block', status: 'forbidden', type: 'none', streamUrl: null, allowed: false },
];

export default function CCTVViewer() {
  const router = useRouter();
  const [selectedCamera, setSelectedCamera] = useState(CAMERAS[0]);
  const [viewMode, setViewMode] = useState('live'); // live, recorded, grid
  const [gridCameras, setGridCameras] = useState(CAMERAS.filter((c: any) => c.allowed).slice(0, 4));

  const handleCameraSelect = (camera) => {
    if (!camera.allowed) {
      Alert.alert('Restricted', 'This camera location is restricted by policy. Bathrooms, changing rooms, and private offices cannot be monitored.');
      return;
    }
    setSelectedCamera(camera);
    setViewMode('live');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CCTV Monitor</Text>
        <View style={styles.headerRight}>
          <View style={[styles.statusBadge, selectedCamera.status === 'online' ? styles.online : selectedCamera.status === 'offline' ? styles.offline : styles.forbidden]}>
            <Text style={styles.statusText}>{selectedCamera.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      {/* Main Feed */}
      <View style={styles.feedContainer}>
        {viewMode === 'live' ? (
          <View style={styles.mainFeed}>
            <View style={styles.feedPlaceholder}>
              <Ionicons name="videocam" size={48} color="#475569" />
              <Text style={styles.feedText}>{selectedCamera.name}</Text>
              <Text style={styles.feedSub}>{selectedCamera.location}</Text>
              <Text style={styles.feedType}>{selectedCamera.type.toUpperCase()} • ONVIF Ready</Text>
            </View>
            {/* Overlay controls */}
            <View style={styles.feedOverlay}>
              <Text style={styles.liveBadge}>● LIVE</Text>
              <Text style={styles.timestamp}>{new Date().toLocaleTimeString()}</Text>
            </View>
          </View>
        ) : viewMode === 'grid' ? (
          <View style={styles.gridContainer}>
            {gridCameras.map((cam: any) => (
              <TouchableOpacity key={cam.id} style={styles.gridCell} onPress={() => handleCameraSelect(cam)}>
                <View style={styles.gridPlaceholder}>
                  <Ionicons name="videocam-outline" size={24} color="#64748b" />
                  <Text style={styles.gridLabel}>{cam.name}</Text>
                </View>
                <View style={[styles.gridStatus, cam.status === 'online' ? styles.gridOnline : styles.gridOffline]} />
              </TouchableOpacity>
            ))}
          </View>
        ) : null}
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={[styles.controlBtn, viewMode === 'live' && styles.controlBtnActive]} onPress={() => setViewMode('live')}>
          <Ionicons name="videocam-outline" size={18} color={viewMode === 'live' ? '#fff' : '#64748b'} />
          <Text style={[styles.controlText, viewMode === 'live' && styles.controlTextActive]}>Live</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.controlBtn, viewMode === 'grid' && styles.controlBtnActive]} onPress={() => setViewMode('grid')}>
          <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? '#fff' : '#64748b'} />
          <Text style={[styles.controlText, viewMode === 'grid' && styles.controlTextActive]}>Grid</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Recordings', 'Playback from cloud storage coming soon.')}>
          <Ionicons name="play-back-outline" size={18} color="#64748b" />
          <Text style={styles.controlText}>Playback</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlBtn} onPress={() => Alert.alert('Snapshot', 'Screenshot saved to incident report.')}>
          <Ionicons name="camera-outline" size={18} color="#64748b" />
          <Text style={styles.controlText}>Snapshot</Text>
        </TouchableOpacity>
      </View>

      {/* Camera List */}
      <ScrollView style={styles.cameraList} horizontal showsHorizontalScrollIndicator={false}>
        {CAMERAS.map((camera: any) => (
          <TouchableOpacity
            key={camera.id}
            style={[
              styles.cameraChip,
              selectedCamera.id === camera.id && styles.cameraChipActive,
              !camera.allowed && styles.cameraChipForbidden,
            ]}
            onPress={() => handleCameraSelect(camera)}
          >
            <Ionicons 
              name={camera.allowed ? "videocam-outline" : "lock-closed-outline"} 
              size={16} 
              color={camera.allowed ? (selectedCamera.id === camera.id ? '#fff' : '#64748b') : '#ef4444'} 
            />
            <Text style={[
              styles.cameraChipText,
              selectedCamera.id === camera.id && styles.cameraChipTextActive,
              !camera.allowed && styles.cameraChipTextForbidden,
            ]}>
              {camera.name}
            </Text>
            <View style={[
              styles.cameraStatus,
              camera.status === 'online' ? styles.statusOnline : camera.status === 'offline' ? styles.statusOffline : styles.statusForbidden,
            ]} />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Storage Info */}
      <View style={styles.storageBar}>
        <Text style={styles.storageText}>Storage: 2.4 TB / 5 TB (48%)</Text>
        <View style={styles.storageTrack}>
          <View style={[styles.storageFill, { width: '48%' }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, paddingTop: 60, backgroundColor: '#1e293b' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  online: { backgroundColor: '#059669' },
  offline: { backgroundColor: '#f59e0b' },
  forbidden: { backgroundColor: '#ef4444' },
  statusText: { fontSize: 10, fontWeight: '700', color: '#fff' },
  feedContainer: { flex: 1 },
  mainFeed: { flex: 1, backgroundColor: '#1e293b', margin: 12, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  feedPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  feedText: { fontSize: 18, fontWeight: '700', color: '#94a3b8', marginTop: 12 },
  feedSub: { fontSize: 14, color: '#64748b', marginTop: 4 },
  feedType: { fontSize: 12, color: '#475569', marginTop: 8 },
  feedOverlay: { position: 'absolute', top: 12, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between' },
  liveBadge: { color: '#ef4444', fontWeight: '800', fontSize: 12 },
  timestamp: { color: '#94a3b8', fontSize: 12 },
  gridContainer: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', padding: 8, gap: 8 },
  gridCell: { width: (width - 40) / 2, height: (width - 40) / 2 * 0.75, backgroundColor: '#1e293b', borderRadius: 8, overflow: 'hidden', position: 'relative' },
  gridPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  gridLabel: { fontSize: 12, color: '#94a3b8', marginTop: 4 },
  gridStatus: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4 },
  gridOnline: { backgroundColor: '#10b981' },
  gridOffline: { backgroundColor: '#f59e0b' },
  controls: { flexDirection: 'row', padding: 12, gap: 8, backgroundColor: '#1e293b' },
  controlBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 8, backgroundColor: '#334155', gap: 6 },
  controlBtnActive: { backgroundColor: '#3b82f6' },
  controlText: { fontSize: 12, color: '#94a3b8', fontWeight: '600' },
  controlTextActive: { color: '#fff' },
  cameraList: { maxHeight: 60, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: '#1e293b' },
  cameraChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8, gap: 6 },
  cameraChipActive: { backgroundColor: '#3b82f6' },
  cameraChipForbidden: { backgroundColor: '#451a1a', borderWidth: 1, borderColor: '#ef4444' },
  cameraChipText: { fontSize: 12, color: '#94a3b8' },
  cameraChipTextActive: { color: '#fff', fontWeight: '600' },
  cameraChipTextForbidden: { color: '#ef4444' },
  cameraStatus: { width: 6, height: 6, borderRadius: 3 },
  statusOnline: { backgroundColor: '#10b981' },
  statusOffline: { backgroundColor: '#f59e0b' },
  statusForbidden: { backgroundColor: '#ef4444' },
  storageBar: { padding: 12, backgroundColor: '#1e293b', borderTopWidth: 1, borderTopColor: '#334155' },
  storageText: { fontSize: 12, color: '#94a3b8', marginBottom: 6 },
  storageTrack: { height: 4, backgroundColor: '#334155', borderRadius: 2 },
  storageFill: { height: '100%', backgroundColor: '#3b82f6', borderRadius: 2 },
});
