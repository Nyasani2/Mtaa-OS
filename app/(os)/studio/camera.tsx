import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions, CameraType, FlashMode } from 'expo-camera';
import { useAuthStore } from '@/lib/auth/store/auth.store';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

export default function AdvancedCameraScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [facing, setFacing] = useState<CameraType>('back');
  const [flash, setFlash] = useState<FlashMode>('off');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [iso, setIso] = useState(100);
  const [exposure, setExposure] = useState(0);
  const [whiteBalance, setWhiteBalance] = useState('auto');
  const [focus, setFocus] = useState('auto');
  const [resolution, setResolution] = useState('1080p');
  const [frameRate, setFrameRate] = useState(30);
  const [stabilization, setStabilization] = useState(true);
  const [hdr, setHdr] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showTeleprompter, setShowTeleprompter] = useState(false);
  const [teleprompterText, setTeleprompterText] = useState('');
  const [timerActive, setTimerActive] = useState(false);
  const [beautyFilter, setBeautyFilter] = useState(false);
  const [greenScreen, setGreenScreen] = useState(false);
  const [pictureInPicture, setPictureInPicture] = useState(false);
  const [multiAngle, setMultiAngle] = useState(false);

  const recordTimerRef = useRef<NodeJS.Timeout | null>(null);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const wbOptions = ['auto', 'sunny', 'cloudy', 'shadow', 'fluorescent', 'incandescent'];
  const focusOptions = ['auto', 'continuous', 'manual'];
  const resolutionOptions = ['720p', '1080p', '4K', '8K'];
  const frameRateOptions = [24, 30, 60, 120];
  const isoOptions = [50, 100, 200, 400, 800, 1600, 3200];

  const toggleFacing = () => setFacing(f => f === 'back' ? 'front' : 'back');
  const toggleFlash = () => setFlash(f => f === 'off' ? 'on' : f === 'on' ? 'auto' : 'off');

  const startRecording = async () => {
    if (!cameraRef.current || isRecording) return;
    if (countdown > 0) {
      let count = countdown;
      setTimerActive(true);
      countdownRef.current = setInterval(() => {
        count--;
        if (count <= 0) {
          clearInterval(countdownRef.current!);
          setTimerActive(false);
          doStartRecording();
        }
      }, 1000);
      return;
    }
    doStartRecording();
  };

  const doStartRecording = async () => {
    setIsRecording(true);
    setRecordingDuration(0);
    recordTimerRef.current = setInterval(() => {
      setRecordingDuration(d => d + 1);
    }, 1000);
    try {
      const video = await cameraRef.current?.recordAsync({
        maxDuration: 3600,
        mute: false,
        videoQuality: resolution === '4K' ? '2160p' : resolution === '1080p' ? '1080p' : '720p',
      });
      if (video?.uri) {
        router.push({ pathname: '/(os)/studio/editor', params: { videoUri: video.uri } });
      }
    } catch (e) {
      console.error('Recording error:', e);
    }
  };

  const stopRecording = async () => {
    if (!cameraRef.current || !isRecording) return;
    if (recordTimerRef.current) clearInterval(recordTimerRef.current);
    setIsRecording(false);
    setRecordingDuration(0);
    cameraRef.current.stopRecording();
  };

  const formatDuration = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const flashIcon = () => {
    if (flash === 'on') return 'zap';
    if (flash === 'auto') return 'zap-off';
    return 'zap-off';
  };

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Loading camera...</Text>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.loadingText}>Camera permission required</Text>
        <TouchableOpacity style={styles.permissionBtn} onPress={requestPermission}>
          <Text style={styles.permissionText}>Grant Permission</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing={facing}
        flash={flash}
        mode="video"
        videoStabilizationMode={stabilization ? 'auto' : 'off'}
      >
        {/* Top Controls */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="x" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topControls}>
            <TouchableOpacity onPress={toggleFlash} style={styles.topBtn}>
              <Feather name={flashIcon()} size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowControls(!showControls)} style={styles.topBtn}>
              <Feather name="sliders" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowTeleprompter(!showTeleprompter)} style={styles.topBtn}>
              <Feather name="type" size={20} color={showTeleprompter ? '#6366f1' : '#fff'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Teleprompter Overlay */}
        {showTeleprompter && (
          <View style={styles.teleprompterBox}>
            <Text style={styles.teleprompterLabel}>TELEPROMPTER</Text>
            <Text style={styles.teleprompterText}>{teleprompterText || 'Tap to add script...'}</Text>
          </View>
        )}

        {/* Timer Overlay */}
        {timerActive && countdown > 0 && (
          <View style={styles.timerOverlay}>
            <Text style={styles.timerText}>{countdown}</Text>
          </View>
        )}

        {/* Recording Indicator */}
        {isRecording && (
          <View style={styles.recordingIndicator}>
            <View style={styles.recDot} />
            <Text style={styles.recText}>{formatDuration(recordingDuration)}</Text>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={styles.bottomArea}>
          {/* Quick Settings Row */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickSettings}>
            <TouchableOpacity style={[styles.quickBtn, hdr && styles.quickBtnActive]} onPress={() => setHdr(!hdr)}>
              <Text style={[styles.quickBtnText, hdr && styles.quickBtnTextActive]}>HDR</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, stabilization && styles.quickBtnActive]} onPress={() => setStabilization(!stabilization)}>
              <Text style={[styles.quickBtnText, stabilization && styles.quickBtnTextActive]}>STAB</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, beautyFilter && styles.quickBtnActive]} onPress={() => setBeautyFilter(!beautyFilter)}>
              <Text style={[styles.quickBtnText, beautyFilter && styles.quickBtnTextActive]}>BEAUTY</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, greenScreen && styles.quickBtnActive]} onPress={() => setGreenScreen(!greenScreen)}>
              <Text style={[styles.quickBtnText, greenScreen && styles.quickBtnTextActive]}>GREEN</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, pictureInPicture && styles.quickBtnActive]} onPress={() => setPictureInPicture(!pictureInPicture)}>
              <Text style={[styles.quickBtnText, pictureInPicture && styles.quickBtnTextActive]}>PIP</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, multiAngle && styles.quickBtnActive]} onPress={() => setMultiAngle(!multiAngle)}>
              <Text style={[styles.quickBtnText, multiAngle && styles.quickBtnTextActive]}>MULTI</Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Main Record Controls */}
          <View style={styles.recordRow}>
            <TouchableOpacity style={styles.galleryBtn} onPress={() => router.push('/(os)/studio/drafts')}>
              <Feather name="image" size={22} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.recordBtn, isRecording && styles.recordBtnActive]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <View style={[styles.recordInner, isRecording && styles.recordInnerActive]} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.flipBtn} onPress={toggleFacing}>
              <Feather name="refresh-cw" size={22} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Resolution / FPS Selector */}
          <View style={styles.resRow}>
            {resolutionOptions.map(r => (
              <TouchableOpacity key={r} onPress={() => setResolution(r)} style={[styles.resBtn, resolution === r && styles.resBtnActive]}>
                <Text style={[styles.resText, resolution === r && styles.resTextActive]}>{r}</Text>
              </TouchableOpacity>
            ))}
            <View style={styles.divider} />
            {frameRateOptions.map(f => (
              <TouchableOpacity key={f} onPress={() => setFrameRate(f)} style={[styles.resBtn, frameRate === f && styles.resBtnActive]}>
                <Text style={[styles.resText, frameRate === f && styles.resTextActive]}>{f}fps</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </CameraView>

      {/* Advanced Controls Panel (slide-up) */}
      {showControls && (
        <View style={styles.controlsPanel}>
          <View style={styles.panelHandle} />
          <ScrollView style={styles.panelScroll}>
            {/* ISO */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>ISO</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {isoOptions.map(v => (
                  <TouchableOpacity key={v} onPress={() => setIso(v)} style={[styles.controlValue, iso === v && styles.controlValueActive]}>
                    <Text style={[styles.controlValueText, iso === v && styles.controlValueTextActive]}>{v}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Exposure */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Exposure</Text>
              <View style={styles.sliderRow}>
                <TouchableOpacity onPress={() => setExposure(e => Math.max(-3, e - 0.5))}>
                  <Feather name="minus" size={16} color="#fff" />
                </TouchableOpacity>
                <Text style={styles.sliderValue}>{exposure >= 0 ? `+${exposure}` : exposure}</Text>
                <TouchableOpacity onPress={() => setExposure(e => Math.min(3, e + 0.5))}>
                  <Feather name="plus" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* White Balance */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>White Balance</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {wbOptions.map(w => (
                  <TouchableOpacity key={w} onPress={() => setWhiteBalance(w)} style={[styles.controlValue, whiteBalance === w && styles.controlValueActive]}>
                    <Text style={[styles.controlValueText, whiteBalance === w && styles.controlValueTextActive]}>{w}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Focus */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Focus</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {focusOptions.map(f => (
                  <TouchableOpacity key={f} onPress={() => setFocus(f)} style={[styles.controlValue, focus === f && styles.controlValueActive]}>
                    <Text style={[styles.controlValueText, focus === f && styles.controlValueTextActive]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Countdown Timer */}
            <View style={styles.controlRow}>
              <Text style={styles.controlLabel}>Countdown</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[0, 3, 5, 10].map(c => (
                  <TouchableOpacity key={c} onPress={() => setCountdown(c)} style={[styles.controlValue, countdown === c && styles.controlValueActive]}>
                    <Text style={[styles.controlValueText, countdown === c && styles.controlValueTextActive]}>{c === 0 ? 'Off' : `${c}s`}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  loadingText: { color: '#fff', textAlign: 'center', marginTop: 40, fontSize: 16 },
  permissionBtn: { backgroundColor: '#6366f1', padding: 16, borderRadius: 12, margin: 20, alignItems: 'center' },
  permissionText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingTop: 12 },
  topControls: { flexDirection: 'row', gap: 16 },
  topBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  teleprompterBox: { position: 'absolute', top: 80, left: 20, right: 20, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 12, padding: 16, borderLeftWidth: 3, borderLeftColor: '#6366f1' },
  teleprompterLabel: { color: '#6366f1', fontSize: 10, fontWeight: '800', marginBottom: 4, letterSpacing: 1 },
  teleprompterText: { color: '#fff', fontSize: 16, lineHeight: 24, fontWeight: '500' },

  timerOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.3)' },
  timerText: { color: '#fff', fontSize: 120, fontWeight: '800', textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 10 },

  recordingIndicator: { position: 'absolute', top: 60, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(239,68,68,0.9)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  recText: { color: '#fff', fontSize: 13, fontWeight: '700' },

  bottomArea: { position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: 30 },
  quickSettings: { paddingHorizontal: 16, marginBottom: 12 },
  quickBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.5)', marginRight: 8, borderWidth: 1, borderColor: 'transparent' },
  quickBtnActive: { backgroundColor: 'rgba(99,102,241,0.3)', borderColor: '#6366f1' },
  quickBtnText: { color: '#fff', fontSize: 11, fontWeight: '600' },
  quickBtnTextActive: { color: '#6366f1' },

  recordRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', marginBottom: 16 },
  galleryBtn: { width: 44, height: 44, borderRadius: 10, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  recordBtn: { width: 72, height: 72, borderRadius: 36, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  recordBtnActive: { borderColor: '#ef4444' },
  recordInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ef4444' },
  recordInnerActive: { width: 24, height: 24, borderRadius: 4, backgroundColor: '#ef4444' },
  flipBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  resRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, paddingHorizontal: 16 },
  resBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  resBtnActive: { backgroundColor: 'rgba(99,102,241,0.3)' },
  resText: { color: '#9ca3af', fontSize: 12, fontWeight: '600' },
  resTextActive: { color: '#6366f1' },
  divider: { width: 1, height: 16, backgroundColor: '#333' },

  controlsPanel: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(10,10,10,0.95)', borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 12, maxHeight: SCREEN_H * 0.45 },
  panelHandle: { width: 40, height: 4, backgroundColor: '#333', borderRadius: 2, alignSelf: 'center', marginBottom: 12 },
  panelScroll: { paddingHorizontal: 16, paddingBottom: 20 },
  controlRow: { marginBottom: 16 },
  controlLabel: { color: '#9ca3af', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  controlValue: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, backgroundColor: '#1f1f1f', marginRight: 8 },
  controlValueActive: { backgroundColor: '#6366f1' },
  controlValueText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  controlValueTextActive: { color: '#fff', fontWeight: '700' },
  sliderRow: { flexDirection: 'row', alignItems: 'center', gap: 16, backgroundColor: '#1f1f1f', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  sliderValue: { color: '#fff', fontSize: 14, fontWeight: '600', minWidth: 40, textAlign: 'center' },
});
