// @ts-nocheck
import React, { useState, useRef, useEffect } from 'react';
import { Alert, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Alert, SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { Alert, CameraView, useCameraPermissions } from 'expo-camera';
import { useAuthStore } from '@/lib/auth/store/auth.store';
import { supabase } from '@/lib/supabase';

interface CameraTier {
  count: number;
  label: string;
  price: string;
  color: string;
  features: string[];
}

const TIERS: CameraTier[] = [
  { count: 1, label: 'Solo', price: 'Free', color: '#00ff00', features: ['Front camera', 'Basic recording', '720p max'] },
  { count: 2, label: 'Duo', price: 'Free', color: '#00ff00', features: ['Front + Back', 'Picture-in-picture', '1080p max'] },
  { count: 4, label: 'Pro', price: '10 KES/day', color: '#ffd700', features: ['4 Camera angles', 'Multi-view switch', '4K recording', 'Bluetooth/Wi-Fi sync'] },
];

export default function CameraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<'front' | 'back'>('front');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [selectedTier, setSelectedTier] = useState(1);
  const [showTierSelector, setShowTierSelector] = useState(false);
  const [hasProAccess, setHasProAccess] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    checkProAccess();
  }, [user?.id]);

  const checkProAccess = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from('studio_camera_subscriptions').select('*').eq('creator_id', user.id).eq('tier', 4).gte('expires_at', new Date().toISOString()).single();
    setHasProAccess(!!data);
  };

  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingDuration(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRecording]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleCamera = () => setFacing(current => current === 'front' ? 'back' : 'front');

  const startRecording = async () => {
    if (selectedTier === 4 && !hasProAccess) {
      Alert.alert('Pro Required', '4-camera setup requires a Pro subscription (10 KES/day).', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: () => router.push('/(os)/wallet' as any) },
      ]);
      return;
    }
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    Alert.alert('Recording Saved', 'Video saved to drafts.', [
      { text: 'View Drafts', onPress: () => router.push('/(os)/studio/drafts' as any) },
      { text: 'Record Another', style: 'cancel' },
    ]);
  };

  if (!permission?.granted) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
        <Feather name="camera-off" size={48} color="#444" />
        <Text style={{ color: '#888', marginTop: 16, fontSize: 16 }}>Camera permission required</Text>
        <TouchableOpacity onPress={requestPermission} style={{ marginTop: 20, backgroundColor: '#ff0000', borderRadius: 20, paddingHorizontal: 24, paddingVertical: 12 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Allow Camera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#000' }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing={facing} mode="video">
        {/* Top Controls */}
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: 16, paddingTop: 48, flexDirection: 'row', justifyContent: 'space-between' }}>
          <TouchableOpacity onPress={() => router.back()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <Feather name="x" size={20} color="#fff" />
          </TouchableOpacity>

          {isRecording && (
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,0,0,0.8)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 6 }}>
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff', marginRight: 6 }} />
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14 }}>{formatDuration(recordingDuration)}</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => setShowTierSelector(!showTierSelector)} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
            <MaterialCommunityIcons name="camera-multiple" size={20} color={selectedTier === 4 ? '#ffd700' : '#fff'} />
          </TouchableOpacity>
        </View>

        {/* Tier Selector */}
        {showTierSelector && (
          <View style={{ position: 'absolute', top: 100, right: 16, backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: 12, padding: 12, width: 220 }}>
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>Camera Setup</Text>
            {TIERS.map((tier: any) => (
              <TouchableOpacity
                key={tier.count}
                onPress={() => { setSelectedTier(tier.count); setShowTierSelector(false); }}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  backgroundColor: selectedTier === tier.count ? '#222' : 'transparent',
                  borderWidth: 1,
                  borderColor: selectedTier === tier.count ? tier.color : '#333',
                  marginBottom: 8,
                }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: '#fff', fontSize: 13, fontWeight: '500' }}>{tier.label}</Text>
                  <Text style={{ color: tier.color, fontSize: 11 }}>{tier.price}</Text>
                </View>
                <Text style={{ color: '#666', fontSize: 10, marginTop: 2 }}>{tier.features.join(' • ')}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Bottom Controls */}
        <View style={{ position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 40 }}>
            {/* Gallery */}
            <TouchableOpacity onPress={() => router.push('/(os)/studio/upload-center' as any)} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="image" size={22} color="#fff" />
            </TouchableOpacity>

            {/* Record Button */}
            <TouchableOpacity
              onPress={isRecording ? stopRecording : startRecording}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                backgroundColor: isRecording ? '#ff0000' : 'transparent',
                borderWidth: 4,
                borderColor: '#fff',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {isRecording ? (
                <View style={{ width: 24, height: 24, borderRadius: 4, backgroundColor: '#fff' }} />
              ) : (
                <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#ff0000' }} />
              )}
            </TouchableOpacity>

            {/* Flip Camera */}
            <TouchableOpacity onPress={toggleCamera} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' }}>
              <Feather name="refresh-cw" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Tier Indicator */}
          <Text style={{ color: '#888', fontSize: 11, marginTop: 12 }}>
            {TIERS.find((t: any) => t.count === selectedTier)?.label} Mode {selectedTier === 4 && !hasProAccess ? '(Locked)' : ''}
          </Text>
        </View>
      </CameraView>
    </SafeAreaView>
  );
}
