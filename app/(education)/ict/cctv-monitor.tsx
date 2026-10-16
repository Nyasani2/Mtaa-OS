import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function CCTVMonitorScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cameras, setCameras] = useState<any[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<any>(null);

  useEffect(() => {
    loadCameras();
  }, []);

  const loadCameras = async () => {
    try {
      const { data } = await supabase.from('education_security_cameras').select('*').order('name');
      setCameras(data || []);
      if (data && data.length > 0 && !selectedCamera) setSelectedCamera(data[0]);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#3b82f6" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="arrow-back" size={24} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>CCTV Monitor</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cameraTabs}>
        {cameras.map((cam) => (
          <TouchableOpacity key={cam.id} style={[styles.cameraTab, selectedCamera?.id === cam.id && styles.cameraTabActive]} onPress={() => setSelectedCamera(cam)}>
            <Ionicons name={cam.camera_type === 'dome' ? 'radio-button-on' : 'videocam'} size={16} color={selectedCamera?.id === cam.id ? '#fff' : '#94a3b8'} />
            <Text style={[styles.cameraTabText, selectedCamera?.id === cam.id && styles.cameraTabTextActive]}>{cam.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {selectedCamera && (
        <View style={styles.feedContainer}>
          <View style={styles.feedHeader}>
            <Text style={styles.feedTitle}>{selectedCamera.name} - {selectedCamera.location}</Text>
            <View style={[styles.recBadge, selectedCamera.recording ? styles.recording : styles.notRecording]}>
              <View style={[styles.recDot, { backgroundColor: selectedCamera.recording ? '#ef4444' : '#64748b' }]} />
              <Text style={styles.recText}>{selectedCamera.recording ? 'REC' : 'OFFLINE'}</Text>
            </View>
          </View>
          
          <View style={styles.videoPlaceholder}>
            {selectedCamera.stream_url ? (
              <Image source={{ uri: selectedCamera.stream_url }} style={styles.videoImage} resizeMode="cover" />
            ) : (
              <View style={styles.placeholderInner}>
                <Ionicons name="videocam-off" size={48} color="#475569" />
                <Text style={styles.placeholderText}>No Stream URL Configured</Text>
                <Text style={styles.placeholderSub}>Connect camera stream in settings</Text>
              </View>
            )}
          </View>
          
          <View style={styles.feedFooter}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={[styles.statusDot, { backgroundColor: selectedCamera.status === 'online' ? '#10b981' : '#ef4444' }]} />
              <Text style={styles.statusText}>{selectedCamera.status.toUpperCase()}</Text>
            </View>
            <Text style={styles.timeText}>{new Date().toLocaleTimeString()}</Text>
          </View>
        </View>
      )}

      <ScrollView style={styles.cameraList}>
        <Text style={styles.listTitle}>All Cameras</Text>
        {cameras.map((cam) => (
          <TouchableOpacity key={cam.id} style={styles.listItem} onPress={() => setSelectedCamera(cam)}>
            <View style={[styles.listIcon, { backgroundColor: cam.status === 'online' ? '#10b98120' : '#ef444420' }]}>
              <Ionicons name="videocam" size={20} color={cam.status === 'online' ? '#10b981' : '#ef4444'} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{cam.name}</Text>
              <Text style={styles.listLocation}>{cam.location}</Text>
            </View>
            <View style={[styles.listBadge, { backgroundColor: cam.recording ? '#ef4444' : '#64748b' }]}>
              <Text style={styles.listBadgeText}>{cam.recording ? 'REC' : 'OFF'}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16, backgroundColor: '#1e293b', borderBottomWidth: 1, borderBottomColor: '#334155' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff', flex: 1, textAlign: 'center' },
  cameraTabs: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: '#334155' },
  cameraTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#1e293b', marginRight: 8, borderWidth: 1, borderColor: '#334155' },
  cameraTabActive: { backgroundColor: '#3b82f6', borderColor: '#3b82f6' },
  cameraTabText: { fontSize: 12, color: '#94a3b8' },
  cameraTabTextActive: { color: '#fff', fontWeight: '600' },
  feedContainer: { margin: 16, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' },
  feedHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#1e293b' },
  feedTitle: { color: '#fff', fontSize: 14, fontWeight: '600', flex: 1 },
  recBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  recording: { backgroundColor: '#ef444420' },
  notRecording: { backgroundColor: '#334155' },
  recDot: { width: 8, height: 8, borderRadius: 4 },
  recText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  videoPlaceholder: { width: '100%', aspectRatio: 16/9, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  videoImage: { width: '100%', height: '100%' },
  placeholderInner: { alignItems: 'center' },
  placeholderText: { color: '#475569', fontSize: 14, marginTop: 8 },
  placeholderSub: { color: '#334155', fontSize: 12, marginTop: 4 },
  feedFooter: { flexDirection: 'row', justifyContent: 'space-between', padding: 12, backgroundColor: '#1e293b' },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  timeText: { color: '#94a3b8', fontSize: 12 },
  cameraList: { flex: 1, paddingHorizontal: 16 },
  listTitle: { color: '#fff', fontSize: 16, fontWeight: '700', marginBottom: 12 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1e293b', borderRadius: 12, padding: 14, marginBottom: 10 },
  listIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listName: { fontSize: 14, fontWeight: '600', color: '#fff' },
  listLocation: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  listBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  listBadgeText: { color: '#fff', fontSize: 10, fontWeight: '700' },
});
