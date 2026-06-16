import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions, Alert
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';

const { width, height } = Dimensions.get('window');

interface ConnectedPhone {
  id: string;
  name: string;
  isActive: boolean;
  isMain: boolean;
}

export default function RecordingScreen() {
  const { cameraMode, maxPhones } = useLocalSearchParams();
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraType, setCameraType] = useState<'back' | 'front'>('back');
  const [flashMode, setFlashMode] = useState<'off' | 'on' | 'auto'>('off');
  const [connectedPhones, setConnectedPhones] = useState<ConnectedPhone[]>([
    { id: 'local', name: 'This Phone', isActive: true, isMain: true },
  ]);
  const [showPhoneSelector, setShowPhoneSelector] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setRecordingTime(0);
      Alert.alert(
        'Recording Saved',
        'Your video has been saved to drafts.',
        [
          { text: 'Edit Now', onPress: () => router.push('/(os)/studio/editor') },
          { text: 'Done', onPress: () => router.back() },
        ]
      );
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const switchCamera = () => {
    setCameraType((prev) => (prev === 'back' ? 'front' : 'back'));
  };

  const cycleFlash = () => {
    setFlashMode((prev) => {
      if (prev === 'off') return 'on';
      if (prev === 'on') return 'auto';
      return 'off';
    });
  };

  const switchMainPhone = (phoneId: string) => {
    setConnectedPhones((prev) =>
      prev.map((p) => ({ ...p, isMain: p.id === phoneId }))
    );
    setShowPhoneSelector(false);
  };

  const addMockPhone = () => {
    if (connectedPhones.length >= parseInt(maxPhones as string || '2')) {
      Alert.alert('Limit Reached', `Maximum ${maxPhones} phones allowed on your tier.`);
      return;
    }
    const newPhone: ConnectedPhone = {
      id: `phone_${Date.now()}`,
      name: `Phone ${connectedPhones.length + 1}`,
      isActive: true,
      isMain: false,
    };
    setConnectedPhones((prev) => [...prev, newPhone]);
  };

  if (!permission?.granted) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera Preview */}
      <CameraView
        style={styles.cameraPreview}
        facing={cameraType}
        flash={flashMode}
        mode="video"
      >
        {/* Top Overlay */}
        <View style={styles.topOverlay}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color="#FFF" />
          </TouchableOpacity>

          <View style={styles.recordingIndicator}>
            {isRecording && (
              <>
                <View style={styles.recordingDot} />
                <Text style={styles.recordingTime}>{formatTime(recordingTime)}</Text>
              </>
            )}
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={cycleFlash}>
            <Ionicons
              name={flashMode === 'off' ? 'flash-off' : flashMode === 'on' ? 'flash' : 'flash-outline'}
              size={24}
              color="#FFF"
            />
          </TouchableOpacity>
        </View>

        {/* Connected Phones Strip */}
        {connectedPhones.length > 1 && (
          <View style={styles.phoneStrip}>
            {connectedPhones.map((phone) => (
              <TouchableOpacity
                key={phone.id}
                style={[styles.phoneThumb, phone.isMain && styles.phoneThumbMain]}
                onPress={() => phone.id !== 'local' && switchMainPhone(phone.id)}
              >
                <Ionicons name="phone-portrait" size={16} color={phone.isMain ? '#FFF' : '#94A3B8'} />
                <Text style={[styles.phoneThumbText, phone.isMain && styles.phoneThumbTextMain]} numberOfLines={1}>
                  {phone.name}
                </Text>
                {phone.isMain && <View style={styles.mainBadge}><Text style={styles.mainBadgeText}>LIVE</Text></View>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity style={styles.addPhoneBtn} onPress={addMockPhone}>
              <Ionicons name="add" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomControls}>
          <TouchableOpacity style={styles.sideBtn} onPress={switchCamera}>
            <Ionicons name="camera-reverse" size={28} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
            onPress={toggleRecording}
          >
            <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.sideBtn} onPress={() => router.push('/(os)/studio/drafts')}>
            <Ionicons name="albums" size={28} color="#FFF" />
          </TouchableOpacity>
        </View>
      </CameraView>

      {/* Mode Indicator */}
      <View style={styles.modeBar}>
        <Text style={styles.modeText}>{(cameraMode as string)?.toUpperCase() || 'STANDARD'} MODE</Text>
        <Text style={styles.modeSubtext}>{connectedPhones.length}/{maxPhones || 2} phones • {cameraType === 'back' ? 'Rear' : 'Front'} camera</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  cameraPreview: { flex: 1 },
  permissionText: { fontSize: 16, color: '#F1F5F9', marginBottom: 16 },
  permissionBtn: { backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  permissionBtnText: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  topOverlay: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 16,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  recordingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  recordingDot: {
    width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444',
  },
  recordingTime: { fontSize: 16, color: '#FFF', fontWeight: '700', fontFamily: 'monospace' },
  phoneStrip: {
    flexDirection: 'row', gap: 8,
    paddingHorizontal: 16, marginTop: 'auto', marginBottom: 20,
  },
  phoneThumb: {
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    alignItems: 'center', minWidth: 60,
    borderWidth: 1, borderColor: 'transparent',
  },
  phoneThumbMain: { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.2)' },
  phoneThumbText: { fontSize: 10, color: '#94A3B8', marginTop: 2 },
  phoneThumbTextMain: { color: '#FFF', fontWeight: '700' },
  mainBadge: {
    backgroundColor: '#EF4444', borderRadius: 4,
    paddingHorizontal: 4, paddingVertical: 1, marginTop: 2,
  },
  mainBadgeText: { fontSize: 8, color: '#FFF', fontWeight: '800' },
  addPhoneBtn: {
    backgroundColor: 'rgba(59,130,246,0.3)', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 8,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: '#3B82F6', borderStyle: 'dashed',
  },
  bottomControls: {
    flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center',
    paddingHorizontal: 40, paddingBottom: 40, marginTop: 'auto',
  },
  sideBtn: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center',
  },
  recordBtn: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center',
    borderWidth: 4, borderColor: '#FFF',
  },
  recordBtnActive: { borderColor: '#EF4444' },
  recordInner: {
    width: 60, height: 60, borderRadius: 30, backgroundColor: '#EF4444',
  },
  recordInnerActive: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: '#EF4444',
  },
  modeBar: {
    backgroundColor: '#0F172A', paddingHorizontal: 16, paddingVertical: 12,
    borderTopWidth: 1, borderTopColor: '#1E293B',
  },
  modeText: { fontSize: 13, fontWeight: '700', color: '#F1F5F9' },
  modeSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
});
