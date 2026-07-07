import { useState, useEffect, useCallback, useRef } from 'react';
import { Camera } from 'expo-camera';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';
import {
  getCameraStatus,
  startLivePreview,
  stopLivePreview,
  captureSnapshot,
  toggleTorch,
  setZoom,
  enableNightMode,
  muteMicrophone,
  updateRecordingConfig,
  getRecordingConfig,
  DEFAULT_RECORDING_CONFIG,
  type RecordingConfig,
} from '@/lib/services/camera.service';

export interface UseCameraOptions {
  deviceId?: string;
  autoStart?: boolean;
  recordingConfig?: Partial<RecordingConfig>;
}

export interface CameraState {
  isReady: boolean;
  isRecording: boolean;
  isLive: boolean;
  isLoading: boolean;
  error: string | null;
  batteryLevel?: number;
  storageRemaining?: number;
  signalStrength?: number;
  torchOn: boolean;
  zoom: number;
  nightMode: boolean;
  microphoneMuted: boolean;
  config: RecordingConfig;
}

export function useCamera(options: UseCameraOptions = {}) {
  const { deviceId, autoStart = false, recordingConfig } = options;
  const cameraRef = useRef<Camera | null>(null);

  const [state, setState] = useState<CameraState>({
    isReady: false,
    isRecording: false,
    isLive: false,
    isLoading: false,
    error: null,
    torchOn: false,
    zoom: 1,
    nightMode: false,
    microphoneMuted: false,
    config: DEFAULT_RECORDING_CONFIG,
  });

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  // Request permissions on mount
  useEffect(() => {
    (async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync();
      const { status: audioStatus } = await Camera.requestMicrophonePermissionsAsync();
      const { status: mediaStatus } = await MediaLibrary.requestPermissionsAsync();

      setHasPermission(
        cameraStatus === 'granted' &&
        audioStatus === 'granted' &&
        mediaStatus === 'granted'
      );
    })();
  }, []);

  // Load config if deviceId provided
  useEffect(() => {
    if (deviceId) {
      loadDeviceConfig();
    }
  }, [deviceId]);

  const loadDeviceConfig = useCallback(async () => {
    if (!deviceId) return;
    try {
      const config = await getRecordingConfig(deviceId);
      setState(prev => ({ ...prev, config }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [deviceId]);

  const startPreview = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      if (deviceId) {
        await startLivePreview(deviceId);
      }
      setState(prev => ({ ...prev, isLive: true, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, [deviceId]);

  const stopPreview = useCallback(async () => {
    try {
      if (deviceId) {
        await stopLivePreview(deviceId);
      }
      setState(prev => ({ ...prev, isLive: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [deviceId]);

  const startRecording = useCallback(async (onFinish?: (video: any) => void) => {
    if (!cameraRef.current) {
      setState(prev => ({ ...prev, error: 'Camera not ready' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const video = await cameraRef.current.recordAsync({
        quality: state.config.resolution as any,
        mute: state.microphoneMuted,
      });
      setState(prev => ({ ...prev, isRecording: true, isLoading: false }));

      if (video && onFinish) {
        onFinish(video);
      }
    } catch (err: any) {
      setState(prev => ({ ...prev, isLoading: false, error: err.message }));
    }
  }, [state.config.resolution, state.microphoneMuted]);

  const stopRecording = useCallback(async () => {
    if (!cameraRef.current) return;
    try {
      await cameraRef.current.stopRecording();
      setState(prev => ({ ...prev, isRecording: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, []);

  const takeSnapshot = useCallback(async () => {
    if (deviceId) {
      return captureSnapshot(deviceId);
    }
    if (!cameraRef.current) return null;
    try {
      const photo = await cameraRef.current.takePictureAsync();
      return photo;
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
      return null;
    }
  }, [deviceId]);

  const toggleTorchLight = useCallback(async () => {
    const newState = !state.torchOn;
    try {
      if (deviceId) {
        await toggleTorch(deviceId, newState);
      }
      setState(prev => ({ ...prev, torchOn: newState }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [state.torchOn, deviceId]);

  const setZoomLevel = useCallback(async (level: number) => {
    const clamped = Math.max(1, Math.min(level, 10));
    try {
      if (deviceId) {
        await setZoom(deviceId, clamped);
      }
      setState(prev => ({ ...prev, zoom: clamped }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [deviceId]);

  const toggleNightMode = useCallback(async () => {
    const newState = !state.nightMode;
    try {
      if (deviceId) {
        await enableNightMode(deviceId, newState);
      }
      setState(prev => ({ ...prev, nightMode: newState }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [state.nightMode, deviceId]);

  const toggleMicrophone = useCallback(async () => {
    const newState = !state.microphoneMuted;
    try {
      if (deviceId) {
        await muteMicrophone(deviceId, newState);
      }
      setState(prev => ({ ...prev, microphoneMuted: newState }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [state.microphoneMuted, deviceId]);

  const updateConfig = useCallback(async (updates: Partial<RecordingConfig>) => {
    const newConfig = { ...state.config, ...updates };
    try {
      if (deviceId) {
        await updateRecordingConfig(deviceId, updates);
      }
      setState(prev => ({ ...prev, config: newConfig }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message }));
    }
  }, [state.config, deviceId]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    cameraRef,
    ...state,
    hasPermission,
    startPreview,
    stopPreview,
    startRecording,
    stopRecording,
    takeSnapshot,
    toggleTorch: toggleTorchLight,
    setZoom: setZoomLevel,
    toggleNightMode,
    toggleMicrophone,
    updateConfig,
    clearError,
  };
}
