import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { useMRecordings, useMVideos } from '@/lib/services/mstudio-hooks';
import { useAuthStore } from '@/lib/auth/store/auth.store';

export default function StudioRecordingScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const { create: createRecording } = useMRecordings(user?.id);
  const { create: createVideo } = useMVideos();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<any>(null);

  if (!permission) return <View style={{ flex: 1, backgroundColor: '#0a0a0a' }} />;
  if (!permission.granted) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0a0a0a', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: '#fff', marginBottom: 16 }}>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission} style={{ backgroundColor: '#ff0000', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 }}>
          <Text style={{ color: '#fff' }}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const startRecording = async () => {
    if (!cameraRef.current || !user?.id) return;
    setIsRecording(true);
    setRecordingDuration(0);
    timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000);
    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 300 });
      clearInterval(timerRef.current);
      setIsRecording(false);
      if (video?.uri) {
        // Create video record
        const newVideo = await createVideo({
          user_id: user.id,
          studio_id: user.id,
          title: `Recording ${new Date().toLocaleString()}`,
          video_url: video.uri,
          duration: recordingDuration,
          visibility: 'draft',
        });
        await createRecording({ user_id: user.id, video_id: newVideo?.id, file_url: video.uri, duration: recordingDuration });
        Alert.alert('Saved', 'Recording saved to drafts');
        router.push('/(os)/studio/dashboard' as any);
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
        <View style={{ position: 'absolute', top: 48, left: 16, right: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>{isRecording ? formatTime(recordingDuration) : 'Ready'}</Text>
          {isRecording && <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: '#ff0000' }} />}
        </View>

        <View style={{ position: 'absolute', bottom: 48, left: 0, right: 0, alignItems: 'center' }}>
          <TouchableOpacity
            onPress={isRecording ? stopRecording : startRecording}
            style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isRecording ? '#fff' : '#ff0000', borderWidth: 4, borderColor: isRecording ? '#ff0000' : '#fff', alignItems: 'center', justifyContent: 'center' }}
          >
            <View style={{ width: isRecording ? 24 : 56, height: isRecording ? 24 : 56, borderRadius: isRecording ? 4 : 28, backgroundColor: isRecording ? '#ff0000' : '#fff' }} />
          </TouchableOpacity>
        </View>
      </CameraView>
    </View>
  );
}
