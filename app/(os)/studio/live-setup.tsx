import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LiveSetupScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLive, setIsLive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [token, setToken] = useState('');

  const startLiveStream = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const roomId = `room-${user.id}-${Date.now()}`;
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: { room_id: roomId, user_id: user.id, is_host: true }
      });
      
      if (error) throw error;
      
      setRoomName(roomId);
      setToken(data.token);
      setIsLive(true);
      
      await supabase.from('streets_live_streams').insert({
        host_id: user.id,
        room_id: roomId,
        is_active: true,
        started_at: new Date().toISOString(),
      });
      
      Alert.alert('Live!', 'You are now broadcasting live.');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to start stream');
    } finally {
      setLoading(false);
    }
  };

  const endLiveStream = async () => {
    try {
      await supabase
        .from('streets_live_streams')
        .update({ is_active: false })
        .eq('room_id', roomName);
      
      setIsLive(false);
      setToken('');
      setRoomName('');
      router.back();
    } catch (e: any) {
      console.error('Failed to end stream:', e);
    }
  };

  return (
    <View style={styles.container}>
      {token ? (
        <LiveKitRoom
          serverUrl="wss://mtaa-os-8b03b45b.livekit.cloud"
          token={token}
          audio={true}
          video={true}
        >
          <LocalVideoPreview />
        </LiveKitRoom>
      ) : (
        <View style={styles.center}>
          <Text style={styles.text}>Ready to go live?</Text>
          <TouchableOpacity style={styles.goLiveBtn} onPress={startLiveStream} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.goLiveText}>GO LIVE</Text>}
          </TouchableOpacity>
        </View>
      )}
      
      {isLive && (
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={endLiveStream}><Ionicons name="close" size={28} color="#fff" /></TouchableOpacity>
            <View style={styles.liveBadge}><Text style={styles.liveText}>● LIVE</Text></View>
            <View style={{ width: 28 }} />
          </View>
        </View>
      )}
    </View>
  );
}

function LocalVideoPreview() {
  const tracks = useTracks([Track.Source.Camera]);
  const localTrack = tracks.find((t) => t.participant.isLocal);
  
  if (!localTrack) return <View style={styles.center}><ActivityIndicator color="#fff" /></View>;
  
  return (
    <View style={styles.localPreview}>
      <VideoTrack trackRef={localTrack} style={styles.videoTrack} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  localPreview: { position: 'absolute', bottom: 100, right: 10, width: 100, height: 150, borderRadius: 12, overflow: 'hidden', borderWidth: 2, borderColor: '#fff', backgroundColor: '#222' },
  videoTrack: { flex: 1, width: '100%', height: '100%' },
  overlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'flex-start', padding: 20, paddingTop: 60 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  liveBadge: { backgroundColor: '#ff0040', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  liveText: { color: '#fff', fontWeight: '800', fontSize: 12 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 18, marginBottom: 24, fontWeight: '600' },
  goLiveBtn: { backgroundColor: '#ff0040', paddingHorizontal: 40, paddingVertical: 16, borderRadius: 30 },
  goLiveText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
