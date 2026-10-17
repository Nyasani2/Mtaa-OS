import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { LiveKitRoom, VideoTrack, useTracks } from '@livekit/react-native';
import { Track } from 'livekit-client';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function LiveViewerScreen() {
  const { room_id } = useLocalSearchParams();
  const { user } = useAuthStore();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getToken = async () => {
      if (!user?.id || !room_id) return;
      
      const { data, error } = await supabase.functions.invoke('generate-livekit-token', {
        body: { room_id, user_id: user.id, is_host: false }
      });
      
      if (error) {
        console.error('Failed to get token:', error);
      } else {
        setToken(data.token);
        
        try {
          await supabase.from('live_stream_viewers').insert({
            stream_id: room_id,
            user_id: user.id,
          });
        } catch (e) {
          // Ignore viewer tracking errors
        }
      }
      setLoading(false);
    };
    
    getToken();
  }, [room_id, user]);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" color="#ff0040" /></View>;
  }

  if (!token) {
    return <View style={styles.center}><Text style={styles.text}>Failed to load stream</Text></View>;
  }

  return (
    <LiveKitRoom
      serverUrl="wss://mtaa-os-8b03b45b.livekit.cloud"
      token={token}
      audio={true}
      video={true}
    >
      <VideoGrid />
    </LiveKitRoom>
  );
}

function VideoGrid() {
  const tracks = useTracks([Track.Source.Camera]);
  
  return (
    <View style={styles.container}>
      {tracks.map((trackRef: any) => (
        <VideoTrack
          key={trackRef.publication.sid}
          trackRef={trackRef}
          style={styles.video}
        />
      ))}
      {tracks.length === 0 && (
        <View style={styles.center}>
          <Text style={styles.text}>Waiting for stream...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  video: { flex: 1, width: '100%', height: '100%' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { color: '#fff', fontSize: 16 }
});
