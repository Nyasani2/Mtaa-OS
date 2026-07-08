import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useMRecordings, useMVideos } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioCameraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const { create: createRecording } = useMRecordings(user?.id);
  const { create: createVideo } = useMVideos();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<any>(null);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', marginBottom: 16, fontSize: 16 }}>Camera access required</Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: '#ff0000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: '600' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current || !user?.id) return;
    setIsRecording(true);
    setDuration(0);
    timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 600 });
      clearInterval(timerRef.current);
      setIsRecording(false);
      if (video?.uri) {
        const newVideo = await createVideo({
          user_id: user.id,
          studio_id: user.id,
          title: `Clip ${new Date().toLocaleString()}`,
          video_url: video.uri,
          duration,
          visibility: 'draft',
        });
        await createRecording({ user_id: user.id, video_id: newVideo?.id, file_url: video.uri, duration });
        Alert.alert('Saved', 'Clip saved to drafts', [
          { text: 'Continue', style: 'cancel' },
          { text: 'Edit', onPress: () => router.push(`/(os)/studio/editor?videoId=${newVideo?.id}`) },
        ]);
      }
    } catch (e) {
      clearInterval(timerRef.current);
      setIsRecording(false);
      Alert.alert('Error', 'Recording failed');
    }
  };

  const stopRecording = () => {
    cameraRef.current?.stopRecording();
    clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  return (
    <View style={{ flex: 1, backgroundColor: '#0a0a0a' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} mode="video">
        {/* Top HUD */}
        <View style={{ position: 'absolute', top: 48, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#00000088', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
            <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{isRecording ? formatTime(duration) : 'Ready'}</Text>
          </View>
          {isRecording && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#00000088', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 }}>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ff0000', marginRight: 6 }} />
              <Text style={{ color: '#fff', fontSize: 12, fontWeight: '600' }}>REC</Text>
            </View>
          )}
        </View>

        {/* Bottom Controls */}
        <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: isRecording ? '#fff' : '#ff0000',
              borderWidth: 4, borderColor: isRecording ? '#ff0000' : '#fff',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <View style={{
              width: isRecording ? 28 : 64, height: isRecording ? 28 : 64,
              borderRadius: isRecording ? 4 : 32,
              backgroundColor: isRecording ? '#ff0000' : '#fff',
            }} />
          </TouchableOpacity>
          <Text style={{ color: '#fff', marginTop: 12, fontSize: 13 }}>{isRecording ? 'Tap to stop' : 'Tap to record'}</Text>
        </View>
      </CameraView>
    </View>
  );
}
