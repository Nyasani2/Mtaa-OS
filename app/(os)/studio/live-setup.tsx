import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LiveSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    requestPermission();
  }, []);

  const goLive = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: { room_id: `room-${user.id}-${Date.now()}`, user_id: user.id }
      });
      if (error) throw error;
      setIsLive(true);
      Alert.alert('Broadcast Started', 'Your live stream is now active.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  if (!permission) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#ff0040" /></View>;
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.text}>We need your permission to show the camera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} facing={cameraType} />
      
      <View style={styles.overlay}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
          {isLive && <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE</Text></View>}
          <TouchableOpacity onPress={() => setCameraType(t => t === 'back' ? 'front' : 'back')}>
            <Ionicons name="camera-reverse" size={28} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomBar}>
          {!isLive ? (
            <TouchableOpacity style={styles.goLiveBtn} onPress={goLive} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.goLiveText}>GO LIVE</Text>}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.endBtn} onPress={() => { setIsLive(false); router.back(); }}>
              <Text style={styles.endText}>END BROADCAST</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between', padding: 20, paddingTop: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveBadge: { backgroundColor: '#ff0040', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  liveText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  bottomBar: { alignItems: 'center', paddingBottom: 40 },
  goLiveBtn: { backgroundColor: '#ff0040', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  goLiveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  endBtn: { backgroundColor: '#333', paddingHorizontal: 30, paddingVertical: 14, borderRadius: 30 },
  endText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' },
  text: { color: '#fff', fontSize: 16, marginBottom: 16 },
  btn: { backgroundColor: '#ff0040', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  btnText: { color: '#fff', fontWeight: 'bold' }
});
